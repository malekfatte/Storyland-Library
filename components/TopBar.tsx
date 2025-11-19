import React from 'react';
import { AgeBracket, Language } from '../types';
import { AGE_BRACKET_LABELS, LANGUAGE_FLAGS } from '../constants';

interface TopBarProps {
  selectedAge: AgeBracket;
  selectedLanguage: Language;
  onSelectAge: (age: AgeBracket) => void;
  onSelectLanguage: (lang: Language) => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  selectedAge, 
  selectedLanguage, 
  onSelectAge, 
  onSelectLanguage 
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10">
      <div className="flex items-center space-x-2 lg:space-x-6 overflow-x-auto no-scrollbar w-full">
        
        {/* Age Selector Group */}
        <div className="flex bg-slate-100 p-1 rounded-lg flex-shrink-0">
            {(Object.values(AgeBracket) as AgeBracket[]).map((age) => (
                <button
                    key={age}
                    onClick={() => onSelectAge(age)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap
                        ${selectedAge === age 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {AGE_BRACKET_LABELS[age]}
                </button>
            ))}
        </div>

        <div className="w-px h-6 bg-slate-300 hidden sm:block"></div>

        {/* Language Selector Group */}
        <div className="flex items-center space-x-2 flex-shrink-0">
            {(Object.values(Language) as Language[]).map((lang) => (
                <button
                    key={lang}
                    onClick={() => onSelectLanguage(lang)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all
                        ${selectedLanguage === lang
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                >
                    <span className="text-lg">{LANGUAGE_FLAGS[lang]}</span>
                    <span className="text-sm font-medium hidden sm:inline">{lang}</span>
                </button>
            ))}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
