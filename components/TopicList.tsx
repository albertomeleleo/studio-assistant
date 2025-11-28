import React from 'react';
import { Hash, Loader2 } from 'lucide-react';

interface TopicListProps {
  topics: string[];
  isActive: boolean;
}

const TopicList: React.FC<TopicListProps> = ({ topics, isActive }) => {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100 font-medium">
          <Hash size={16} className="text-emerald-400" />
          <h3>Current Topics</h3>
        </div>
        {isActive && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 uppercase tracking-wider font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Listening
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 min-h-[60px] content-start">
        {topics.length > 0 ? (
          topics.map((topic, idx) => (
            <span 
              key={idx}
              className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium animate-in zoom-in duration-200"
            >
              #{topic}
            </span>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs gap-2 italic">
             {isActive ? (
                 <>
                    <Loader2 size={12} className="animate-spin" />
                    Analyzing conversation...
                 </>
             ) : (
                 "Start assistant to track topics"
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicList;
