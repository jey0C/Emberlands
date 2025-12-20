
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MemoryEntry, Insight } from './types';
import { generateInsights } from './services/geminiService';
import InputArea from './components/InputArea';
import Landscape from './components/Landscape';
import InsightPanel from './components/InsightPanel';
import EmotionLibrary from './components/EmotionLibrary';

const getEmotionColor = (emotion: string): string => {
  const colors: any = { 
    Joy: '#fbbf24', Sorrow: '#60a5fa', Anger: '#f87171', Fear: '#a78bfa', 
    Calm: '#34d399', Excitement: '#f472b6', Anxiety: '#fb923c', Awe: '#22d3ee' 
  };
  return colors[emotion] || '#333333';
};

const formatDate = (ts: number) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(ts);
};

const MemoryCard: React.FC<{ 
  entry: MemoryEntry; 
  isSub?: boolean;
  onStartThread?: (entry: MemoryEntry) => void;
  getThreadsFor: (parentId: string) => MemoryEntry[];
}> = ({ 
  entry, 
  isSub = false, 
  onStartThread,
  getThreadsFor 
}) => {
  const threads = isSub ? [] : getThreadsFor(entry.id);
  const mainEmotion = entry.analysis.dominantEmotions[0];
  const emotionColor = getEmotionColor(mainEmotion);
  
  return (
    <div className={`flex flex-col gap-2 ${isSub ? 'mt-2' : ''}`}>
      <div 
        className={`glass p-5 rounded-xl hover:bg-white/5 transition-all group flex gap-5 items-center border-l-4 ${isSub ? 'ml-8 bg-white/[0.01]' : ''}`} 
        style={{ borderLeftColor: emotionColor }}
      >
        {entry.imageUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <img src={entry.imageUrl} alt="Memory" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
          </div>
        )}
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-medium">{formatDate(entry.timestamp)}</span>
              {entry.location && (
                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[8px] text-gray-500 uppercase tracking-tighter">
                    {entry.location.name || `${entry.location.lat.toFixed(2)}, ${entry.location.lng.toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isSub && onStartThread && (
                <button 
                  onClick={() => onStartThread(entry)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-purple-400"
                  title="Start thread"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
              )}
              <div className="flex gap-1.5">
                {entry.analysis.dominantEmotions.map(e => (
                  <div key={e} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getEmotionColor(e) }}></span>
                    <span className="text-[8px] text-gray-400 uppercase tracking-tighter">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-gray-300 font-light leading-relaxed text-sm">
            {entry.analysis.summary || entry.rawText.substring(0, 140) + (entry.rawText.length > 140 ? '...' : '')}
          </p>
        </div>
      </div>
      {threads.map(thread => (
        <MemoryCard key={thread.id} entry={thread} isSub={true} getThreadsFor={getThreadsFor} />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [selectedParentEntry, setSelectedParentEntry] = useState<MemoryEntry | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'landscape' | 'library'>('landscape');
  const [showVaultPanel, setShowVaultPanel] = useState(false);
  const [landscapeKey, setLandscapeKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedKey = localStorage.getItem('ember_vault_key');
    if (!storedKey) {
      localStorage.setItem('ember_vault_key', passkey);
      setIsUnlocked(true);
    } else if (storedKey === passkey) {
      setIsUnlocked(true);
    } else {
      window.alert("Passkey incorrect.");
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm("WARNING: A Factory Reset will permanently delete all stored memories and reset your access key. This cannot be undone. Proceed?")) {
      localStorage.removeItem('emotional-memories');
      localStorage.removeItem('ember_vault_key');
      setEntries([]);
      setIsUnlocked(false);
      setPasskey('');
      window.alert("App has been reset to factory settings.");
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      const saved = localStorage.getItem('emotional-memories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setEntries(parsed);
        } catch (e) {
          console.error("Failed to parse saved memories", e);
        }
      }
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) return;
    if (entries.length > 0) {
      localStorage.setItem('emotional-memories', JSON.stringify(entries));
      if (entries.length >= 3) {
        setIsLoadingInsights(true);
        generateInsights(entries)
          .then(setInsights)
          .catch(console.error)
          .finally(() => setIsLoadingInsights(false));
      }
    } else {
      localStorage.removeItem('emotional-memories');
      setInsights([]);
    }
  }, [entries, isUnlocked]);

  const handleNewEntry = useCallback((entry: MemoryEntry) => {
    setEntries(prev => [entry, ...prev]);
    setSelectedParentEntry(null);
  }, []);

  const exportLandscape = () => {
    if (entries.length === 0) {
      window.alert("The landscape is empty.");
      return;
    }
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const fileName = `emberlands-archive-${new Date().toISOString().split('T')[0]}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLandscape = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const json = JSON.parse(result);
        if (Array.isArray(json)) {
          if (window.confirm(`Restore ${json.length} memories? Current data will be replaced.`)) {
            setEntries([]); 
            setTimeout(() => {
              setEntries(json);
              setLandscapeKey(prev => prev + 1);
              setActiveTab('landscape');
              setShowVaultPanel(false);
            }, 10);
          }
        }
      } catch (err) {
        window.alert("Failed to read archive.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const dissolveArchive = () => {
    if (window.confirm("Dissolve everything? This permanently wipes your history. Would you like to Archive (Export) your data first?")) {
      exportLandscape();
      localStorage.removeItem('emotional-memories');
      setEntries([]);
      setLandscapeKey(prev => prev + 1);
      setShowVaultPanel(false);
    }
  };

  const rootEntries = entries.filter(e => !e.parentId).slice(0, 10);
  const getThreadsFor = (parentId: string) => entries.filter(e => e.parentId === parentId).sort((a, b) => a.timestamp - b.timestamp);

  if (!isUnlocked) {
    const hasVault = !!localStorage.getItem('ember_vault_key');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#050505]">
        <div className="w-full max-w-md glass p-10 rounded-[2.5rem] text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="flex flex-col items-center gap-6">
            {/* Logo removed from here */}
            <div className="space-y-2 mt-4">
              <h1 className="text-4xl font-serif text-white italic tracking-tight">Emberlands</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em]">{hasVault ? "Vault Locked" : "Secure your Archive"}</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={passkey} 
              onChange={(e) => setPasskey(e.target.value)} 
              placeholder={hasVault ? "Enter Access Key" : "Set a New Access Key"}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-serif outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-700 text-white"
              required
            />
            <button type="submit" className="w-full py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-serif italic text-lg transition-all border border-white/5">
              {hasVault ? "Unlock" : "Initialize"}
            </button>
          </form>
          {hasVault && (
            <button onClick={handleFactoryReset} className="text-[9px] text-gray-700 hover:text-red-900 uppercase tracking-widest transition-colors">
              Forgot Access Key? (Factory Reset)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center">
      {showVaultPanel && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowVaultPanel(false)} />}
      
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm glass border-l border-white/10 z-50 p-10 transform transition-transform duration-500 flex flex-col ${showVaultPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-2xl font-serif text-white italic">Vault Management</h2>
          <button onClick={() => setShowVaultPanel(false)} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="space-y-6 flex-grow">
          <section className="space-y-4">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">Data Operations</h3>
            <button onClick={exportLandscape} className="w-full text-left glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
              <div>
                <span className="block text-white text-sm">Export Archive</span>
                <span className="text-[10px] text-gray-500">Download current landscape as .json</span>
              </div>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
              <div>
                <span className="block text-white text-sm">Restore History</span>
                <span className="text-[10px] text-gray-500">Upload a saved archive file</span>
              </div>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={importLandscape} accept=".json" className="hidden" />
          </section>

          <section className="space-y-4 pt-8 border-t border-white/5">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">Security</h3>
            <button onClick={() => setIsUnlocked(false)} className="w-full text-left glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all">
              <span className="text-white text-sm">Lock Archive</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </button>
            <button onClick={dissolveArchive} className="w-full text-left glass p-4 rounded-xl flex items-center justify-between hover:bg-red-500/10 border-red-500/5 transition-all group">
              <div>
                <span className="block text-red-400 text-sm">Dissolve Landscape</span>
                <span className="text-[10px] text-red-500/50">Permanently delete all memory data</span>
              </div>
              <svg className="w-4 h-4 text-red-500/50 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </section>
        </div>
        
        <div className="text-[9px] text-gray-600 tracking-widest uppercase text-center mt-8">Local-Only &bull; Encrypted Session</div>
      </div>

      <header className="w-full max-w-6xl px-8 pt-16 pb-12 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-8 sm:gap-0">
        <div className="flex items-center gap-4">
          {/* Logo removed from here */}
          <div>
            <h1 className="text-5xl font-serif text-white tracking-tighter italic">Emberlands</h1>
            <p className="text-gray-500 font-light mt-2 tracking-[0.2em] uppercase text-[10px]">Private Emotional Terrain</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="block text-3xl font-serif text-white/80">{entries.length}</span>
            <span className="block text-[9px] text-gray-600 uppercase tracking-widest">Landmarks</span>
          </div>
          <button 
            onClick={() => setShowVaultPanel(true)} 
            className="glass px-6 py-2.5 rounded-full text-[10px] text-gray-400 hover:text-white uppercase tracking-widest transition-all border border-white/10 hover:border-white/20 whitespace-nowrap"
          >
            Vault Control
          </button>
        </div>
      </header>

      <nav className="w-full max-w-6xl px-8 mb-12 flex gap-4 overflow-x-auto no-scrollbar">
        <div className="flex bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-xl shrink-0">
          <button onClick={() => setActiveTab('landscape')} className={`px-8 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'landscape' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Terrain</button>
          <button onClick={() => setActiveTab('library')} className={`px-8 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'library' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Library</button>
        </div>
      </nav>

      <main className="w-full max-w-6xl flex-grow px-4 md:px-8">
        {activeTab === 'landscape' ? (
          <div className="animate-in fade-in duration-1000">
            <Landscape key={landscapeKey} entries={entries} onEntryHover={() => {}} />
            <InputArea onEntryCreated={handleNewEntry} parentEntry={selectedParentEntry} onCancelThread={() => setSelectedParentEntry(null)} />
            {entries.length > 0 && (
              <section className="mt-12 mb-24 max-w-4xl mx-auto">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium mb-8 px-2">Echoed Memories</h3>
                <div className="space-y-8">
                  {rootEntries.map(entry => (
                    <MemoryCard key={entry.id} entry={entry} onStartThread={(e) => { setSelectedParentEntry(e); window.scrollTo({ top: 0, behavior: 'smooth' }); }} getThreadsFor={getThreadsFor} />
                  ))}
                </div>
              </section>
            )}
            <InsightPanel insights={insights} isLoading={isLoadingInsights} />
          </div>
        ) : (
          <EmotionLibrary />
        )}
      </main>

      <footer className="w-full py-16 text-center text-gray-800 text-[9px] font-light tracking-[0.5em] uppercase">
        Memory as Space &bull; Private by Design
      </footer>
    </div>
  );
};

export default App;
