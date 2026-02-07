
import React, { useState } from 'react';
import { Lock, Smartphone, Phone, Mail, User, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface ActivationScreenProps {
  deviceId: string;
  onActivate: (key: string) => boolean;
  onClose?: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ deviceId, onActivate, onClose }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFormatKey = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits;
    setKey(formatted);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onActivate(key);
    if (result) {
      setSuccess(true);
      if (!onClose) {
        window.location.reload(); 
      }
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4 font-ui overflow-y-auto">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 relative my-auto">
        
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>
        )}

        {/* Header */}
        <div className="bg-gradient-to-b from-red-900/50 to-transparent p-8 text-center border-b border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter mb-2">
            {onClose ? 'Activate Application' : 'License Required'}
          </h2>
          <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">
            4-Month Subscription Activation
          </p>
        </div>

        {/* Info Area */}
        <div className="p-6 space-y-6">
          <div className="bg-black/50 border border-gray-800 rounded-xl p-4 space-y-4">
            <h3 className="text-[10px] text-cyan-400 uppercase font-bold tracking-[0.2em] border-b border-gray-800 pb-2">
              Registration Info
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-cyan-400 transition-colors">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Authorized Distributor</p>
                  <p className="text-sm font-bold text-gray-200">Francois Spies</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-cyan-400 transition-colors">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">WhatsApp / Cell</p>
                  <a href="tel:0824110824" className="text-sm font-bold text-cyan-400">0824110824</a>
                </div>
              </div>

              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-cyan-400 transition-colors">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Email Support</p>
                  <a href="mailto:francoisspies25@gmail.com" className="text-sm font-bold text-cyan-400 truncate">francoisspies25@gmail.com</a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest">Device Identifier</span>
                <Smartphone size={14} className="text-cyan-400 opacity-50" />
             </div>
             <div className="bg-black border border-cyan-500/30 rounded py-2 px-3 text-center">
                <span className="font-mono text-lg font-bold text-cyan-400 tracking-widest">{deviceId}</span>
             </div>
             <p className="text-[9px] text-gray-500 mt-2 text-center uppercase font-bold">
               Send this ID to receive your 4-month activation key
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest ml-1">
                16-Digit Activation Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => handleFormatKey(e.target.value)}
                placeholder="0000 0000 0000 0000"
                className={`w-full bg-black border ${error ? 'border-red-500 shadow-lg shadow-red-900/20' : 'border-gray-700 focus:border-cyan-500'} rounded-xl px-4 py-4 text-center text-xl font-mono text-white tracking-[0.2em] outline-none transition-all`}
              />
              {error && (
                <div className="flex items-center justify-center space-x-1 text-red-500 animate-bounce mt-2">
                  <ShieldAlert size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Invalid Key. Please try again.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={key.replace(/\s/g, '').length !== 16 || success}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 uppercase tracking-widest text-sm"
            >
              {success ? <CheckCircle2 size={18} /> : <Lock size={18} />}
              <span>{success ? 'ACTIVATED' : 'ACTIVATE APP'}</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 text-center border-t border-gray-800">
           <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">
             Netball Pro Scoreboard v1.0.4 - Premium Edition
           </p>
        </div>
      </div>
    </div>
  );
};
