
import React, { useState, useRef } from 'react';
import { analyzeMemory } from '../services/geminiService';
import { MemoryEntry } from '../types';

interface InputAreaProps {
  onEntryCreated: (entry: MemoryEntry) => void;
  parentEntry: MemoryEntry | null;
  onCancelThread: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onEntryCreated, parentEntry, onCancelThread }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !image) || isSubmitting) return;

    setIsSubmitting(true);
    let userCoords: { lat: number, lng: number } | undefined;

    if (includeLocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (err) {
        console.warn("Location permission denied or unavailable.");
      }
    }

    try {
      const result = await analyzeMemory(text, image || undefined, userCoords);
      const { location, ...analysis } = result;
      
      const newEntry: MemoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        rawText: text,
        imageUrl: image || undefined,
        parentId: parentEntry?.id,
        location,
        analysis
      };
      onEntryCreated(newEntry);
      setText('');
      setImage(null);
    } catch (error) {
      console.error("Failed to analyze memory:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) setText(prev => prev + ' ' + event.results[i][0].transcript);
      }
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-12">
      <div className="glass rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r transition-colors duration-500 ${parentEntry ? 'from-purple-400 via-pink-400 to-amber-400' : 'from-purple-500/50 via-blue-500/50 to-amber-500/50'}`}></div>
        
        {parentEntry && (
          <div className="mb-4 flex items-center justify-between bg-white/5 p-2 px-3 rounded-lg border border-white/5 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold shrink-0">Threading to:</span>
              <span className="text-xs text-gray-300 italic truncate">"{parentEntry.analysis.summary}"</span>
            </div>
            <button onClick={onCancelThread} className="text-[10px] text-gray-500 hover:text-white uppercase transition-colors">Cancel</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            {image && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 group">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImage(null)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={parentEntry ? "Expand on this feeling..." : (image ? "Describe this moment..." : "A moment captured...")}
              className="w-full h-32 bg-transparent text-xl font-serif italic outline-none resize-none placeholder-gray-600 focus:placeholder-gray-500 transition-all"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={toggleRecording} className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/5 text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-white/5 text-gray-400 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              <button type="button" onClick={() => setIncludeLocation(!includeLocation)} className={`p-2 rounded-full transition-all ${includeLocation ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            
            <button
              type="submit"
              disabled={(!text.trim() && !image) || isSubmitting}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${parentEntry ? 'bg-purple-500/30 hover:bg-purple-500/50 text-purple-100' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Mapping...</> : (parentEntry ? 'Thread Memory' : 'Map Memory')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputArea;
