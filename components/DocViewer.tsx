import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Folder, FileText, ChevronRight, ChevronDown, X, Book } from 'lucide-react';
import { DocFile, documentationData } from '../services/docData';
import Mermaid from './Mermaid';

interface DocViewerProps {
  onClose: () => void;
}

const FileTreeItem: React.FC<{ item: DocFile; level: number; onSelect: (file: DocFile) => void; selectedFile: DocFile | null }> = ({ 
  item, 
  level, 
  onSelect, 
  selectedFile 
}) => {
  const [isOpen, setIsOpen] = useState(item.isOpen || false);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(item);
    }
  };

  const isSelected = selectedFile?.name === item.name && selectedFile?.content === item.content;

  return (
    <div>
      <div 
        onClick={handleClick}
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-slate-800 rounded transition-colors ${
          isSelected ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <span className="opacity-70">
          {item.type === 'folder' ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-3.5" /> 
          )}
        </span>
        {item.type === 'folder' ? <Folder size={14} className="text-slate-500" /> : <FileText size={14} />}
        <span className="text-sm truncate">{item.name}</span>
      </div>
      
      {item.type === 'folder' && isOpen && item.children && (
        <div>
          {item.children.map((child, idx) => (
            <FileTreeItem 
              key={idx} 
              item={child} 
              level={level + 1} 
              onSelect={onSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DocViewer: React.FC<DocViewerProps> = ({ onClose }) => {
  // Default to the first README found
  const findDefault = (files: DocFile[]): DocFile | null => {
    for (const f of files) {
      if (f.type === 'file') return f;
      if (f.children) {
        const found = findDefault(f.children);
        if (found) return found;
      }
    }
    return null;
  };

  const [activeFile, setActiveFile] = useState<DocFile | null>(findDefault(documentationData));

  // Custom renderer to intercept code blocks and render Mermaid
  const renderComponents = {
    code(props: any) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      const isMermaid = match && match[1] === 'mermaid';

      if (isMermaid) {
        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
      }

      return match ? (
        <code {...rest} className={className}>
          {children}
        </code>
      ) : (
        <code {...rest} className={className}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-950 w-full md:w-[90%] lg:w-[80%] max-w-7xl mx-auto my-auto h-[90vh] md:h-[85vh] shadow-2xl rounded-2xl border border-slate-800 flex overflow-hidden flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Book size={18} className="text-indigo-400" />
            <h2 className="font-semibold text-slate-200">Documentation</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {documentationData.map((item, idx) => (
              <FileTreeItem 
                key={idx} 
                item={item} 
                level={0} 
                onSelect={setActiveFile}
                selectedFile={activeFile}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <FileText size={14} />
              <span>{activeFile?.name}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="prose prose-invert max-w-3xl mx-auto pb-20">
              {activeFile?.content ? (
                <ReactMarkdown components={renderComponents}>
                  {activeFile.content}
                </ReactMarkdown>
              ) : (
                <div className="text-center text-slate-500 mt-20">
                  Select a file from the sidebar to view documentation
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocViewer;