export enum AgeBracket {
  TODDLER = '2-4 Years',
  EARLY_GRADE = '5-7 Years',
  OLDER_KID = '7+ Years',
}

export enum Language {
  ENGLISH = 'English',
  FRENCH = 'French',
  ARABIC = 'Arabic',
}

export enum StoryCategory {
  DISNEY = 'Disney & Pixar',
  SPORTS = 'Sports & Games',
  MAGIC = 'Magic & Fantasy',
  SPACE = 'Space & Robots',
  SCHOOL = 'School & Learning',
  SUPERHEROES = 'Superheroes & Actions',
  POLICE = 'Firefighters & Police',
  FAMILY = 'Family & Friendship',
  EMOTIONS = 'Emotions & Feelings',
  BEDTIME = 'Bedtime & Relaxation',
  ANIMALS = 'Animals & Dinosaurs',
  ADVENTURE = 'Adventure & Pirates',
}

export interface StoryMetadata {
  id: string;
  title: string;
  summary: string;
}

export interface Story extends StoryMetadata {
  category: StoryCategory;
  ageBracket: AgeBracket;
  language: Language;
  content?: string;
  wordCount?: number;
  isLoadingContent: boolean;
  coverImage?: string;
  isLoadingCover?: boolean;
}

export interface FilterState {
  category: StoryCategory;
  ageBracket: AgeBracket;
  language: Language;
}