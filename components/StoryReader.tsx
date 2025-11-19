import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, BookOpen, Clock, PenTool } from 'lucide-react';
import { Story, Language } from '../types';

interface StoryReaderProps {
  story: Story;
  onClose: () => void;
}

const StoryReader: React.FC<StoryReaderProps> = ({ story, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [story.id]);

  const isArabic = story.language === Language.ARABIC;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                    <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                    <h2 className={`text-lg font-bold text-slate-800 truncate ${isArabic ? 'font-arabic' : ''}`}>
                        {story.title}
                    </h2>
                    <p className="text-sm text-slate-500 truncate">{story.category} • {story.ageBracket}</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            >
                <X size={24} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div 
            ref={contentRef}
            className={`flex-1 overflow-y-auto p-6 md:p-12 bg-[#fdfbf7] ${isArabic ? 'text-right' : 'text-left'}`}
        >
            {story.isLoadingContent ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium text-slate-700">Writing your story...</p>
                        <p className="text-sm text-slate-500">Creating a 10,000 character masterpiece just for you.</p>
                    </div>
                </div>
            ) : story.content ? (
                <div className={`max-w-3xl mx-auto prose prose-lg prose-slate prose-headings:font-bold prose-p:leading-relaxed ${isArabic ? 'font-arabic' : ''}`}>
                    <ReactMarkdown>{story.content}</ReactMarkdown>
                    
                    <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <span className="text-2xl">❦</span>
                        <p className="text-xs font-medium uppercase tracking-widest opacity-60 flex items-center gap-2">
                             Storyverse Original
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p>Content unavailable.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StoryReader;