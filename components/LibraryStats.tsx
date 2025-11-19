import React from 'react';
import { X, Download, Book, CheckCircle, AlertCircle } from 'lucide-react';
import { Story, StoryCategory } from '../types';
import { CATEGORY_CONFIG } from '../constants';

interface LibraryStatsProps {
  storyCache: Record<string, Story[]>;
  onClose: () => void;
  onSelectCategory: (category: StoryCategory) => void;
}

const LibraryStats: React.FC<LibraryStatsProps> = ({ storyCache, onClose, onSelectCategory }) => {
  // Calculate stats
  const stats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    let fullStories = 0;
    let covers = 0;

    Object.values(StoryCategory).forEach(cat => {
        counts[cat] = 0;
    });

    Object.entries(storyCache).forEach(([key, stories]) => {
        const [cat] = key.split('|');
        if (cat && stories) {
            counts[cat] = (counts[cat] || 0) + stories.length;
            total += stories.length;
            stories.forEach(s => {
                if (s.content) fullStories++;
                if (s.coverImage) covers++;
            });
        }
    });

    return { counts, total, fullStories, covers };
  }, [storyCache]);

  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storyCache));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "storyverse_backup_" + new Date().toISOString() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Book className="text-indigo-600" />
                    My Library
                </h2>
                <p className="text-slate-500 text-sm mt-1">Overview of your generated universe.</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
                <X size={28} />
            </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
            <div className="p-6 text-center">
                <div className="text-3xl font-black text-indigo-600">{stats.total}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stories</div>
            </div>
            <div className="p-6 text-center">
                <div className="text-3xl font-black text-green-600">{stats.fullStories}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fully Written</div>
            </div>
            <div className="p-6 text-center">
                <div className="text-3xl font-black text-purple-600">{stats.covers}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Covers Generated</div>
            </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700">Categories Breakdown</h3>
                <button 
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all shadow-sm text-sm font-medium"
                >
                    <Download size={16} />
                    Backup Data
                </button>
            </div>

            {stats.total === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p className="font-medium">No stories found in your library yet.</p>
                    <p className="text-sm">Use the "Generate Universe" button to populate your world.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(Object.values(StoryCategory) as StoryCategory[]).map((category) => {
                        const count = stats.counts[category] || 0;
                        const config = CATEGORY_CONFIG[category];
                        const Icon = config.icon;
                        const hasStories = count > 0;

                        return (
                            <button
                                key={category}
                                onClick={() => {
                                    if (hasStories) {
                                        onSelectCategory(category);
                                        onClose();
                                    }
                                }}
                                disabled={!hasStories}
                                className={`relative p-5 rounded-xl border text-left transition-all duration-200 group
                                    ${hasStories 
                                        ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg cursor-pointer' 
                                        : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed grayscale'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${config.color} text-white shadow-sm`}>
                                        <Icon size={24} />
                                    </div>
                                    {hasStories && <CheckCircle size={20} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                
                                <h4 className="font-bold text-slate-800 mb-1">{category}</h4>
                                
                                <div className="flex items-center justify-between mt-3">
                                    <span className={`text-2xl font-bold ${hasStories ? 'text-indigo-600' : 'text-slate-300'}`}>
                                        {count}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium uppercase">Stories</span>
                                </div>
                                
                                {/* Visual Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${config.color}`} 
                                        style={{ width: `${Math.min((count / 90) * 100, 100)}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LibraryStats;