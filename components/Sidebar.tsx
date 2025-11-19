import React from 'react';
import { Heart, Sparkles, Library } from 'lucide-react';
import { StoryCategory } from '../types';
import { CATEGORY_CONFIG } from '../constants';

interface SidebarProps {
  selectedCategory: StoryCategory;
  onSelectCategory: (category: StoryCategory) => void;
  onOpenMagicLens: () => void;
  onOpenLibrary: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedCategory, onSelectCategory, onOpenMagicLens, onOpenLibrary }) => {
  return (
    <aside className="w-20 lg:w-64 bg-white h-full border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
        <span className="text-2xl mr-2">📚</span>
        <span className="text-xl font-bold text-slate-800 hidden lg:block">Storyverse</span>
      </div>
      
      <div className="p-3 space-y-2">
         <button
            onClick={onOpenLibrary}
            className="w-full bg-slate-800 text-white rounded-xl p-3 flex items-center justify-center lg:justify-start gap-3 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
         >
            <Library size={20} className="text-indigo-200" />
            <span className="font-bold hidden lg:inline">My Library</span>
         </button>

         <button
            onClick={onOpenMagicLens}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-3 flex items-center justify-center lg:justify-start gap-3 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
         >
            <Sparkles size={20} className="text-yellow-300" />
            <span className="font-bold hidden lg:inline">Magic Lens</span>
         </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-1">
        {(Object.values(StoryCategory) as StoryCategory[]).map((category) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`w-full flex items-center px-4 py-3 transition-colors relative group
                ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}
              `}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
              )}
              <div className={`p-2 rounded-lg mr-3 ${isSelected ? config.color + ' text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                <Icon size={20} />
              </div>
              <div className="hidden lg:block text-left">
                <div className={`font-semibold ${isSelected ? 'text-slate-900' : ''}`}>{category}</div>
                <div className="text-xs text-slate-400 truncate w-32">{config.description}</div>
              </div>
              {/* Mobile Tooltip fallback (simplified) */}
              <div className="lg:hidden absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {category}
              </div>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-100 hidden lg:block">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-sm mb-4">
            <h3 className="font-bold text-sm mb-1">Powered by Gemini</h3>
            <p className="text-xs opacity-80">Generating infinite magical worlds.</p>
        </div>

        {/* Credits Section */}
        <div className="text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                Created with <Heart size={10} className="text-red-500 fill-red-500" /> by
            </p>
            <p className="text-xs font-bold text-slate-600 mt-1">
                Storyverse Team
            </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;