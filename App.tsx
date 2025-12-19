
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MemoryEntry, Insight } from './types';
import { generateInsights } from './services/geminiService';
import InputArea from './components/InputArea';
import Landscape from './components/Landscape';
import InsightPanel from './components/InsightPanel';
import EmotionLibrary from './components/EmotionLibrary';

const App: React.FC = () => {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [selectedParentEntry, setSelectedParentEntry] = useState<MemoryEntry | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'landscape' | 'library'>('landscape');
  // landscapeKey forces the Landscape component to respond to major state changes like Reset/Restore
  const [landscapeKey, setLandscapeKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('emotional-memories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved memories", e);
      }
    }
  }, []);

  // Sync to local storage and refresh insights
  useEffect(() => {
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
  }, [entries]);

  const handleNewEntry = useCallback((entry: MemoryEntry) => {
    setEntries(prev => [entry, ...prev]);
    setSelectedParentEntry(null);
  }, []);

  const resetLandscape = () => {
    if (window.confirm('Dissolve the entire landscape? This will permanently delete all logs.')) {
      setEntries([]);
      setInsights([]);
      setSelectedParentEntry(null);
      localStorage.removeItem('emotional-memories');
      setLandscapeKey(prev => prev + 1);
    }
  };

  const exportLandscape = () => {
    if (entries.length === 0) {
      alert("The landscape is empty. Nothing to archive.");
      return;
    }
    const dataStr = JSON.stringify(entries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `emberlands-archive-${new Date().toISOString().split('T')[0]}.json`;
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
  };

  const importLandscape = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm("This will replace your current logs with the ones from the file. Continue?")) {
            setEntries(json);
            setLandscapeKey(prev => prev + 1);
          }
        } else {
          alert("The file format is not a valid Emberlands archive.");
        }
      } catch (err) {
        alert("Failed to read the archive file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Allow re-uploading the same file
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(ts);
  };

  const rootEntries = entries.filter(e => !e.parentId).slice(0, 10);
  const getThreadsFor = (parentId: string) => entries.filter(e => e.parentId === parentId).sort((a, b) => a.timestamp - b.timestamp);

  const MemoryCard = ({ entry, isSub = false }: { entry: MemoryEntry; isSub?: boolean }) => {
    const threads = isSub ? [] : getThreadsFor(entry.id);
    const mainEmotion = entry.analysis.dominantEmotions[0];
    const colors: any = { Joy: '#fbbf24', Sorrow: '#60a5fa', Anger: '#f87171', Fear: '#a78bfa', Calm: '#34d399', Excitement: '#f472b6', Anxiety: '#fb923c', Awe: '#22d3ee' };
    const emotionColor = colors[mainEmotion] || '#333333';
    
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
              <span className="text-[10px] text-gray-500 font-medium">{formatDate(entry.timestamp)}</span>
              <div className="flex items-center gap-2">
                {!isSub && (
                  <button 
                    onClick={() => {
                      setSelectedParentEntry(entry);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-purple-400"
                    title="Start thread"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </button>
                )}
                <div className="flex gap-1.5">
                  {entry.analysis.dominantEmotions.map(e => (
                    <div key={e} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[e] || '#555' }}></span>
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
        {threads.map(thread => <MemoryCard key={thread.id} entry={thread} isSub={true} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="w-full max-w-6xl px-8 pt-16 pb-12 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-5xl font-serif text-white tracking-tighter italic">Emberlands</h1>
          <p className="text-gray-500 font-light mt-2 tracking-[0.2em] uppercase text-[10px]">A living archive of felt moments.</p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-end gap-8">
            <div className="text-right">
              <span className="block text-3xl font-serif text-white/80">{entries.length}</span>
              <span className="block text-[9px] text-gray-600 uppercase tracking-[0.3em]">Landmarks</span>
            </div>
            <button 
              onClick={resetLandscape}
              className="text-[9px] text-gray-700 hover:text-red-900 uppercase tracking-[0.3em] transition-colors mb-1"
            >
              Reset
            </button>
          </div>
          <div className="flex gap-4">
            <button onClick={exportLandscape} className="flex items-center gap-2 text-[9px] text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-all bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Archive
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[9px] text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-all bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Restore
            </button>
            <input type="file" ref={fileInputRef} onChange={importLandscape} accept=".json" className="hidden" />
          </div>
        </div>
      </header>

      <nav className="w-full max-w-6xl px-8 mb-12 flex justify-center md:justify-start">
        <div className="flex bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-xl">
          <button onClick={() => setActiveTab('landscape')} className={`px-8 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'landscape' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Terrain</button>
          <button onClick={() => setActiveTab('library')} className={`px-8 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'library' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Library</button>
        </div>
      </nav>

      <main className="w-full max-w-6xl flex-grow px-4 md:px-8">
        {activeTab === 'landscape' ? (
          <div className="animate-in fade-in duration-1000">
            <Landscape key={landscapeKey} entries={entries} onEntryHover={() => {}} />
            <InputArea onEntryCreated={handleNewEntry} parentEntry={selectedParentEntry} onCancelThread={() => setSelectedParentEntry(null)} />
            {entries.length > 0 && (
              <section className="mt-12 mb-24 max-w-4xl mx-auto">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium mb-8 px-2">Recent Echoes</h3>
                <div className="space-y-8">
                  {rootEntries.map(entry => <MemoryCard key={entry.id} entry={entry} />)}
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
