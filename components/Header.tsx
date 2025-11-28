import React from 'react';
import { Radio, Book } from 'lucide-react';

interface HeaderProps {
  onToggleDocs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleDocs }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
        <h1 className="font-bold text-xl tracking-tight">Live Studio AI</h1>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleDocs}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Book size={16} />
          <span className="hidden md:inline">Documentation</span>
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 border-l border-slate-800 pl-4">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Ready to Broadcast</span>
        </div>
      </div>
    </header>
  );
};

export default Header;