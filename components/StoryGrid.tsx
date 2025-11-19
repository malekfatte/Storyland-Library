import React from 'react';
import { Story, Language, AgeBracket } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { Play, Clock, FileText, ImageIcon, Loader, RefreshCw } from 'lucide-react';

interface StoryGridProps {
  stories: Story[];
  isLoading: boolean;
  onStoryClick: (story: Story) => void;
  onGenerate: () => void;
  onRegenerateCover: (story: Story) => void;
  hasStories: boolean;
}

const getLengthLabel = (story: Story) => {
    if (story.wordCount) {
        return `${story.wordCount} words`;
    }
    // Fallback calculation if wordCount property isn't set but content exists
    if (story.content) {
        return `${story.content.split(/\s+/).length} words`;
    }
    
    // Estimates based on bracket
    switch (story.ageBracket) {
        case AgeBracket.TODDLER: return "300-600 words";
        case AgeBracket.EARLY_GRADE: return "600-1k words";
        case AgeBracket.OLDER_KID: return "Long Story";
        default: return "Story";
    }
};

const StoryGrid: React.FC<StoryGridProps> = ({ stories, isLoading, onStoryClick, onGenerate, onRegenerateCover, hasStories }) => {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm h-96 p-0 animate-pulse flex flex-col overflow-hidden">
            <div className="h-48 bg-slate-200 w-full"></div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="h-6 bg-slate-100 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6 mb-2"></div>
                <div className="h-10 bg-slate-100 rounded w-full mt-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!hasStories) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-in fade-in duration-500">
        <div className="w-48 h-48 bg-indigo-50 rounded-full flex items-center justify-center mb-8">
            <span className="text-6xl">✨</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Ready to Spin Some Tales?</h2>
        <p className="text-lg text-slate-600 max-w-lg mb-8">
          Generate a collection of 10 unique stories for this category, age group, and language.
        </p>
        <button 
            onClick={onGenerate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center gap-3"
        >
            <Play fill="currentColor" size={20} />
            Generate 10 Stories
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 pb-20">
      {stories.map((story) => {
         const isArabic = story.language === Language.ARABIC;
         const categoryConfig = CATEGORY_CONFIG[story.category];
         const Icon = categoryConfig.icon;

         return (
            <div 
                key={story.id}
                onClick={() => onStoryClick(story)}
                className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden relative"
            >
                {/* Cover Image Area */}
                <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                    {story.coverImage ? (
                        <img 
                            src={story.coverImage} 
                            alt={story.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : story.isLoadingCover ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
                            <Loader className="animate-spin" size={24} />
                            <span className="text-xs font-medium">Painting cover...</span>
                        </div>
                    ) : (
                        <div className={`absolute inset-0 ${categoryConfig.color} opacity-10 flex items-center justify-center`}>
                            <Icon size={64} className={`${categoryConfig.color.replace('bg-', 'text-')} opacity-20`} />
                        </div>
                    )}
                    
                    {/* Colored line indicator at bottom of image */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${categoryConfig.color}`}></div>
                    
                    {/* Regenerate Button Overlay */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegenerateCover(story);
                        }}
                        title="Regenerate Cover"
                        className={`absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-600 hover:text-indigo-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10 shadow-sm
                        ${story.isLoadingCover ? 'hidden' : ''}`}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-wider`}>
                            Story
                        </span>
                        <div className="flex gap-2">
                             {story.content && (
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1" title="Story content ready">
                                    <FileText size={12} />
                                </span>
                            )}
                             {story.coverImage && (
                                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded flex items-center gap-1" title="Cover image ready">
                                    <ImageIcon size={12} />
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <h3 className={`text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors ${isArabic ? 'font-arabic' : ''}`}>
                        {story.title}
                    </h3>
                    
                    <p className={`text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1 ${isArabic ? 'font-arabic' : ''}`}>
                        {story.summary}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <div className="flex items-center text-slate-400 text-xs font-medium gap-1">
                            <Clock size={14} />
                            <span>{getLengthLabel(story)}</span>
                        </div>
                        <span className="text-indigo-600 font-semibold text-sm group-hover:underline">
                            Read Now &rarr;
                        </span>
                    </div>
                </div>
            </div>
         );
      })}
    </div>
  );
};

export default StoryGrid;