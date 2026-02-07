
import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Check, User, Plus, Minus, Maximize, Scan } from 'lucide-react';
import { TeamConfig } from '../types';

interface TeamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: 'home' | 'guest';
  currentConfig: TeamConfig;
  onSave: (config: Partial<TeamConfig>) => void;
}

export const TeamConfigModal: React.FC<TeamConfigModalProps> = ({
  isOpen,
  onClose,
  team,
  currentConfig,
  onSave,
}) => {
  const [name, setName] = useState(currentConfig.name);
  const [tempImage, setTempImage] = useState<string | null>(currentConfig.logoUrl);
  const [crop, setCrop] = useState(currentConfig.logoCrop);
  const [textColor, setTextColor] = useState(currentConfig.textColor || '#ffffff');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{width: number, height: number} | null>(null);

  // Gesture refs
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const initialCropRef = useRef(currentConfig.logoCrop);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentConfig.name);
      setTempImage(currentConfig.logoUrl);
      setCrop(currentConfig.logoCrop);
      setTextColor(currentConfig.textColor || '#ffffff');
      setImgDimensions(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  // Resize image to ensure it fits in localStorage (max 512px)
  const resizeAndConvert = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      try {
        const base64 = await resizeAndConvert(e.target.files[0]);
        setTempImage(base64);
        // Reset crop will be handled by handleImageLoad when the new image renders
      } catch (err) {
        console.error("Failed to process image", err);
        alert("Failed to load image. Please try another file.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const containerSize = 256; 
    
    setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });

    // Only set default crop if this seems to be a new load (we're processing or crop is default/empty)
    // However, for consistency, we re-calculate best fit on load.
    
    const scaleX = containerSize / img.naturalWidth;
    const scaleY = containerSize / img.naturalHeight;
    // Fit Maximum (Cover behavior) as requested
    const fitScale = Math.max(scaleX, scaleY);
    
    setCrop(prev => ({
      ...prev,
      x: 0,
      y: 0,
      scale: Number(fitScale.toFixed(3))
    }));
  };

  const resetToFit = (mode: 'cover' | 'contain' = 'cover') => {
    if (!imgDimensions) return;
    const containerSize = 256;
    const scaleX = containerSize / imgDimensions.width;
    const scaleY = containerSize / imgDimensions.height;
    const fitScale = mode === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

    setCrop({
      x: 0,
      y: 0,
      scale: Number(fitScale.toFixed(3))
    });
  };

  const handleSave = () => {
    onSave({
      name,
      logoUrl: tempImage,
      logoCrop: crop,
      textColor,
    });
    onClose();
  };

  const adjustZoom = (delta: number) => {
    setCrop(prev => ({
      ...prev,
      scale: Math.max(0.01, prev.scale + delta)
    }));
  };

  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!tempImage) return;
    initialCropRef.current = { ...crop };
    if (e.touches.length === 2) {
      touchStartDistRef.current = getTouchDist(e.touches);
    } else if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!tempImage) return;
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const currentDist = getTouchDist(e.touches);
      const ratio = currentDist / touchStartDistRef.current;
      const newScale = Math.max(0.01, initialCropRef.current.scale * ratio);
      setCrop(prev => ({ ...prev, scale: newScale }));
    } else if (e.touches.length === 1 && touchStartRef.current !== null) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setCrop(prev => ({
        ...prev,
        x: initialCropRef.current.x + dx,
        y: initialCropRef.current.y + dy
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialCropRef.current = { ...crop };
      touchStartDistRef.current = null;
    } else {
      touchStartRef.current = null;
      touchStartDistRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-xl font-ui font-bold text-white uppercase tracking-tighter">
            Configure {team} Team
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-ui text-cyan-400 mb-2 uppercase tracking-widest font-bold">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white font-led text-xl tracking-widest focus:border-cyan-500 focus:outline-none"
              placeholder="Enter Name"
            />
          </div>

          <div>
            <label className="block text-xs font-ui text-cyan-400 mb-2 uppercase tracking-widest font-bold">Label Color</label>
            <div className="flex items-center space-x-3 bg-black p-2 border border-gray-700 rounded">
              <input 
                type="color" 
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-10 h-10 bg-transparent border-none cursor-pointer"
              />
              <span className="font-mono text-sm text-gray-400 uppercase">{textColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-ui text-cyan-400 mb-2 uppercase tracking-widest font-bold">Team Logo</label>
            <div className="mb-4">
               <label className="cursor-pointer flex items-center justify-center space-x-2 w-full py-3 border border-dashed border-gray-600 rounded bg-black/40 hover:bg-gray-800 transition-colors">
                 <Upload size={16} className="text-cyan-400" />
                 <span className="text-sm font-bold uppercase">{isProcessing ? 'Processing...' : 'Choose Logo Image'}</span>
                 <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
               </label>
            </div>

            <div 
              ref={containerRef}
              className="relative w-full aspect-square max-w-[256px] mx-auto bg-black border-2 border-white/20 overflow-hidden shadow-inner mb-4 touch-none cursor-move select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {!tempImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                  <User size={48} className="mb-2 opacity-20" />
                  <span className="text-xs uppercase font-bold tracking-widest">No Logo</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                    <img 
                      ref={imgRef}
                      src={tempImage} 
                      alt="Preview" 
                      onLoad={handleImageLoad}
                      className="max-w-none origin-center"
                      style={{
                        transform: `translate(${crop.x}px, ${crop.y}px) scale(${crop.scale})`,
                        transition: 'transform 50ms linear' 
                      }}
                    />
                </div>
              )}
            </div>

            {tempImage && (
              <div className="space-y-4 bg-black/50 p-4 rounded-lg border border-gray-800">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Zoom Scale</span>
                    <span className="text-[10px] text-cyan-400 font-mono">{(crop.scale * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => adjustZoom(-0.1)} className="p-2 bg-gray-800 rounded-md text-white border border-gray-700"><Minus size={18} /></button>
                    <input type="range" min="0.01" max="20" step="0.01" value={crop.scale} onChange={(e) => setCrop(prev => ({ ...prev, scale: parseFloat(e.target.value) }))} className="flex-1 accent-cyan-500 h-1 bg-gray-700 appearance-none cursor-pointer" />
                    <button onClick={() => adjustZoom(0.1)} className="p-2 bg-gray-800 rounded-md text-white border border-gray-700"><Plus size={18} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                  <input type="range" min="-500" max="500" value={crop.x} onChange={(e) => setCrop(prev => ({ ...prev, x: parseInt(e.target.value) }))} className="accent-cyan-500" />
                  <input type="range" min="-500" max="500" value={crop.y} onChange={(e) => setCrop(prev => ({ ...prev, y: parseInt(e.target.value) }))} className="accent-cyan-500" />
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => resetToFit('cover')} className="flex-1 text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-widest border border-gray-800 hover:border-gray-600 bg-gray-900 py-2 rounded-lg flex items-center justify-center space-x-1">
                    <Maximize size={12} />
                    <span>Fill Box</span>
                  </button>
                  <button onClick={() => resetToFit('contain')} className="flex-1 text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-widest border border-gray-800 hover:border-gray-600 bg-gray-900 py-2 rounded-lg flex items-center justify-center space-x-1">
                    <Scan size={12} />
                    <span>Fit All</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end bg-gray-900">
          <button onClick={handleSave} disabled={isProcessing} className="flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white px-8 py-4 rounded font-ui font-bold w-full uppercase tracking-widest">
            <Check size={20} />
            <span>{isProcessing ? 'PROCESSING...' : 'SAVE TEAM'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
