import { AgeBracket, Language, StoryCategory } from './types';
import { 
  BookOpen, Rocket, Dog, Heart, Moon, 
  Castle, Smile, Trophy, Zap, Shield, Sparkles, Anchor 
} from 'lucide-react';

export const CATEGORY_CONFIG: Record<StoryCategory, { color: string; icon: any; description: string }> = {
  [StoryCategory.DISNEY]: { 
    color: 'bg-blue-500', 
    icon: Castle,
    description: "Magical kingdoms and animated friends."
  },
  [StoryCategory.SPORTS]: { 
    color: 'bg-emerald-600', 
    icon: Trophy,
    description: "Games, teamwork, and active fun."
  },
  [StoryCategory.MAGIC]: { 
    color: 'bg-purple-500', 
    icon: Sparkles,
    description: "Wizards, spells, and mythical creatures."
  },
  [StoryCategory.SPACE]: { 
    color: 'bg-indigo-600', 
    icon: Rocket,
    description: "Intergalactic journeys and friendly robots."
  },
  [StoryCategory.SCHOOL]: { 
    color: 'bg-amber-500', 
    icon: BookOpen,
    description: "Classroom adventures and learning new things."
  },
  [StoryCategory.SUPERHEROES]: { 
    color: 'bg-red-600', 
    icon: Zap,
    description: "Saving the day with super powers."
  },
  [StoryCategory.POLICE]: { 
    color: 'bg-slate-600', 
    icon: Shield,
    description: "Heroes who keep us safe every day."
  },
  [StoryCategory.FAMILY]: { 
    color: 'bg-pink-500', 
    icon: Heart,
    description: "Love, caring, and being together."
  },
  [StoryCategory.EMOTIONS]: { 
    color: 'bg-yellow-400', 
    icon: Smile,
    description: "Understanding feelings and moods."
  },
  [StoryCategory.BEDTIME]: { 
    color: 'bg-violet-500', 
    icon: Moon,
    description: "Calm stories for a good night's sleep."
  },
  [StoryCategory.ANIMALS]: { 
    color: 'bg-green-500', 
    icon: Dog,
    description: "Tales about dinosaurs and furry friends."
  },
  [StoryCategory.ADVENTURE]: { 
    color: 'bg-orange-500', 
    icon: Anchor,
    description: "Treasure hunts and sea voyages."
  },
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  [Language.ENGLISH]: '🇬🇧',
  [Language.FRENCH]: '🇫🇷',
  [Language.ARABIC]: '🇸🇦',
};

export const AGE_BRACKET_LABELS: Record<AgeBracket, string> = {
  [AgeBracket.TODDLER]: 'Toddlers (2-4)',
  [AgeBracket.EARLY_GRADE]: 'Kids (5-7)',
  [AgeBracket.OLDER_KID]: 'Big Kids (7+)',
};