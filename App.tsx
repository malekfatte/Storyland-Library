import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Loader, ImageIcon, Globe, AlertTriangle, CheckCircle, XCircle, Trash2, Palette } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import StoryGrid from './components/StoryGrid';
import StoryReader from './components/StoryReader';
import ImageAnalyzer from './components/ImageAnalyzer';
import LibraryStats from './components/LibraryStats';
import { StoryCategory, AgeBracket, Language, Story, FilterState } from './types';
import { generateStoryList, generateFullStory, generateCoverImage } from './services/geminiService';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  // Filter State with Persistence
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const savedFilters = localStorage.getItem('storyverse_filters');
      if (savedFilters) {
        return JSON.parse(savedFilters);
      }
    } catch (e) {
      console.error("Failed to load filters:", e);
    }
    return {
      category: StoryCategory.DISNEY,
      ageBracket: AgeBracket.EARLY_GRADE,
      language: Language.ENGLISH,
    };
  });

  // Save filters whenever they change
  useEffect(() => {
    localStorage.setItem('storyverse_filters', JSON.stringify(filters));
  }, [filters]);

  // Data State
  const [storyCache, setStoryCache] = useState<Record<string, Story[]>>({});
  const [isRestoring, setIsRestoring] = useState(true);

  // Initialize Storage and Restore Data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await StorageService.init();
        
        // 1. Try to load from IndexedDB (New robust storage)
        const dbStories = await StorageService.getAllStories();
        
        // 2. Check LocalStorage (Legacy storage) - MIGRATION STEP
        const localStr = localStorage.getItem('storyverse_cache');
        let localStories: Record<string, Story[]> = {};
        if (localStr) {
            try {
                localStories = JSON.parse(localStr);
                // Flatten and save to DB immediately
                const allLocalStories: Story[] = [];
                Object.values(localStories).forEach(list => allLocalStories.push(...list));
                if (allLocalStories.length > 0) {
                    console.log(`Migrating ${allLocalStories.length} stories from LocalStorage to IndexedDB...`);
                    await StorageService.saveStories(allLocalStories);
                }
            } catch (e) {
                console.error("Error parsing legacy localstorage", e);
            }
        }

        // 3. Merge DB results with Migration results (DB takes precedence if updated)
        // If DB was empty but we just migrated, fetch again or use local
        const finalStories = await StorageService.getAllStories();
        
        if (Object.keys(finalStories).length > 0) {
            setStoryCache(finalStories);
        } else if (Object.keys(localStories).length > 0) {
            // Fallback if DB read failed but local parsed ok
            setStoryCache(localStories);
        }

      } catch (e) {
        console.error("Critical Storage Initialization Error:", e);
      } finally {
        setIsRestoring(false);
      }
    };

    initializeData();
  }, []);


  const [isLoadingList, setIsLoadingList] = useState(false);
  const [showMagicLens, setShowMagicLens] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Ref to access the latest cache state inside async loops
  const storyCacheRef = useRef(storyCache);
  useEffect(() => {
    storyCacheRef.current = storyCache;
  }, [storyCache]);

  // Persistence Helper: Save specific stories to DB
  const persistStories = async (stories: Story[]) => {
     try {
         await StorageService.saveStories(stories);
     } catch (e) {
         console.error("Failed to persist stories to DB", e);
     }
  };
  
  // Bulk Generation State
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; status: string; error?: boolean } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'generate' | 'paint' | null>(null);
  
  // Reader State
  const [readingStory, setReadingStory] = useState<Story | null>(null);

  const getCacheKey = (f: FilterState) => `${f.category}|${f.ageBracket}|${f.language}`;
  const currentCacheKey = getCacheKey(filters);
  const currentStories = storyCache[currentCacheKey] || [];

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateStoryInCache = (updatedStory: Story) => {
    setStoryCache(prev => {
      const storyKey = `${updatedStory.category}|${updatedStory.ageBracket}|${updatedStory.language}`;
      const list = prev[storyKey] || [];
      const newList = list.map(s => s.id === updatedStory.id ? updatedStory : s);
      return { ...prev, [storyKey]: newList };
    });
    // Persist single update
    persistStories([updatedStory]);
  };

  const handleGenerateList = async () => {
    setIsLoadingList(true);
    try {
      const metadataList = await generateStoryList(
        filters.category,
        filters.ageBracket,
        filters.language
      );

      const newStories: Story[] = metadataList.map(meta => ({
        ...meta,
        category: filters.category,
        ageBracket: filters.ageBracket,
        language: filters.language,
        isLoadingContent: false,
        isLoadingCover: false,
      }));

      setStoryCache(prev => ({
        ...prev,
        [currentCacheKey]: newStories
      }));
      
      // Persist new list
      persistStories(newStories);

    } catch (error) {
      console.error("Failed to generate list", error);
      alert("Failed to generate story list. Please check your API key or connection.");
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleBulkGenerateCategory = async () => {
    if (bulkProgress) return;

    const targetCategory = filters.category;
    const ages = Object.values(AgeBracket);
    const langs = Object.values(Language);
    const total = ages.length * langs.length;
    let processed = 0;

    setBulkProgress({ current: 0, total, status: `Preparing ${targetCategory}...` });

    try {
      for (const age of ages) {
        for (const lang of langs) {
            const cacheKey = `${targetCategory}|${age}|${lang}`;
            
            // Skip if already exists using Ref
            if (storyCacheRef.current[cacheKey] && storyCacheRef.current[cacheKey].length > 0) {
               processed++;
               setBulkProgress({ current: processed, total, status: `Skipping existing (${age}, ${lang})...` });
               await new Promise(r => setTimeout(r, 100));
               continue;
            }

            setBulkProgress({ current: processed + 1, total, status: `Generating ${targetCategory} (${age}, ${lang})...` });

            try {
                const metadataList = await generateStoryList(targetCategory, age, lang);
                
                const newStories: Story[] = metadataList.map(meta => ({
                    ...meta,
                    category: targetCategory,
                    ageBracket: age,
                    language: lang,
                    isLoadingContent: false,
                    isLoadingCover: false
                }));

                setStoryCache(prev => ({
                    ...prev,
                    [cacheKey]: newStories
                }));
                
                // Persist batch
                persistStories(newStories);
                
                // Small delay to avoid rate limits
                await new Promise(r => setTimeout(r, 1500));
            } catch (e) {
                console.error(`Error generating batch for ${age}/${lang}`, e);
            }
            processed++;
        }
      }
    } catch (error) {
        console.error("Bulk generation failed", error);
        alert("Bulk generation encounted an error. Please check the console.");
    } finally {
        setBulkProgress(null);
    }
  };

  const handleGlobalGenerate = async () => {
    if (bulkProgress) return;
    
    const categories = Object.values(StoryCategory);
    const ages = Object.values(AgeBracket);
    const langs = Object.values(Language);
    const total = categories.length * ages.length * langs.length;
    let processed = 0;
    let errorCount = 0;

    setConfirmAction(null);
    setBulkProgress({ current: 0, total, status: "Initializing Universe..." });

    try {
        for (const cat of categories) {
            for (const age of ages) {
                for (const lang of langs) {
                    
                    if (errorCount > 5) {
                        throw new Error("Too many consecutive errors. Aborting.");
                    }

                    const cacheKey = `${cat}|${age}|${lang}`;
                    
                    if (storyCacheRef.current[cacheKey] && storyCacheRef.current[cacheKey].length > 0) {
                        processed++;
                        setBulkProgress({ 
                            current: processed, 
                            total, 
                            status: `Checked ${cat} (Skipped)` 
                        });
                        await new Promise(r => setTimeout(r, 10));
                        continue;
                    }

                    setBulkProgress({ 
                        current: processed, 
                        total, 
                        status: `Generating: ${cat} | ${age} | ${lang}` 
                    });
                    
                    try {
                        const metadataList = await generateStoryList(cat, age, lang);
                        
                        const newStories: Story[] = metadataList.map(meta => ({
                            ...meta,
                            category: cat,
                            ageBracket: age,
                            language: lang,
                            isLoadingContent: false,
                            isLoadingCover: false
                        }));

                        setStoryCache(prev => ({
                            ...prev,
                            [cacheKey]: newStories
                        }));
                        
                        persistStories(newStories);
                        
                        errorCount = 0;
                        await new Promise(resolve => setTimeout(resolve, 2000));

                    } catch (e) {
                        console.error(`Error in global batch`, e);
                        errorCount++;
                    }
                    processed++;
                }
            }
        }
    } catch (error: any) {
        console.error("Global generation failed", error);
        setBulkProgress({ 
            current: processed, 
            total, 
            status: `Error: ${error.message}`,
            error: true
        });
        await new Promise(r => setTimeout(r, 5000));
    } finally {
        setBulkProgress(null);
    }
  };

  const handleGlobalGenerateCovers = async () => {
    if (bulkProgress) return;
    
    const allKeys = Object.keys(storyCacheRef.current);
    const tasks: { key: string; storyId: string; title: string; summary: string; category: StoryCategory }[] = [];

    allKeys.forEach(key => {
        const list = storyCacheRef.current[key];
        list.forEach(s => {
            if (!s.coverImage && !s.isLoadingCover) {
                tasks.push({
                    key,
                    storyId: s.id,
                    title: s.title,
                    summary: s.summary,
                    category: s.category
                });
            }
        });
    });

    if (tasks.length === 0) {
        alert("All stories already have covers!");
        setConfirmAction(null);
        return;
    }

    const total = tasks.length;
    setConfirmAction(null);
    setBulkProgress({ current: 0, total, status: `Preparing ${total} covers...` });

    let processed = 0;

    try {
        for (const task of tasks) {
             setBulkProgress({ 
                 current: processed + 1, 
                 total, 
                 status: `Painting: ${task.title.substring(0, 15)}...` 
             });

             setStoryCache(prev => {
                 const list = prev[task.key] || [];
                 const newList = list.map(s => s.id === task.storyId ? { ...s, isLoadingCover: true } : s);
                 return { ...prev, [task.key]: newList };
             });

             try {
                 const imageUrl = await generateCoverImage(task.title, task.summary, task.category);
                 
                 const updatedStoryPart = { 
                     id: task.storyId, 
                     coverImage: imageUrl || undefined, 
                     isLoadingCover: false 
                 };

                 setStoryCache(prev => {
                     const list = prev[task.key] || [];
                     const newList = list.map(s => s.id === task.storyId ? { ...s, ...updatedStoryPart } : s);
                     return { ...prev, [task.key]: newList };
                 });
                 
                 // We need the FULL story object to save to DB, let's find it from the ref or state
                 const fullStory = storyCacheRef.current[task.key]?.find(s => s.id === task.storyId);
                 if (fullStory) {
                     persistStories([{ ...fullStory, ...updatedStoryPart }]);
                 }

                 // Rate limit delay 
                 await new Promise(r => setTimeout(r, 2000));

             } catch (err) {
                 console.error("Cover generation error", err);
                 setStoryCache(prev => {
                     const list = prev[task.key] || [];
                     const newList = list.map(s => s.id === task.storyId ? { ...s, isLoadingCover: false } : s);
                     return { ...prev, [task.key]: newList };
                 });
             }
             processed++;
        }
    } catch (e) {
        console.error("Global paint loop error", e);
    } finally {
        setBulkProgress(null);
    }
  };

  const handleGenerateCovers = async () => {
    const storiesToUpdate = currentStories.filter(s => !s.coverImage && !s.isLoadingCover);
    if (storiesToUpdate.length === 0) return;

    const updatedStoriesWithLoading = currentStories.map(s => 
        (!s.coverImage && !s.isLoadingCover) ? { ...s, isLoadingCover: true } : s
    );
    
    setStoryCache(prev => ({ ...prev, [currentCacheKey]: updatedStoriesWithLoading }));

    for (const story of storiesToUpdate) {
        try {
            const imageUrl = await generateCoverImage(story.title, story.summary, story.category);
            const updated = { 
                ...story, 
                coverImage: imageUrl || undefined, 
                isLoadingCover: false 
            };
            
            updateStoryInCache(updated);
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error("Failed to generate cover", e);
            updateStoryInCache({ ...story, isLoadingCover: false });
        }
    }
  };

  const handleRegenerateCover = async (story: Story) => {
    updateStoryInCache({ ...story, isLoadingCover: true, coverImage: undefined });
    try {
        const imageUrl = await generateCoverImage(story.title, story.summary, story.category);
        const updated = { 
            ...story, 
            coverImage: imageUrl || undefined, 
            isLoadingCover: false 
        };
        updateStoryInCache(updated);
    } catch (e) {
        updateStoryInCache({ ...story, isLoadingCover: false });
    }
  };

  const handleOpenStory = async (story: Story) => {
    setReadingStory(story);

    if (!story.content && !story.isLoadingContent) {
      updateStoryInCache({ ...story, isLoadingContent: true });
      setReadingStory(prev => prev?.id === story.id ? { ...story, isLoadingContent: true } : prev);

      try {
        const content = await generateFullStory(
          story.title,
          story.summary,
          story.ageBracket,
          story.language,
          story.category
        );

        const wordCount = content.split(/\s+/).length;
        const updatedStory = { ...story, content, wordCount, isLoadingContent: false };
        
        updateStoryInCache(updatedStory);
        setReadingStory(prev => prev?.id === story.id ? updatedStory : prev);

      } catch (error) {
        const errorStory = { 
            ...story, 
            content: "Error generating story content.", 
            isLoadingContent: false 
        };
        updateStoryInCache(errorStory);
        setReadingStory(prev => prev?.id === story.id ? errorStory : prev);
      }
    }
  };

  const handleCloseReader = () => {
    setReadingStory(null);
  };

  const handleClearData = async () => {
      if (window.confirm("DANGER: This will PERMANENTLY delete your entire library (all 1000+ stories). Are you sure?")) {
          await StorageService.clearDatabase();
          localStorage.removeItem('storyverse_cache');
          setStoryCache({});
      }
  };
  
  if (isRestoring) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
              <Loader className="animate-spin text-indigo-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-slate-800">Recovering Your Universe...</h2>
              <p className="text-slate-500 mt-2">Migrating stories to permanent storage.</p>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        selectedCategory={filters.category} 
        onSelectCategory={(cat) => handleFilterChange('category', cat)} 
        onOpenMagicLens={() => setShowMagicLens(true)}
        onOpenLibrary={() => setShowLibrary(true)}
      />

      <main className="flex-1 flex flex-col h-full min-w-0">
        <TopBar
          selectedAge={filters.ageBracket}
          selectedLanguage={filters.language}
          onSelectAge={(age) => handleFilterChange('ageBracket', age)}
          onSelectLanguage={(lang) => handleFilterChange('language', lang)}
        />

        <div className="flex-1 overflow-y-auto relative">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent -z-10" />
            
            <div className="max-w-7xl mx-auto">
                <div className="px-6 py-8 flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            {filters.category} Stories
                        </h1>
                        <div className="flex items-center gap-4">
                            <p className="text-slate-500 mt-1">
                                Targeting {filters.ageBracket} in {filters.language}
                            </p>
                            {Object.keys(storyCache).length > 0 && (
                                <button 
                                    onClick={handleClearData}
                                    className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 mt-1"
                                    title="Clear all saved stories"
                                >
                                    <Trash2 size={12} /> Reset Database
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {currentStories.length > 0 && (
                            <button 
                                onClick={handleGenerateCovers}
                                disabled={currentStories.every(s => s.coverImage || s.isLoadingCover)}
                                className={`text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2
                                    ${currentStories.every(s => s.coverImage) 
                                        ? 'bg-green-50 text-green-700 border border-green-100' 
                                        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-100 hover:border-purple-200 hover:shadow'
                                    }`}
                            >
                                <ImageIcon size={16} />
                                {currentStories.every(s => s.coverImage) ? "All Covers Ready" : "Generate Covers"}
                            </button>
                        )}

                        {bulkProgress ? (
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-3 border shadow-sm min-w-[300px] transition-colors duration-300
                                ${bulkProgress.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                                {bulkProgress.error ? <AlertTriangle size={18} /> : <Loader className="animate-spin" size={18} />}
                                <div className="flex flex-col flex-1">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-1">
                                        <span>{bulkProgress.status}</span>
                                        <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                                    </div>
                                    <div className={`w-full rounded-full h-1.5 ${bulkProgress.error ? 'bg-red-200' : 'bg-indigo-200'}`}>
                                        <div 
                                            className={`h-1.5 rounded-full transition-all duration-300 ${bulkProgress.error ? 'bg-red-500' : 'bg-indigo-600'}`}
                                            style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={handleBulkGenerateCategory}
                                    className="text-sm font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2"
                                >
                                    <Sparkles size={16} />
                                    Generate All {filters.category}
                                </button>
                                
                                {confirmAction ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <button 
                                            onClick={confirmAction === 'generate' ? handleGlobalGenerate : handleGlobalGenerateCovers}
                                            className={`text-sm font-semibold text-white px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2
                                                ${confirmAction === 'generate' ? 'bg-red-500 hover:bg-red-600 border-red-600' : 'bg-purple-600 hover:bg-purple-700 border-purple-700'}`}
                                        >
                                            <CheckCircle size={16} />
                                            {confirmAction === 'generate' ? "Confirm Text?" : "Confirm Paint?"}
                                        </button>
                                        <button 
                                            onClick={() => setConfirmAction(null)}
                                            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setConfirmAction('paint')}
                                            className="text-sm font-semibold text-purple-600 bg-white hover:bg-purple-50 border border-purple-100 hover:border-purple-200 px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2"
                                        >
                                            <Palette size={16} />
                                            Paint Universe
                                        </button>
                                        <button 
                                            onClick={() => setConfirmAction('generate')}
                                            className="text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2"
                                        >
                                            <Globe size={16} />
                                            Generate Universe
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <StoryGrid
                    stories={currentStories}
                    isLoading={isLoadingList}
                    hasStories={currentStories.length > 0}
                    onGenerate={handleGenerateList}
                    onStoryClick={handleOpenStory}
                    onRegenerateCover={handleRegenerateCover}
                />
            </div>
        </div>
      </main>

      {readingStory && (
        <StoryReader story={readingStory} onClose={handleCloseReader} />
      )}
      
      {showMagicLens && (
        <ImageAnalyzer onClose={() => setShowMagicLens(false)} />
      )}

      {showLibrary && (
        <LibraryStats 
            storyCache={storyCache} 
            onClose={() => setShowLibrary(false)} 
            onSelectCategory={(cat) => handleFilterChange('category', cat)}
        />
      )}
    </div>
  );
};

export default App;