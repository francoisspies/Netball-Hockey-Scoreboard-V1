
import React, { useState, useEffect } from 'react';
import { X, Volume2, Shield, Activity, Maximize, Move, Image as LucideImage, Settings2, Save, Trash2, Plus, Minus, RefreshCw, Star, Lock, ShieldCheck } from 'lucide-react';
import { GameSettings, SettingsProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  profiles: SettingsProfile[];
  isActivated: boolean;
  activationDate: number | null;
  licenseMs: number;
  onOpenActivation: () => void;
  onSave: (settings: GameSettings) => void;
  onSaveProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  onLoadProfile: (profile: SettingsProfile) => void;
}

interface NumericSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  isScale?: boolean;
  onChange: (val: number) => void;
}

const NumericSlider: React.FC<NumericSliderProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  unit = '', 
  isScale = false,
  onChange 
}) => {
  const safeValue = value ?? 0;
  const displayValue = isScale ? `${(safeValue * 100).toFixed(0)}%` : `${safeValue}${unit}`;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] text-gray-400 uppercase font-bold">{label}</label>
        <span className="text-[10px] font-mono text-cyan-400">{displayValue}</span>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onChange(Number((Math.max(min, safeValue - step)).toFixed(2)))}
          className="p-2 bg-black hover:bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 transition-colors active:scale-95"
          title="Decrease"
        >
          <Minus size={14} />
        </button>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={safeValue} 
          onChange={(e) => onChange(parseFloat(e.target.value))} 
          className="flex-1 accent-cyan-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" 
        />
        <button 
          onClick={() => onChange(Number((Math.min(max, safeValue + step)).toFixed(2)))}
          className="p-2 bg-black hover:bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-cyan-400 transition-colors active:scale-95"
          title="Increase"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  profiles,
  isActivated,
  activationDate,
  licenseMs,
  onOpenActivation,
  onSave,
  onSaveProfile,
  onDeleteProfile,
  onLoadProfile,
}) => {
  const [settings, setSettings] = useState<GameSettings>(currentSettings);
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSave(settings);
    onClose();
  };

  const handleAddProfile = () => {
    if (newProfileName.trim()) {
      onSaveProfile(newProfileName.trim());
      setNewProfileName('');
    }
  };

  const getLicenseRemaining = () => {
    if (!isActivated || !activationDate) return null;
    const remainingMs = Math.max(0, licenseMs - (Date.now() - activationDate));
    const d = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${d}d ${h}h`;
  };

  const remainingTime = getLicenseRemaining();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-xl font-ui font-bold text-white flex items-center space-x-2 uppercase tracking-tighter">
            <Settings2 size={20} className="text-cyan-400" />
            <span>Dashboard & Presets</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* LICENSE INFO */}
          <div className="space-y-4">
             <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1 flex items-center space-x-2">
              <ShieldCheck size={16} />
              <span>Application License</span>
            </h4>
            <div className={`p-4 rounded-lg border flex items-center justify-between ${isActivated ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
               <div className="flex flex-col">
                  <span className={`text-xs font-bold uppercase tracking-widest ${isActivated ? 'text-green-500' : 'text-red-500'}`}>
                    {isActivated ? 'Full License Activated' : 'Trial Version'}
                  </span>
                  {isActivated && remainingTime && (
                    <span className="text-[10px] text-cyan-400 font-black uppercase mt-1 tracking-tighter">
                      Expires in: {remainingTime}
                    </span>
                  )}
                  <span className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Premium Edition v1.0.4</span>
               </div>
               {!isActivated && (
                 <button 
                  onClick={onOpenActivation}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[10px] uppercase tracking-widest flex items-center"
                 >
                   <Lock size={12} className="mr-1" />
                   Activate
                 </button>
               )}
            </div>
          </div>

          {/* PRESETS & PROFILES */}
          <div className="space-y-4">
            <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1 flex items-center space-x-2">
              <Star size={16} />
              <span>Presets & Saved Profiles</span>
            </h4>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Profile Name (e.g. Training)"
                  className="flex-1 bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm font-ui focus:border-cyan-500 focus:outline-none"
                />
                <button 
                  onClick={handleAddProfile}
                  disabled={!newProfileName.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-white px-3 py-2 rounded transition-all flex items-center space-x-1"
                >
                  <Plus size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Save</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {profiles.length === 0 ? (
                  <div className="text-center py-4 text-gray-600 text-[10px] uppercase font-bold tracking-widest border border-dashed border-gray-800 rounded">
                    No Saved Profiles Yet
                  </div>
                ) : (
                  profiles.map(p => (
                    <div key={p.id} className="bg-black/40 border border-gray-800 rounded-lg p-3 flex items-center justify-between group hover:border-cyan-900/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-200">{p.profileName}</span>
                        <span className="text-[9px] text-gray-600 uppercase font-mono">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => onLoadProfile(p)}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-md transition-all flex items-center space-x-1 border border-cyan-400/20"
                        >
                          <RefreshCw size={14} />
                          <span className="text-[9px] font-bold uppercase">Recall</span>
                        </button>
                        <button 
                          onClick={() => onDeleteProfile(p.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* DURATIONS */}
          <div className="space-y-4">
            <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1">Durations (Minutes)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Quarter</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.quarterLength}
                  onChange={(e) => setSettings(s => ({ ...s, quarterLength: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-center font-ui focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Break</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.breakLength}
                  onChange={(e) => setSettings(s => ({ ...s, breakLength: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-center font-ui focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Halftime</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.halftimeLength}
                  onChange={(e) => setSettings(s => ({ ...s, halftimeLength: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-center font-ui focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SIZING & SCALING */}
          <div className="space-y-4">
            <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1 flex items-center space-x-2">
              <Maximize size={16} />
              <span>Sizing & Scaling</span>
            </h4>
            <div className="space-y-6">
              <NumericSlider 
                label="Game Timer Scale"
                value={settings.timerScale}
                min={0.5}
                max={2.0}
                step={0.05}
                isScale={true}
                onChange={(val) => setSettings(s => ({ ...s, timerScale: val }))}
              />
              <NumericSlider 
                label="Logo Box Scale"
                value={settings.logoSizeScale}
                min={0.5}
                max={2.0}
                step={0.05}
                isScale={true}
                onChange={(val) => setSettings(s => ({ ...s, logoSizeScale: val }))}
              />
              <NumericSlider 
                label="Team Score Scale"
                value={settings.scoreScale}
                min={0.5}
                max={2.5}
                step={0.05}
                isScale={true}
                onChange={(val) => setSettings(s => ({ ...s, scoreScale: val }))}
              />
            </div>
          </div>

          {/* DISPLAY POSITIONING */}
          <div className="space-y-4">
            <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1 flex items-center space-x-2">
              <Move size={16} />
              <span>Main Element Translation (px)</span>
            </h4>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <NumericSlider 
                  label="Game Timer (X)"
                  value={settings.timerX}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, timerX: val }))}
                />
                <NumericSlider 
                  label="Game Timer (Y)"
                  value={settings.timerY}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, timerY: val }))}
                />
                <div className="border-t border-gray-800 my-2"></div>
                <NumericSlider 
                  label="Home Score (X)"
                  value={settings.homeScoreX}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, homeScoreX: val }))}
                />
                <NumericSlider 
                  label="Home Score (Y)"
                  value={settings.homeScoreY}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, homeScoreY: val }))}
                />
                <div className="border-t border-gray-800 my-2"></div>
                <NumericSlider 
                  label="Guest Score (X)"
                  value={settings.guestScoreX}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, guestScoreX: val }))}
                />
                <NumericSlider 
                  label="Guest Score (Y)"
                  value={settings.guestScoreY}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, guestScoreY: val }))}
                />
                <div className="border-t border-gray-800 my-2"></div>
                <NumericSlider 
                  label="Middle Box (X)"
                  value={settings.middleFrameX}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, middleFrameX: val }))}
                />
                <NumericSlider 
                  label="Middle Box (Y)"
                  value={settings.middleFrameY}
                  min={-150}
                  max={150}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, middleFrameY: val }))}
                />
              </div>
            </div>
          </div>

          {/* ICON POSITIONS */}
          <div className="space-y-4">
            <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1 flex items-center space-x-2">
              <Settings2 size={16} />
              <span>Control Icon Coordinates (%)</span>
            </h4>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <NumericSlider 
                  label="Settings Button (X)"
                  value={settings.settingsIconX}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(val) => setSettings(s => ({ ...s, settingsIconX: val }))}
                />
                <NumericSlider 
                  label="Settings Button (Y)"
                  value={settings.settingsIconY}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(val) => setSettings(s => ({ ...s, settingsIconY: val }))}
                />
                <div className="border-t border-gray-800 my-2"></div>
                <NumericSlider 
                  label="Speaker Button (X)"
                  value={settings.speakerIconX}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(val) => setSettings(s => ({ ...s, speakerIconX: val }))}
                />
                <NumericSlider 
                  label="Speaker Button (Y)"
                  value={settings.speakerIconY}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(val) => setSettings(s => ({ ...s, speakerIconY: val }))}
                />
              </div>
            </div>
          </div>

          {/* TEAM HEADER POSITIONING */}
          <div className="space-y-4">
            <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1 flex items-center space-x-2">
              <LucideImage size={16} />
              <span>Logo Box Translation (px)</span>
            </h4>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <NumericSlider 
                  label="Home Logo (X)"
                  value={settings.homeLogoX}
                  min={-100}
                  max={100}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, homeLogoX: val }))}
                />
                <NumericSlider 
                  label="Home Logo (Y)"
                  value={settings.homeLogoY}
                  min={-100}
                  max={100}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, homeLogoY: val }))}
                />
                <div className="border-t border-gray-800 my-2"></div>
                <NumericSlider 
                  label="Guest Logo (X)"
                  value={settings.guestLogoX}
                  min={-100}
                  max={100}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, guestLogoX: val }))}
                />
                <NumericSlider 
                  label="Guest Logo (Y)"
                  value={settings.guestLogoY}
                  min={-100}
                  max={100}
                  unit="px"
                  onChange={(val) => setSettings(s => ({ ...s, guestLogoY: val }))}
                />
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, timerX: 0, timerY: 0, homeScoreX: 0, homeScoreY: 0, guestScoreX: 0, guestScoreY: 0, middleFrameX: 0, middleFrameY: 0, homeLogoX: 0, homeLogoY: 0, guestLogoX: 0, guestLogoY: 0, settingsIconX: 8, settingsIconY: 92, speakerIconX: 94, speakerIconY: 92, timerScale: 1.0, logoSizeScale: 1.0, scoreScale: 1.0 }))}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-cyan-400 transition-colors pt-2"
              >
                Reset All Positions & Sizes
              </button>
            </div>
          </div>

          {/* AUDIO SETTINGS */}
          <div className="space-y-4">
            <h4 className="text-cyan-400 font-ui text-sm uppercase tracking-wider font-bold border-b border-gray-800 pb-1 flex items-center space-x-2">
              <Volume2 size={16} />
              <span>Buzzer Audio Type</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <label className={`cursor-pointer border rounded-lg p-2 flex items-center justify-center space-x-2 transition-colors ${settings.soundType === 'whistle-netball' ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                <input type="radio" name="sound" className="hidden" checked={settings.soundType === 'whistle-netball'} onChange={() => setSettings(s => ({ ...s, soundType: 'whistle-netball' }))} />
                <Shield size={14} className={settings.soundType === 'whistle-netball' ? 'text-cyan-400' : 'text-gray-500'} />
                <span className="font-bold text-sm">Netball</span>
              </label>
              <label className={`cursor-pointer border rounded-lg p-2 flex items-center justify-center space-x-2 transition-colors ${settings.soundType === 'whistle-hockey' ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                <input type="radio" name="sound" className="hidden" checked={settings.soundType === 'whistle-hockey'} onChange={() => setSettings(s => ({ ...s, soundType: 'whistle-hockey' }))} />
                <Activity size={14} className={settings.soundType === 'whistle-hockey' ? 'text-cyan-400' : 'text-gray-500'} />
                <span className="font-bold text-sm">Hockey</span>
              </label>
              <label className={`cursor-pointer border rounded-lg p-2 flex items-center justify-center space-x-2 transition-colors ${settings.soundType === 'whistle-short' ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                <input type="radio" name="sound" className="hidden" checked={settings.soundType === 'whistle-short'} onChange={() => setSettings(s => ({ ...s, soundType: 'whistle-short' }))} />
                <span className="font-bold text-sm">Short</span>
              </label>
              <label className={`cursor-pointer border rounded-lg p-2 flex items-center justify-center space-x-2 transition-colors ${settings.soundType === 'buzzer' ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                <input type="radio" name="sound" className="hidden" checked={settings.soundType === 'buzzer'} onChange={() => setSettings(s => ({ ...s, soundType: 'buzzer' }))} />
                <span className="font-bold text-sm">Buzzer</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end bg-gray-900 flex-shrink-0">
          <button onClick={handleApply} className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded font-ui font-bold transition-all shadow-lg active:scale-95 uppercase tracking-widest text-sm w-full md:w-auto">
            <Save size={18} />
            <span>Apply & Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
