import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';
import { User, Sparkles, MessageSquare, Send } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage?: (text: string) => void;
  isLive?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLive = false }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                <MessageSquare size={20} className="text-slate-600" />
            </div>
            <p className="text-sm">Conversation history will appear here.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isAi = msg.sender === 'ai';
            return (
              <div 
                key={msg.id + index}
                className={`flex gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isAi ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {isAi ? <Sparkles size={14} /> : <User size={14} />}
                </div>
                
                <div className={`flex flex-col max-w-[85%] ${isAi ? 'items-start' : 'items-end'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isAi 
                      ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-100 rounded-tl-none' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLive ? "Type a message..." : "Connect to chat..."}
          disabled={!isLive}
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-500"
        />
        <button 
          onClick={handleSend}
          disabled={!inputValue.trim() || !isLive}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;