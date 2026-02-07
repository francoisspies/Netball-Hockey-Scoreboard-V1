
import React, { useState } from 'react';
import { X, Trash2, Trophy, Calendar, Hash, Save, History, Check, User, Image as ImageIcon, Loader2, Share2 } from 'lucide-react';
import { GameStat, GameSettings, TeamConfig } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GameStat[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onSaveCurrent: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

// Helper to load image for canvas
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Attempt to handle CORS if applicable
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img); // Resolve anyway to avoid breaking the chain, just won't draw
    img.src = src;
  });
};

const formatPhaseName = (phase: string) => {
  if (phase === 'END_GAME') return 'FINAL SCORE';
  return phase.replace(/_/g, ' ');
};

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  history = [],
  onDelete,
  onClear,
  onSaveCurrent,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const safeHistory = Array.isArray(history) ? history : [];

  const generateCSV = () => {
    const headers = ['Date', 'Home Team', 'Home Score', 'Guest Team', 'Guest Score', 'Status'];
    const rows = safeHistory.map(stat => [
      new Date(stat.timestamp).toLocaleString().replace(',', ''),
      `"${stat.homeConfig.name.replace(/"/g, '""')}"`,
      stat.homeConfig.score,
      `"${stat.guestConfig.name.replace(/"/g, '""')}"`,
      stat.guestConfig.score,
      formatPhaseName(stat.finalPhase)
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const handleCopyCSV = async () => {
    const csv = generateCSV();
    
    // Try native share first (Text)
    // Cast navigator to any to avoid TS2550 if lib dom is not strict enough
    const nav = navigator as any;
    if (nav.share && nav.canShare && nav.canShare({ text: csv })) {
      try {
        await nav.share({
          title: 'Netball Match Stats',
          text: csv
        });
        return; // Share successful
      } catch (e) {
        // Share cancelled or failed, continue to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard.');
    }
  };

  const generateHistoryImage = async (): Promise<Blob | null> => {
    if (safeHistory.length === 0) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const WIDTH = 800;
    const PADDING = 40;
    const HEADER_HEIGHT = 140;
    const ROW_HEIGHT = 120; 
    const FOOTER_HEIGHT = 80;
    
    // Sort reverse chronological (newest first)
    const sorted = [...safeHistory].reverse();
    const totalHeight = HEADER_HEIGHT + (sorted.length * ROW_HEIGHT) + FOOTER_HEIGHT;

    canvas.width = WIDTH;
    canvas.height = totalHeight;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, totalHeight);
    grad.addColorStop(0, '#0f172a'); // slate-900
    grad.addColorStop(1, '#000000'); // black
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, totalHeight);

    // Decorative Header Line
    ctx.fillStyle = '#0891b2'; // cyan-600
    ctx.fillRect(0, 0, WIDTH, 10);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOURNAMENT RESULTS', WIDTH / 2, 70);
    
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '24px sans-serif';
    ctx.fillText(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), WIDTH / 2, 115);

    // Rows
    for (let i = 0; i < sorted.length; i++) {
        const stat = sorted[i];
        const y = HEADER_HEIGHT + (i * ROW_HEIGHT);
        const centerY = y + (ROW_HEIGHT / 2);

        // Row Separator
        if (i > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(PADDING, y, WIDTH - (PADDING * 2), 1);
        }
        
        // Date Label (Top center of row)
        ctx.fillStyle = '#64748b'; // slate-500
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(new Date(stat.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), WIDTH / 2, y + 15);
        
        // Phase Label (Top Right)
        ctx.textAlign = 'right';
        ctx.fillText(formatPhaseName(stat.finalPhase), WIDTH - PADDING, y + 15);

        // --- SCORES ---
        ctx.fillStyle = '#facc15'; // Yellow for scores
        ctx.font = '60px "Jersey 10", monospace'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${stat.homeConfig.score} - ${stat.guestConfig.score}`, WIDTH / 2, centerY + 15);

        // --- TEAMS DRAWING HELPER ---
        const drawTeam = async (config: TeamConfig, side: 'left' | 'right') => {
            const isLeft = side === 'left';
            const logoX = isLeft ? PADDING : WIDTH - PADDING - 60;
            const textAlign = isLeft ? 'left' : 'right';
            const nameX = isLeft ? PADDING + 80 : WIDTH - PADDING - 80;
            
            // Draw Logo
            const size = 60;
            const ly = centerY - size/2 + 15;
            
            if (config.logoUrl) {
                try {
                   const img = await loadImage(config.logoUrl);
                   
                   ctx.save();
                   // Shadow for emboss effect in canvas
                   ctx.shadowColor = 'rgba(0,0,0,0.5)';
                   ctx.shadowBlur = 4;
                   ctx.shadowOffsetY = 2;
                   
                   ctx.beginPath();
                   ctx.arc(logoX + size/2, ly + size/2, size/2, 0, Math.PI*2);
                   ctx.closePath();
                   ctx.clip();
                   
                   // Draw image fit cover
                   const scale = Math.max(size / img.width, size / img.height);
                   const w = img.width * scale;
                   const h = img.height * scale;
                   const dx = logoX + (size - w) / 2;
                   const dy = ly + (size - h) / 2;
                   
                   ctx.drawImage(img, dx, dy, w, h);
                   ctx.restore();
                   
                   // Border ring
                   ctx.strokeStyle = config.color || '#fff';
                   ctx.lineWidth = 2;
                   ctx.beginPath();
                   ctx.arc(logoX + size/2, ly + size/2, size/2, 0, Math.PI*2);
                   ctx.stroke();

                } catch(e) { /* Fallback */ 
                   ctx.fillStyle = '#1e293b';
                   ctx.beginPath();
                   ctx.arc(logoX + size/2, ly + size/2, size/2, 0, Math.PI*2);
                   ctx.fill();
                   ctx.fillStyle = '#475569';
                   ctx.font = '20px sans-serif';
                   ctx.textAlign = 'center';
                   ctx.textBaseline = 'middle';
                   ctx.fillText(config.name.substring(0,2).toUpperCase(), logoX + size/2, ly + size/2);
                }
            } else {
                 ctx.fillStyle = '#1e293b';
                 ctx.beginPath();
                 ctx.arc(logoX + size/2, ly + size/2, size/2, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.strokeStyle = '#334155';
                 ctx.lineWidth = 1;
                 ctx.stroke();
                 
                 ctx.fillStyle = '#94a3b8';
                 ctx.font = 'bold 20px sans-serif';
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'middle';
                 ctx.fillText(config.name.substring(0,1).toUpperCase(), logoX + size/2, ly + size/2);
            }

            // Draw Name
            ctx.shadowColor = 'transparent'; // reset shadow
            ctx.fillStyle = config.textColor || '#e2e8f0';
            ctx.font = 'bold 24px "Chakra Petch", sans-serif';
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'middle';
            ctx.fillText(config.name, nameX, centerY + 15);
        };

        await drawTeam(stat.homeConfig, 'left');
        await drawTeam(stat.guestConfig, 'right');
    }

    // Footer
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, totalHeight - FOOTER_HEIGHT, WIDTH, FOOTER_HEIGHT);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Created with Netball Hockey Scoreboard Cell 0824110824', WIDTH / 2, totalHeight - (FOOTER_HEIGHT/2));

    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
    });
  };

  const handleShareImage = async () => {
    if (safeHistory.length === 0) return;
    setIsSharing(true);

    try {
        const blob = await generateHistoryImage();
        if (!blob) throw new Error('Failed to generate image');
        const filename = `Netball_History_${new Date().toISOString().slice(0,10)}.png`;
        const file = new File([blob], filename, { type: 'image/png' });
        
        const nav = navigator as any;

        // Try native share first (Files)
        if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
            await nav.share({
                files: [file],
                title: 'Tournament Results',
            });
        } else {
             // Fallback to Clipboard if supported
             // Check for ClipboardItem global support
             const ClipboardItem = (window as any).ClipboardItem;
             if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
                try {
                  await navigator.clipboard.write([
                      new ClipboardItem({ [blob.type]: blob })
                  ]);
                  alert('Image copied to clipboard!');
                } catch(e) { throw new Error('Clipboard copy failed.'); }
             } else {
                // Fallback to Download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 100);
             }
        }
    } catch (e) {
        console.error(e);
        // Fallback for cancellation or errors is handled gracefully
    } finally {
        setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 flex-shrink-0 bg-gradient-to-r from-gray-900 to-black">
          <div className="flex items-center space-x-3">
            <History className="text-cyan-400" size={24} />
            <h3 className="text-xl font-ui font-bold text-white uppercase tracking-tighter">
              Game Statistics
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Action Bar */}
          <div className="p-4 bg-black/60 border-b border-gray-800 flex flex-col space-y-3">
            <button 
              onClick={onSaveCurrent}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
            >
              <Save size={18} />
              <span>Record Current Game</span>
            </button>
            
            <button 
              onClick={handleShareImage}
              disabled={safeHistory.length === 0 || isSharing}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-lg shadow-green-900/20"
            >
              {isSharing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
              <span>{isSharing ? 'Generating...' : 'Share History Card (Image)'}</span>
            </button>
            
            <button 
              onClick={handleCopyCSV}
              disabled={safeHistory.length === 0}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed ${copied ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400 active:bg-gray-700'}`}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copied ? 'Copied' : 'Share / Copy CSV'}</span>
            </button>

            <button 
              onClick={() => { if(confirm('Permanently delete all records?')) onClear(); }}
              disabled={safeHistory.length === 0}
              className="w-full flex items-center justify-center space-x-2 bg-red-900/10 border border-red-900/30 text-red-500 p-3 rounded-xl active:bg-red-900/20 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              <span>Clear All Records</span>
            </button>
          </div>

          {/* List Content */}
          <div className="p-4 bg-black/20">
            {safeHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-700 space-y-6 opacity-30">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                  <Trophy size={40} />
                </div>
                <p className="text-xs uppercase font-black tracking-[0.3em]">No Recorded Matches</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...safeHistory].reverse().map((stat) => (
                  <div key={stat.id} className="bg-gradient-to-br from-gray-900 to-black border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                        <Calendar size={14} className="text-cyan-600" />
                        <span>{new Date(stat.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => onDelete(stat.id)}
                          className="text-gray-600 hover:text-red-500 p-2 transition-colors rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-md border border-gray-950 flex items-center justify-center mb-2">
                           <div className="w-[calc(100%-4px)] h-[calc(100%-4px)] bg-black rounded-xl shadow-inner overflow-hidden relative flex items-center justify-center border border-white/5">
                            {stat.homeConfig.logoUrl ? (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `scale(${48/256})`, transformOrigin: 'center' }}>
                                <div className="w-[256px] h-[256px] relative flex items-center justify-center">
                                  <img src={stat.homeConfig.logoUrl} className="max-w-none origin-center" style={{ transform: `translate(${stat.homeConfig.logoCrop.x}px, ${stat.homeConfig.logoCrop.y}px) scale(${stat.homeConfig.logoCrop.scale})` }} />
                                </div>
                              </div>
                            ) : <User size={16} className="opacity-20" />}
                           </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate w-full text-center px-1">{stat.homeConfig.name}</p>
                        <p className="text-4xl font-led text-white tracking-widest">{stat.homeConfig.score}</p>
                      </div>

                      <div className="flex flex-col items-center px-4">
                        <div className="w-[1px] h-4 bg-gray-800"></div>
                        <span className="text-[9px] font-black text-cyan-500/60 my-1">VS</span>
                        <div className="w-[1px] h-4 bg-gray-800"></div>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-md border border-gray-950 flex items-center justify-center mb-2">
                           <div className="w-[calc(100%-4px)] h-[calc(100%-4px)] bg-black rounded-xl shadow-inner overflow-hidden relative flex items-center justify-center border border-white/5">
                            {stat.guestConfig.logoUrl ? (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `scale(${48/256})`, transformOrigin: 'center' }}>
                                <div className="w-[256px] h-[256px] relative flex items-center justify-center">
                                  <img src={stat.guestConfig.logoUrl} className="max-w-none origin-center" style={{ transform: `translate(${stat.guestConfig.logoCrop.x}px, ${stat.guestConfig.logoCrop.y}px) scale(${stat.guestConfig.logoCrop.scale})` }} />
                                </div>
                              </div>
                            ) : <User size={16} className="opacity-20" />}
                           </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate w-full text-center px-1">{stat.guestConfig.name}</p>
                        <p className="text-4xl font-led text-white tracking-widest">{stat.guestConfig.score}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-800/40 flex justify-center">
                       <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.4em] px-3 py-1 bg-black/40 rounded-full border border-white/5">
                         {formatPhaseName(stat.finalPhase)}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black border-t border-gray-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2 text-gray-600">
            <Hash size={14} />
            <span className="text-xs font-black uppercase tracking-widest">{safeHistory.length} RECORDS</span>
          </div>
          <button 
            onClick={onClose}
            className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 hover:text-white transition-all px-4 py-2 border border-cyan-400/20 rounded-lg bg-cyan-400/5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
