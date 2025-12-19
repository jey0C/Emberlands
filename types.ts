
export enum EmotionCategory {
  Joy = 'Joy',
  Sorrow = 'Sorrow',
  Anger = 'Anger',
  Fear = 'Fear',
  Calm = 'Calm',
  Excitement = 'Excitement',
  Anxiety = 'Anxiety',
  Awe = 'Awe'
}

export interface MemoryEntry {
  id: string;
  timestamp: number;
  rawText: string;
  imageUrl?: string;
  parentId?: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  analysis: {
    dominantEmotions: EmotionCategory[];
    intensity: number; // 1-10
    themes: string[];
    summary: string;
  };
}

export interface LandscapePoint {
  time: number;
  intensity: number;
  emotion: EmotionCategory;
  entry: MemoryEntry;
}

export interface Insight {
  title: string;
  description: string;
  type: 'pattern' | 'spike' | 'cycle';
}
