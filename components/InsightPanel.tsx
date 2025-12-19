
import React from 'react';
import { Insight } from '../types';

interface InsightPanelProps {
  insights: Insight[];
  isLoading: boolean;
}

const InsightPanel: React.FC<InsightPanelProps> = ({ insights, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 mt-8 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-10 w-48 bg-white/5 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-12 mb-24">
      <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-6 font-medium">Observed Patterns</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight, idx) => (
          <div key={idx} className="glass rounded-xl p-6 border-l-2 border-l-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-purple-300 uppercase tracking-tighter">
                {insight.type}
               </span>
            </div>
            <h4 className="font-serif text-lg mb-2 text-white/90">{insight.title}</h4>
            <p className="text-sm text-gray-400 leading-relaxed font-light italic">
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightPanel;
