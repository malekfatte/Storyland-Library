import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AgeBracket, Language, StoryCategory, StoryMetadata } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please check your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

const getAgeGuidelines = (age: AgeBracket): string => {
  switch (age) {
    case AgeBracket.TODDLER:
      return `
        - Word Count: Strictly 300–600 words.
        - Vocabulary: Strong and efficient.
        - Structure: Use repetition in sentences (repeat key lines across pages so children learn new words and anticipate what comes next). Use rhythm and rhyme. Simple sentences.
        - Elements: Include imagery and onomatopoeia (e.g., "ding dong", "woooosh", "boom"). Use descriptive words (adjectives & adverbs) to enhance imagination.
        - Pacing: Well-paced storytelling (not too fast, not too slow).
      `;
    case AgeBracket.EARLY_GRADE:
      return `
        - Word Count: Strictly 600–1,000 words.
        - Vocabulary: Strong vocabulary.
        - Structure: More complex sentences. Simple dialogue (when needed).
        - Elements: Simple problem and solution. Use descriptive words. Relatable storylines and characters. Emotional elements (happy, sad, worried, excited).
        - Pacing: Well-paced.
      `;
    case AgeBracket.OLDER_KID:
      return `
        - Word Count: Long and detailed (aim for approx 1500+ words).
        - Vocabulary: Strong vocabulary.
        - Structure: Complex dialogue and complex sentences.
        - Elements: Clear problem and solution. Story must teach a lesson or moral. Emotional elements. Relatable storylines and characters.
        - Interaction: Include questions within the text or at the end that the child can answer from clues or personal perspective.
      `;
    default:
      return "Write a high-quality children's story.";
  }
};

export const generateStoryList = async (
  category: StoryCategory,
  age: AgeBracket,
  language: Language
): Promise<StoryMetadata[]> => {
  const ai = getClient();
  
  const prompt = `Generate a list of exactly 10 creative and distinct children's story titles and one-sentence summaries.
  Target Audience: ${age} old children.
  Language: ${language}.
  Theme: ${category}.
  Ensure the titles are catchy and the summaries are engaging.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["title", "summary"],
          },
        },
      },
    });

    let rawJson = response.text;
    if (!rawJson) return [];

    // Clean up potential markdown code blocks (```json ... ```)
    rawJson = rawJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    
    const data = JSON.parse(rawJson) as { title: string; summary: string }[];
    
    return data.map((item, index) => ({
      id: `${category}-${age}-${language}-${index}-${Date.now()}`,
      title: item.title,
      summary: item.summary,
    }));
  } catch (error) {
    console.error("Error generating story list:", error);
    throw error;
  }
};

export const generateFullStory = async (
  title: string,
  summary: string,
  age: AgeBracket,
  language: Language,
  category: StoryCategory
): Promise<string> => {
  const ai = getClient();
  const guidelines = getAgeGuidelines(age);

  const prompt = `Write a complete children's story based on the following metadata:
  Title: "${title}"
  Summary: "${summary}"
  Target Audience: ${age}
  Language: ${language}.
  Category: ${category}.
  
  STORY GUIDELINES (STRICTLY FOLLOW):
  ${guidelines}
  
  General Formatting:
  1. Format with clear paragraphs using Markdown.
  2. Ensure the tone is appropriate for the category and culture of the language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Sorry, I couldn't generate the story content at this time.";
  } catch (error) {
    console.error("Error generating full story:", error);
    throw error;
  }
};

export const generateCoverImage = async (
  title: string,
  summary: string,
  category: StoryCategory
): Promise<string | null> => {
  const ai = getClient();

  // Enhanced prompt for "nano banana" (gemini-2.5-flash-image)
  const prompt = `A beautiful, high-quality children's book cover illustration for a story titled "${title}".
  Context/Summary: ${summary}.
  Theme: ${category}.
  Style: Vibrant digital art, 3D render style similar to Pixar/Disney, soft lighting, highly detailed, 4k.
  
  CRITICAL INSTRUCTION: 
  DO NOT INCLUDE TEXT. 
  NO TITLE. 
  NO WORDS. 
  NO LETTERS. 
  The image must be purely artwork with absolutely zero text elements on it.`;

  try {
    // Using gemini-2.5-flash-image (Nano Banana) with image modality
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    
    if (part && part.inlineData && part.inlineData.data) {
        // Construct the data URL from the base64 data
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating cover image:", error);
    return null; 
  }
};

export const analyzeImage = async (
  base64Image: string,
  promptText: string
): Promise<string> => {
  const ai = getClient();
  const model = "gemini-3-pro-preview";

  // Strip prefix if present (data:image/png;base64,) to get raw base64
  const base64Data = base64Image.split(',')[1] || base64Image;
  // Detect mimeType or default to png
  const mimeType = base64Image.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0] || 'image/png';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
            { 
                inlineData: { 
                    mimeType: mimeType, 
                    data: base64Data 
                } 
            },
            { text: promptText || "Describe this image in a way that a child would understand." }
        ]
      }
    });
    
    return response.text || "I could not analyze the image.";
  } catch (error) {
    console.error("Image analysis failed", error);
    return "Sorry, I had trouble seeing that image clearly. Please try again.";
  }
};