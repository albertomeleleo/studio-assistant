import React, { useEffect, useRef } from 'react';
import { Suggestion } from '../types';
import { Sparkles, HelpCircle, Lightbulb } from 'lucide-react';

interface SuggestionPanelProps {
  suggestions: Suggestion[];
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ suggestions }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new suggestions arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [suggestions]);

  if (suggestions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
            <Sparkles size={24} className="text-slate-600" />
        </div>
        <p>Waiting for conversation...</p>
        <p className="text-sm text-slate-600">Start the assistant and speak into your microphone. Suggestions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 scrollbar-hide">
      {suggestions.map((item) => (
        <div 
          key={item.id}
          className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0">
              {item.type === 'question' && <HelpCircle className="text-orange-400 w-5 h-5" />}
              {item.type === 'fact' && <Lightbulb className="text-yellow-400 w-5 h-5" />}
              {item.type === 'suggestion' && <Sparkles className="text-indigo-400 w-5 h-5" />}
            </div>
            <div>
              <p className="text-slate-200 text-sm leading-relaxed">{item.text}</p>
              <span className="text-[10px] text-slate-500 mt-2 block uppercase tracking-wider font-medium">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default SuggestionPanel;