
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, User, Settings2, RotateCcw, AlertTriangle, ShieldCheck, BarChart2, Maximize2, Minimize2, CheckCircle2, X as CloseIcon, MoreHorizontal } from 'lucide-react';
import { GamePhase, TeamConfig, GameSettings, SettingsProfile, GameStat } from './types';
import { DotMatrix } from './components/DotMatrix';
import { TeamConfigModal } from './components/TeamConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { ActivationScreen } from './components/ActivationScreen';
import { StatsModal } from './components/StatsModal';

// --- CONSTANTS ---
const STORAGE_KEYS = {
  SETTINGS: 'netball_pro_settings',
  HOME_TEAM: 'netball_pro_home_team',
  GUEST_TEAM: 'netball_pro_guest_team',
  PROFILES: 'netball_pro_profiles',
  GAME_HISTORY: 'netball_pro_game_history',
  FIRST_LAUNCH: 'netball_pro_install_date',
  ACTIVATED: 'netball_pro_is_activated',
  ACTIVATION_DATE: 'netball_pro_activation_date',
  DEVICE_ID: 'netball_pro_device_id',
};

const TRIAL_MINUTES = 30;
const TRIAL_MS = TRIAL_MINUTES * 60 * 1000;
const LICENSE_MONTHS = 4;
const LICENSE_MS = LICENSE_MONTHS * 30 * 24 * 60 * 60 * 1000; 

const INITIAL_SETTINGS: GameSettings = {
  quarterLength: 15,
  breakLength: 2,
  halftimeLength: 5,
  soundType: 'whistle-netball',
  scoreScale: 1.0,   
  logoSizeScale: 1.0,
  timerScale: 1.0,
  timerX: 0,
  timerY: 0,
  homeScoreX: 0,
  homeScoreY: 0,
  guestScoreX: 0,
  guestScoreY: 0,
  middleFrameX: 0,
  middleFrameY: 0,
  homeLogoX: 0,
  homeLogoY: 0,
  guestLogoX: 0,
  guestLogoY: 0,
  settingsIconX: 8, 
  settingsIconY: 92,
  speakerIconX: 94,
  speakerIconY: 92,
  favoriteGroups: [],
};

const INITIAL_TEAM_CONFIG = (name: string, color: string): TeamConfig => ({
  name,
  color,
  textColor: '#ffffff',
  logoUrl: null,
  logoCrop: { x: 0, y: 0, scale: 1 },
  score: 0,
});

const generateExpectedKey = (deviceId: string): string => {
  const cleanId = (deviceId || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  let sum = 0;
  for (let i = 0; i < cleanId.length; i++) sum += cleanId.charCodeAt(i);
  const part1 = (sum * 7).toString().slice(0, 4).padStart(4, '1');
  const part2 = parseInt(cleanId.slice(0, 4), 16).toString().slice(0, 5).padStart(5, '2');
  const part3 = parseInt(cleanId.slice(4, 8), 16).toString().slice(0, 5).padStart(5, '3');
  const part4 = "88"; 
  return (part1 + part2 + part3 + part4).slice(0, 16);
};

const generateSafeId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

// --- UTILS ---
const TeamLogoHeader = memo(({ config, onClick }: { config: TeamConfig, onClick: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [innerSize, setInnerSize] = useState(0);

  useEffect(() => {
    // Use ResizeObserver for robust size tracking during orientation changes
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setInnerSize(entry.contentRect.width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scale = innerSize ? innerSize / 256 : 1;

  return (
    <div 
      onClick={onClick}
      className="relative group cursor-pointer select-none transition-transform active:scale-95 z-10"
    >
      {/* Outer Bezel (Embossed Effect) - Increased base sizes */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] border border-gray-950 flex items-center justify-center group-hover:shadow-[0_8px_20px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] group-hover:border-cyan-500/30 transition-all duration-300">
        
        {/* Inner Recess (Debossed Screen) */}
        <div 
          ref={containerRef}
          className="w-[calc(100%-8px)] h-[calc(100%-8px)] bg-black rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden relative flex items-center justify-center border border-white/5"
        >
          {config.logoUrl ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
               <div className="w-[256px] h-[256px] relative flex items-center justify-center">
                 <img src={config.logoUrl} alt={config.name} className="max-w-none origin-center drop-shadow-md" style={{ transform: `translate(${config.logoCrop.x}px, ${config.logoCrop.y}px) scale(${config.logoCrop.scale})` }} />
               </div>
            </div>
          ) : (
            <User size={24} className="text-gray-600 opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
});

const TeamNameDisplay = memo(({ config, className = "" }: { config: TeamConfig, className?: string }) => {
  const scaleFactor = Math.max(0.4, Math.min(1.0, 10 / (config.name.length || 1)));
  return (
    <h2 className={`font-led uppercase tracking-wider text-center truncate w-full mt-1.5 drop-shadow-md ${className}`} style={{ color: config.textColor, fontSize: `clamp(0.6rem, ${2.5 * scaleFactor}vw, 1.5rem)` }}>
      {config.name}
    </h2>
  );
});

export default function App() {
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      const parsed = JSON.parse(saved);

      // Handle arrays separately to avoid object-merging logic
      if (Array.isArray(defaultValue)) {
        return Array.isArray(parsed) ? (parsed as unknown as T) : defaultValue;
      }

      // Handle objects with property merging
      if (typeof defaultValue === 'object' && defaultValue !== null) {
        const merged = { ...defaultValue };
        const parsedObj = parsed as Record<string, any>;
        Object.keys(defaultValue).forEach(k => {
           const key = k as keyof T;
           // Explicit check to safely merge known keys
           if (parsedObj[k] !== undefined && parsedObj[k] !== null) {
             merged[key] = parsedObj[k];
           }
        });
        return merged;
      }
      
      // Handle primitives
      return (parsed !== null && typeof parsed === typeof defaultValue) ? (parsed as unknown as T) : defaultValue;
    } catch (e) { 
      return defaultValue; 
    }
  };

  const [isActivated, setIsActivated] = useState<boolean>(() => loadFromStorage(STORAGE_KEYS.ACTIVATED, false));
  const [activationDate, setActivationDate] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVATION_DATE);
    return saved ? parseInt(saved) : null;
  });
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [installDate] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
    if (saved) return parseInt(saved);
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, now.toString());
    return now;
  });
  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = Array.from({length: 8}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  });

  const [settings, setSettings] = useState<GameSettings>(() => loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
  const [phase, setPhase] = useState<GamePhase>(GamePhase.PRE_GAME);
  const [timeLeft, setTimeLeft] = useState((settings.quarterLength || 15) * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [homeTeam, setHomeTeam] = useState<TeamConfig>(() => loadFromStorage(STORAGE_KEYS.HOME_TEAM, INITIAL_TEAM_CONFIG('HOME', '#ef4444'))); 
  const [guestTeam, setGuestTeam] = useState<TeamConfig>(() => loadFromStorage(STORAGE_KEYS.GUEST_TEAM, INITIAL_TEAM_CONFIG('GUEST', '#eab308')));
  const [profiles, setProfiles] = useState<SettingsProfile[]>(() => loadFromStorage(STORAGE_KEYS.PROFILES, []));
  const [gameHistory, setGameHistory] = useState<GameStat[]>(() => loadFromStorage(STORAGE_KEYS.GAME_HISTORY, []));
  const [modalOpen, setModalOpen] = useState<'home' | 'guest' | 'settings' | 'reset' | 'history' | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const touchStartRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const hasAutoSavedRef = useRef(false);

  const isLicenseExpired = isActivated && activationDate && (Date.now() - activationDate > LICENSE_MS);
  const isTrialExpired = !isActivated && (Date.now() - installDate > TRIAL_MS);
  const mustActivate = isTrialExpired || isLicenseExpired;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVATED, JSON.stringify(isActivated));
    if (activationDate) localStorage.setItem(STORAGE_KEYS.ACTIVATION_DATE, activationDate.toString());
  }, [isActivated, activationDate]);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.HOME_TEAM, JSON.stringify(homeTeam)), [homeTeam]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.GUEST_TEAM, JSON.stringify(guestTeam)), [guestTeam]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles)), [profiles]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(gameHistory)), [gameHistory]);

  const handleActivation = (key: string) => {
    if (key.replace(/\s/g, '') === generateExpectedKey(deviceId)) {
      setActivationDate(Date.now());
      setIsActivated(true);
      setShowActivationModal(false);
      return true;
    }
    return false;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSaveCurrentGame = useCallback(() => {
    const newStat: GameStat = { 
      id: generateSafeId(), 
      timestamp: Date.now(), 
      homeConfig: { ...homeTeam }, 
      guestConfig: { ...guestTeam }, 
      finalPhase: phase 
    };
    setGameHistory(prev => Array.isArray(prev) ? [...prev, newStat] : [newStat]);
    
    // UI Feedback
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
    
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  }, [homeTeam, guestTeam, phase]);

  useEffect(() => {
    // Auto-record game when reaching the end phase
    if (phase === GamePhase.END_GAME && !hasAutoSavedRef.current) { 
      handleSaveCurrentGame(); 
      hasAutoSavedRef.current = true; 
    }
    // Reset auto-save flag when game resets
    if (phase === GamePhase.PRE_GAME || phase === GamePhase.START_DELAY) {
      hasAutoSavedRef.current = false;
    }
  }, [phase, handleSaveCurrentGame]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
  };

  const playSound = () => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      
      const createOsc = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        return { osc, gain };
      };

      if (settings.soundType === 'whistle-netball' || settings.soundType === 'whistle-hockey') {
        // High-fidelity pea whistle simulation using Amplitude Modulation
        const isHockey = settings.soundType === 'whistle-hockey';
        const duration = 1.5; // Fixed to 1.5 seconds as requested
        const baseFreq = isHockey ? 3500 : 2800; // Carrier freq
        const modFreq = isHockey ? 75 : 55; // "Pea" flutter frequency
        
        // Carrier (The whistle tone)
        const osc = ctx.createOscillator();
        const mainGain = ctx.createGain();
        osc.connect(mainGain);
        mainGain.connect(ctx.destination);
        
        // Modulator (The pea flutter)
        const modOsc = ctx.createOscillator();
        const modGain = ctx.createGain();
        modOsc.connect(modGain);
        modGain.connect(mainGain.gain); // AM Synthesis: Modulate amplitude of carrier

        // Carrier Config
        osc.type = 'sine'; // Pure tone, modulated by 'pea'
        osc.frequency.setValueAtTime(baseFreq, now); // Steady pitch, no drop

        // Modulator Config (The Pea)
        modOsc.type = 'square'; // Harsh flutter
        modOsc.frequency.setValueAtTime(modFreq, now);
        
        // Volume Envelope
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.5, now + 0.08); // Sharp attack
        mainGain.gain.setValueAtTime(0.5, now + duration - 0.1); // Sustain
        mainGain.gain.linearRampToValueAtTime(0, now + duration); // Release
        
        // Modulation Depth (Gain fluctuation)
        modGain.gain.setValueAtTime(0.25, now); // Significant flutter

        // Start/Stop
        osc.start(now);
        modOsc.start(now);
        osc.stop(now + duration);
        modOsc.stop(now + duration);

      } else {
        // Fallback/Legacy sounds
        const { osc, gain } = createOsc();
        if (settings.soundType.startsWith('whistle')) {
            // Short whistle fallback
             osc.type = 'triangle'; 
             osc.frequency.setValueAtTime(2500, now);
             osc.frequency.linearRampToValueAtTime(2000, now + 0.4);
             gain.gain.setValueAtTime(0, now);
             gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
             gain.gain.linearRampToValueAtTime(0, now + 0.4);
             osc.start(now); osc.stop(now + 0.4);
        } else {
             // Buzzer
             osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
             gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
             osc.start(now); osc.stop(now + 1.5);
        }
      }
    } catch (e) {}
  };

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const toggleTimer = () => {
    initAudio();
    if (!isRunning && phase === GamePhase.PRE_GAME) { setPhase(GamePhase.START_DELAY); setTimeLeft(10); setIsRunning(true); }
    else setIsRunning(!isRunning);
  };

  const advanceFromCurrentPhase = () => {
     const current = phaseRef.current;
     let nextPhase = current, nextDuration = 0;
     const q = (settings.quarterLength || 15) * 60, b = (settings.breakLength || 2) * 60, h = (settings.halftimeLength || 5) * 60;
     switch (current) {
      case GamePhase.PRE_GAME:
      case GamePhase.START_DELAY: nextPhase = GamePhase.Q1; nextDuration = q; break;
      case GamePhase.Q1: nextPhase = GamePhase.Q1_BREAK; nextDuration = b; break;
      case GamePhase.Q1_BREAK: nextPhase = GamePhase.Q2; nextDuration = q; break;
      case GamePhase.Q2: nextPhase = GamePhase.HALFTIME; nextDuration = h; break;
      case GamePhase.HALFTIME: nextPhase = GamePhase.Q3; nextDuration = q; break;
      case GamePhase.Q3: nextPhase = GamePhase.Q3_BREAK; nextDuration = b; break;
      case GamePhase.Q3_BREAK: nextPhase = GamePhase.Q4; nextDuration = q; break;
      case GamePhase.Q4: nextPhase = GamePhase.END_GAME; nextDuration = 0; break;
      case GamePhase.END_GAME: nextPhase = GamePhase.PRE_GAME; nextDuration = q; break;
    }
    return { nextPhase, nextDuration };
  };

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playSound();
            if (phaseRef.current === GamePhase.START_DELAY) { setPhase(GamePhase.Q1); return (settings.quarterLength || 15) * 60; }
            const { nextPhase, nextDuration } = advanceFromCurrentPhase();
            setPhase(nextPhase); if (nextPhase === GamePhase.END_GAME) setIsRunning(false);
            return nextDuration; 
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, settings.quarterLength]);

  const adjustScore = (team: 'home' | 'guest', delta: number) => {
    if (team === 'home') setHomeTeam(p => ({ ...p, score: Math.max(0, (p.score || 0) + delta) }));
    else setGuestTeam(p => ({ ...p, score: Math.max(0, (p.score || 0) + delta) }));
  };

  const getPeriodDisplay = () => {
    switch (phase) {
      case GamePhase.Q1: return '1';
      case GamePhase.Q2: return '2';
      case GamePhase.Q3: return '3';
      case GamePhase.Q4: return '4';
      case GamePhase.Q1_BREAK: return 'B1';
      case GamePhase.Q3_BREAK: return 'B3';
      case GamePhase.HALFTIME: return 'HT';
      case GamePhase.END_GAME: return 'FINAL SCORE';
      case GamePhase.START_DELAY: return 'SD';
      default: return '0';
    }
  };

  const trialMinutesRemaining = Math.ceil(Math.max(0, TRIAL_MS - (Date.now() - installDate)) / (1000 * 60));

  if (mustActivate || showActivationModal) return <ActivationScreen deviceId={deviceId} onActivate={handleActivation} onClose={!mustActivate ? () => setShowActivationModal(false) : undefined} />;

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden relative font-ui select-none text-white">
      {!isActivated && (
        <div className="bg-yellow-600/20 border-b border-yellow-600/30 text-[9px] py-0.5 px-4 text-center font-bold tracking-widest text-yellow-500 flex items-center justify-center flex-shrink-0 z-10">
          <ShieldCheck size={10} className="mr-1" />
          <span>TRIAL PERIOD: {trialMinutesRemaining} MINUTES REMAINING</span>
          <button onClick={() => setShowActivationModal(true)} className="ml-4 px-2 py-0.5 bg-yellow-500 text-black rounded-[2px] text-[8px] font-black uppercase">Activate</button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="w-full pt-4 px-3 flex flex-col items-center bg-black/40 pb-4 flex-shrink-0 relative z-20">
        <div className="w-full flex items-start justify-between overflow-visible">
          <div className="flex flex-col items-center flex-1 max-w-[30%] overflow-visible" style={{ transform: `translate(${settings.homeLogoX || 0}px, ${settings.homeLogoY || 0}px) scale(${settings.logoSizeScale || 1.0})` }}>
            <TeamLogoHeader config={homeTeam} onClick={() => setModalOpen('home')} />
            <TeamNameDisplay config={homeTeam} />
          </div>
          
          {/* TIMER & STATUS CONTAINER */}
          <div className="flex flex-col items-center flex-1 mx-2 transition-transform duration-300 overflow-visible" style={{ transform: `translate(${settings.timerX || 0}px, ${settings.timerY || 0}px) scale(${settings.timerScale || 1.0})` }}>
            <DotMatrix value={Math.floor(timeLeft / 60).toString().padStart(2, '0') + ':' + (timeLeft % 60).toString().padStart(2, '0')} color={phase.includes('BREAK') || phase === 'HALFTIME' ? '#facc15' : '#ef4444'} size="md" />
            
            {/* CONTROLS */}
            <div className="mt-4 flex items-center space-x-8">
              <button onClick={() => setModalOpen('reset')} className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><RotateCcw size={22} /></button>
              <button onClick={toggleTimer} className={`p-3 rounded-full transition-colors ${isRunning ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>{isRunning ? <Pause size={28} /> : <Play size={28} />}</button>
              <button onClick={() => { const { nextPhase, nextDuration } = advanceFromCurrentPhase(); setPhase(nextPhase); setTimeLeft(nextDuration); setIsRunning(false); }} className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><SkipForward size={22} /></button>
            </div>
          </div>

          <div className="flex flex-col items-center flex-1 max-w-[30%] overflow-visible" style={{ transform: `translate(${settings.guestLogoX || 0}px, ${settings.guestLogoY || 0}px) scale(${settings.logoSizeScale || 1.0})` }}>
            <TeamLogoHeader config={guestTeam} onClick={() => setModalOpen('guest')} />
            <TeamNameDisplay config={guestTeam} />
          </div>
        </div>
      </div>

      {/* SCORES ROW */}
      <div className="flex-1 flex flex-row items-center justify-around w-full px-4 overflow-visible relative bg-gradient-to-b from-black/20 to-transparent">
        <div style={{ transform: `translate(${settings.homeScoreX || 0}px, ${settings.homeScoreY || 0}px)` }} className="overflow-visible">
          <DotMatrix value={homeTeam.score || 0} color="#facc15" size="xl" minDigits={1} style={{ transform: `scale(${(settings.scoreScale || 1.0) * 0.9})` }} onTouchEnd={(e) => { const diff = touchStartRef.current! - e.changedTouches[0].clientY; adjustScore('home', Math.abs(diff) > 30 ? (diff > 0 ? 1 : -1) : 0); }} onTouchStart={(e) => touchStartRef.current = e.targetTouches[0].clientY} />
        </div>
        
        <div className="flex items-center justify-center overflow-visible" style={{ transform: `translate(${settings.middleFrameX || 0}px, ${settings.middleFrameY || 0}px)` }}>
            {/* GAME STATUS (CENTRED QUARTER DIGIT) */}
            <div className={`flex flex-col items-center justify-center text-center opacity-90 mx-4 ${phase === GamePhase.END_GAME ? 'w-auto min-w-[12rem]' : 'w-32'}`}>
              <span className="font-ui text-white text-lg tracking-[0.4em] uppercase font-bold mb-2 w-full drop-shadow-md">QUARTER</span>
              <div className="flex items-center justify-center w-full">
                <span className={`font-ui text-green-400 leading-none select-none font-light text-center w-full drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] ${phase === GamePhase.END_GAME ? 'text-3xl lg:text-4xl font-bold tracking-wider' : 'text-6xl lg:text-[5rem]'}`}>{getPeriodDisplay()}</span>
              </div>
            </div>
        </div>

        <div style={{ transform: `translate(${settings.guestScoreX || 0}px, ${settings.guestScoreY || 0}px)` }} className="overflow-visible">
          <DotMatrix value={guestTeam.score || 0} color="#facc15" size="xl" minDigits={1} style={{ transform: `scale(${(settings.scoreScale || 1.0) * 0.9})` }} onTouchEnd={(e) => { const diff = touchStartRef.current! - e.changedTouches[0].clientY; adjustScore('guest', Math.abs(diff) > 30 ? (diff > 0 ? 1 : -1) : 0); }} onTouchStart={(e) => touchStartRef.current = e.targetTouches[0].clientY} />
        </div>
      </div>

      {/* SINGLE EXPANDABLE MENU BUTTON */}
      <div 
        style={{ 
          position: 'absolute', 
          left: `${settings.settingsIconX || 8}%`, 
          top: `${settings.settingsIconY || 92}%`, 
          transform: (settings.settingsIconX || 8) < 20 
            ? `translate(0%, -50%)` 
            : (settings.settingsIconX || 8) > 80 
              ? `translate(-100%, -50%)` 
              : `translate(-50%, -50%)`,
          width: 'max-content'
        }} 
        className="z-[60] flex items-center justify-center overflow-visible"
      >
        <div className={`flex items-center transition-all duration-500 ease-in-out shadow-2xl ${isMenuOpen ? 'bg-black/60 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 space-x-8' : 'w-14 h-14 bg-cyan-600/30 backdrop-blur-md rounded-full border border-cyan-500/30 justify-center hover:bg-cyan-600/50'}`}>
           {!isMenuOpen ? (
             <button 
                onClick={() => setIsMenuOpen(true)} 
                className="w-full h-full flex items-center justify-center text-cyan-400 transition-transform active:scale-90"
              >
               <MoreHorizontal size={28} />
             </button>
           ) : (
             <>
               <button onClick={() => { setModalOpen('settings'); setIsMenuOpen(false); }} className="text-gray-400 hover:text-cyan-400 transition-colors active:scale-90"><Settings2 size={24} /></button>
               <button onClick={() => { setModalOpen('history'); setIsMenuOpen(false); }} className="text-gray-400 hover:text-cyan-400 transition-colors active:scale-90"><BarChart2 size={24} /></button>
               <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-cyan-400 transition-colors active:scale-90">{isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
               <button onClick={toggleFullscreen} className="text-gray-400 hover:text-cyan-400 transition-colors active:scale-90">{isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}</button>
               <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
               <button onClick={() => setIsMenuOpen(false)} className="text-red-500 hover:text-red-400 transition-colors active:scale-90">
                 <CloseIcon size={24} />
               </button>
             </>
           )}
        </div>
      </div>

      {/* AUTO-SAVE NOTIFICATION */}
      {showSaveToast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-cyan-600/90 text-white px-6 py-3 rounded-full flex items-center space-x-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-[100] border border-cyan-400/50">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={18} />
            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Result Recorded</span>
          </div>
        </div>
      )}

      <TeamConfigModal isOpen={modalOpen === 'home'} onClose={() => setModalOpen(null)} team="home" currentConfig={homeTeam} onSave={(d) => setHomeTeam(p => ({ ...p, ...d }))} />
      <TeamConfigModal isOpen={modalOpen === 'guest'} onClose={() => setModalOpen(null)} team="guest" currentConfig={guestTeam} onSave={(d) => setGuestTeam(p => ({ ...p, ...d }))} />
      <SettingsModal isOpen={modalOpen === 'settings'} onClose={() => setModalOpen(null)} currentSettings={settings} profiles={profiles} isActivated={isActivated} activationDate={activationDate} licenseMs={LICENSE_MS} onOpenActivation={() => { setModalOpen(null); setShowActivationModal(true); }} onSave={(s) => setSettings(s)} onSaveProfile={(name) => setProfiles(prev => Array.isArray(prev) ? [...prev, { id: generateSafeId(), profileName: name, createdAt: Date.now(), settings, homeTeam, guestTeam }] : [{ id: generateSafeId(), profileName: name, createdAt: Date.now(), settings, homeTeam, guestTeam }])} onDeleteProfile={(id) => setProfiles(prev => Array.isArray(prev) ? prev.filter(p => p.id !== id) : [])} onLoadProfile={(p) => { setSettings(p.settings); setHomeTeam(p.homeTeam); setGuestTeam(p.guestTeam); }} />
      <StatsModal 
        isOpen={modalOpen === 'history'} 
        onClose={() => setModalOpen(null)} 
        history={Array.isArray(gameHistory) ? gameHistory : []} 
        onDelete={(id) => setGameHistory(prev => Array.isArray(prev) ? prev.filter(g => g.id !== id) : [])} 
        onClear={() => setGameHistory([])} 
        onSaveCurrent={handleSaveCurrentGame} 
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(newSettings)}
      />

      {modalOpen === 'reset' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95">
          <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-8 text-center space-y-6 max-w-xs w-full">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold uppercase tracking-tighter">Reset Game?</h3>
            <button onClick={() => { setIsRunning(false); setPhase(GamePhase.PRE_GAME); setTimeLeft((settings.quarterLength || 15) * 60); setHomeTeam(prev => ({ ...prev, score: 0 })); setGuestTeam(prev => ({ ...prev, score: 0 })); setModalOpen(null); }} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl uppercase shadow-lg">Confirm Reset</button>
            <button onClick={() => setModalOpen(null)} className="w-full py-3 bg-gray-800 text-gray-300 font-bold rounded-xl">Go Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
