
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MemoryEntry, EmotionCategory } from '../types';

interface LandscapeProps {
  entries: MemoryEntry[];
  onEntryHover: (entry: MemoryEntry | null) => void;
}

const emotionColors: Record<EmotionCategory, THREE.Color> = {
  [EmotionCategory.Joy]: new THREE.Color('#fbbf24'),
  [EmotionCategory.Sorrow]: new THREE.Color('#60a5fa'),
  [EmotionCategory.Anger]: new THREE.Color('#f87171'),
  [EmotionCategory.Fear]: new THREE.Color('#a78bfa'),
  [EmotionCategory.Calm]: new THREE.Color('#34d399'),
  [EmotionCategory.Excitement]: new THREE.Color('#f472b6'),
  [EmotionCategory.Anxiety]: new THREE.Color('#fb923c'),
  [EmotionCategory.Awe]: new THREE.Color('#22d3ee'),
};

const emotionZMap: Record<EmotionCategory, number> = {
  [EmotionCategory.Joy]: -12, [EmotionCategory.Sorrow]: 12, [EmotionCategory.Anger]: 4, [EmotionCategory.Fear]: 16,
  [EmotionCategory.Calm]: 0, [EmotionCategory.Excitement]: -6, [EmotionCategory.Anxiety]: 8, [EmotionCategory.Awe]: -16,
};

const baseColor = new THREE.Color(0x1a1a1e);

const Landscape: React.FC<LandscapeProps> = ({ entries, onEntryHover }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const landmarksRef = useRef<THREE.Group>(new THREE.Group());
  const controlsRef = useRef<OrbitControls | null>(null);

  const latestEntries = useMemo(() => [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 15), [entries]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight || 1, 0.1, 1000);
    camera.position.set(0, 25, 35);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(15, 40, 15);
    scene.add(dirLight);

    const geometry = new THREE.PlaneGeometry(70, 50, 160, 160);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({ 
      roughness: 0.7, 
      metalness: 0.2, 
      vertexColors: true, 
      transparent: true, 
      opacity: 0.95 
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;
    scene.add(landmarksRef.current);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }
        }
      }
    });
    resizeObserver.observe(container);

    const animate = (time: number) => {
      if (controlsRef.current) controlsRef.current.update();
      landmarksRef.current.children.forEach((l, i) => {
        l.position.y += Math.sin(time * 0.0015 + i) * 0.003;
        (l as THREE.Mesh).rotation.y += 0.005;
      });
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestAnimationFrame(animate);
    };
    const animId = requestAnimationFrame(animate);

    const onPointerDown = (e: MouseEvent) => {
      if (!cameraRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(landmarksRef.current.children);
      if (intersects.length > 0) setSelectedEntry((intersects[0].object as any).userData.entry);
      else setSelectedEntry(null);
    };
    container.addEventListener('mousedown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onPointerDown);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const position = geometry.getAttribute('position');
    
    if (!geometry.getAttribute('color')) {
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(position.count * 3, 3));
    }
    
    const colors = geometry.getAttribute('color');
    while(landmarksRef.current.children.length) landmarksRef.current.remove(landmarksRef.current.children[0]);

    if (entries.length === 0) {
      for (let i = 0; i < position.count; i++) {
        position.setY(i, 0);
        colors.setXYZ(i, baseColor.r, baseColor.g, baseColor.b);
      }
      position.needsUpdate = true;
      colors.needsUpdate = true;
      geometry.computeVertexNormals();
      return;
    }

    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    const minTime = sorted[0].timestamp;
    const timeRange = (sorted[sorted.length - 1].timestamp - minTime) || 1;

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      let height = 0;
      const vertexColor = baseColor.clone();

      entries.forEach(entry => {
        const entryX = entries.length === 1 ? 0 : ((entry.timestamp - minTime) / timeRange) * 50 - 25;
        
        entry.analysis.dominantEmotions.forEach(emotion => {
          const entryZ = emotionZMap[emotion] || 0;
          const distSq = (x - entryX)**2 + (z - entryZ)**2;
          const influence = Math.exp(-distSq / 18);
          
          const weight = 1 / entry.analysis.dominantEmotions.length;
          height += (entry.analysis.intensity * 1.1 * influence) * weight;
          
          const targetColor = emotionColors[emotion] || baseColor;
          vertexColor.lerp(targetColor, influence * 1.2 * weight);
        });
      });

      height += Math.sin(x * 0.2 + z * 0.2) * 0.3;
      position.setY(i, height);
      colors.setXYZ(i, vertexColor.r, vertexColor.g, vertexColor.b);
    }
    
    position.needsUpdate = true;
    colors.needsUpdate = true;
    geometry.computeVertexNormals();

    latestEntries.forEach(entry => {
      const entryX = entries.length === 1 ? 0 : ((entry.timestamp - minTime) / timeRange) * 50 - 25;
      
      entry.analysis.dominantEmotions.forEach((emotion, emotionIdx) => {
        const entryZ = emotionZMap[emotion] || 0;
        
        let h = 0;
        entries.forEach(e => {
          const ex = entries.length === 1 ? 0 : ((e.timestamp - minTime) / timeRange) * 50 - 25;
          e.analysis.dominantEmotions.forEach(em => {
            const ez = emotionZMap[em] || 0;
            const influence = Math.exp(-((entryX - ex)**2 + (entryZ - ez)**2) / 18);
            const weight = 1 / e.analysis.dominantEmotions.length;
            h += (e.analysis.intensity * 1.1 * influence) * weight;
          });
        });
        
        const color = emotionColors[emotion] || new THREE.Color(0xffffff);
        const size = entry.analysis.dominantEmotions.length > 1 ? 0.5 : 0.7;
        
        const sphere = new THREE.Mesh(
          new THREE.IcosahedronGeometry(size, 2), 
          new THREE.MeshStandardMaterial({ 
            color, 
            emissive: color, 
            emissiveIntensity: 1.2, 
            transparent: true, 
            opacity: 0.9 
          })
        );
        
        sphere.position.set(entryX, h + 1.2 + (emotionIdx * 0.2), entryZ);
        (sphere as any).userData = { entry };
        landmarksRef.current.add(sphere);
      });
    });
  }, [entries, latestEntries]);

  return (
    <div className="w-full relative glass rounded-3xl overflow-hidden h-[550px] mb-8 border border-white/10 shadow-2xl">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-[#0a0a0c]" />
      {selectedEntry && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass p-6 rounded-2xl w-80 shadow-2xl animate-in fade-in zoom-in duration-300 pointer-events-auto z-10">
          <button 
            onClick={() => setSelectedEntry(null)} 
            className="absolute top-2.5 right-2.5 text-gray-500 hover:text-white transition-colors p-2 z-20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="mb-3 flex items-center justify-between pr-8">
             <span className="text-[9px] text-gray-500 uppercase tracking-widest">{new Date(selectedEntry.timestamp).toLocaleDateString()}</span>
             {selectedEntry.location && (
               <div className="flex items-center gap-1">
                 <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 <span className="text-[8px] text-gray-500 uppercase tracking-tighter truncate max-w-[120px]">{selectedEntry.location.name || `${selectedEntry.location.lat.toFixed(1)}, ${selectedEntry.location.lng.toFixed(1)}`}</span>
               </div>
             )}
          </div>
          
          <p className="text-white text-sm font-serif italic mb-4 leading-relaxed">"{selectedEntry.analysis.summary}"</p>
          
          <div className="flex flex-wrap gap-2">
            {selectedEntry.analysis.dominantEmotions.map(e => (
              <div key={e} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#' + (emotionColors[e] || baseColor).getHexString() }}></span>
                <span className="text-[8px] uppercase tracking-tighter text-gray-300">{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {entries.length === 0 && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/20 font-serif italic text-xl">The landscape is waiting for a memory.</div>}
    </div>
  );
};

export default Landscape;
