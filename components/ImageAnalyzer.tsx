import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Send, Loader } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ImageAnalyzerProps {
  onClose: () => void;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResponse(""); // Clear previous response
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    try {
      const result = await analyzeImage(selectedImage, prompt);
      setResponse(result);
    } catch (error) {
      setResponse("Something went wrong while looking at the picture.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
            <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-yellow-300" />
                <h2 className="text-lg font-bold">Magic Lens</h2>
            </div>
            <button 
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Image Upload Area */}
            <div className="space-y-2">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer h-64 relative overflow-hidden
                        ${selectedImage ? 'border-indigo-200 bg-slate-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                >
                    {selectedImage ? (
                        <img src={selectedImage} alt="Uploaded" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-center text-slate-500">
                            <Upload className="mx-auto mb-3 text-slate-400" size={40} />
                            <p className="font-medium">Click to upload a photo</p>
                            <p className="text-xs text-slate-400 mt-1">We'll tell you a story about it!</p>
                        </div>
                    )}
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </div>
                {selectedImage && (
                    <button 
                        onClick={() => { setSelectedImage(null); setResponse(""); }}
                        className="text-xs text-red-500 hover:underline pl-1"
                    >
                        Remove image
                    </button>
                )}
            </div>

            {/* Input Area */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">What should we look for?</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., Tell me a story about this..."
                        className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedImage || isLoading}
                        className={`px-6 rounded-xl font-bold flex items-center gap-2 transition-all
                            ${!selectedImage || isLoading 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
                    >
                        {isLoading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </div>

            {/* Response Area */}
            {response && (
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Gemini Analysis</h3>
                    <div className="prose prose-sm prose-indigo max-w-none text-slate-700">
                        <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;