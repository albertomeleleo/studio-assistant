import React, { useState } from 'react';
import StudioController from './components/StudioController';
import Header from './components/Header';
import DocViewer from './components/DocViewer';

const App: React.FC = () => {
  const [apiKeyMissing, setApiKeyMissing] = useState(!process.env.API_KEY);
  const [showDocs, setShowDocs] = useState(false);

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-500">API Key Missing</h1>
          <p className="text-slate-300">
            This application requires a valid Google GenAI API Key to function. 
            Please ensure <code>process.env.API_KEY</code> is set in your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header onToggleDocs={() => setShowDocs(true)} />
      
      <main className="flex-grow p-4 md:p-6 flex flex-col h-[calc(100vh-64px)]">
        <StudioController />
      </main>

      {showDocs && <DocViewer onClose={() => setShowDocs(false)} />}
    </div>
  );
};

export default App;