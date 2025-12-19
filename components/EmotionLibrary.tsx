
import React from 'react';
import { EmotionCategory } from '../types';

const emotionDetails: Record<EmotionCategory, { description: string; color: string; metaphor: string }> = {
  [EmotionCategory.Joy]: {
    description: "A sense of vibrant warmth, connection, and fulfillment.",
    color: '#fbbf24',
    metaphor: "Luminous amber peaks that catch the light."
  },
  [EmotionCategory.Sorrow]: {
    description: "The quiet depth of loss, reflection, or gentle release.",
    color: '#60a5fa',
    metaphor: "Deep blue valleys where shadows and clarity reside."
  },
  [EmotionCategory.Anger]: {
    description: "A sharp surge of energy, boundaries, or righteous heat.",
    color: '#f87171',
    metaphor: "Jagged red ridges that command immediate presence."
  },
  [EmotionCategory.Fear]: {
    description: "An alert state of uncertainty, protection, or perceived risk.",
    color: '#a78bfa',
    metaphor: "Misty purple heights shrouded in vigilance."
  },
  [EmotionCategory.Calm]: {
    description: "The steady pulse of peace, presence, and internal balance.",
    color: '#34d399',
    metaphor: "Expansive emerald plateaus of quiet stability."
  },
  [EmotionCategory.Excitement]: {
    description: "High-frequency anticipation and buoyant, outward energy.",
    color: '#f472b6',
    metaphor: "Bright pink sparks rising above the horizon."
  },
  [EmotionCategory.Anxiety]: {
    description: "A restless vibration of worry or future-oriented tension.",
    color: '#fb923c',
    metaphor: "Shifting orange dunes that never quite settle."
  },
  [EmotionCategory.Awe]: {
    description: "The overwhelming realization of something vast and wondrous.",
    color: '#22d3ee',
    metaphor: "Luminous cyan horizons that stretch the spirit."
  }
};

const EmotionLibrary: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-serif text-white mb-4">Emotional Palette</h2>
        <p className="text-gray-500 font-light max-w-xl mx-auto italic">
          The landscape is painted with these eight fundamental energies. Understanding their form helps reveal the architecture of your inner world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(emotionDetails).map(([key, details]) => (
          <div key={key} className="glass rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:bg-white/5 border-t-2" style={{ borderTopColor: details.color + '44' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: details.color, boxShadow: `0 0 15px ${details.color}44` }}></div>
              <h3 className="text-xl font-serif text-white">{key}</h3>
            </div>
            <p className="text-sm text-gray-300 font-light leading-relaxed mb-4">
              {details.description}
            </p>
            <div className="pt-4 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Landscape Metaphor</span>
              <p className="text-xs italic text-gray-400 font-serif">{details.metaphor}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-20 glass p-8 rounded-3xl text-center border-dashed border-white/10">
        <h3 className="text-lg font-serif text-white/80 mb-2">Mixed Realities</h3>
        <p className="text-sm text-gray-500 font-light max-w-2xl mx-auto">
          Rarely do we feel just one thing. When your memories contain multiple emotions, the landscape layers them together, creating complex topographies of overlapping color and intensity.
        </p>
      </div>
    </div>
  );
};

export default EmotionLibrary;
