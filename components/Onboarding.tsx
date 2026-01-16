
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Crosshair, ArrowRight, Loader2, Terminal, Search, Database, UserPlus, Fingerprint, Info } from 'lucide-react';
import { getUserByCallsign } from '../services/supabaseClient';

interface OnboardingProps {
  onComplete: (user: User) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'new'>('idle');
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const handleIdentityCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setStatus('searching');
    
    try {
        // Search by name directly in the database
        const user = await getUserByCallsign(name.trim());
        if (user) {
            setExistingUser(user);
            setStatus('found');
        } else {
            setStatus('new');
        }
    } catch (error) {
        console.warn("Database lookup failed, creating transient profile.");
        setStatus('new');
    }
  };

  const handleFinalize = () => {
    if (status === 'found' && existingUser) {
        onComplete(existingUser);
    } else {
        // Create a new user where ID is the standardized name to ensure future uniqueness
        const cleanId = name.trim().toLowerCase();
        const newUser: User = {
            id: cleanId,
            name: name.trim(), // Original casing for display
            targetScore: 36,
            preferences: { highContrast: false, autoSave: true, enableTimer: true }
        };
        onComplete(newUser);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-act-black flex items-center justify-center p-6">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2e7dff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      
      <div className="max-w-md w-full glass p-10 rounded-[3rem] border-act-accent/20 relative overflow-hidden animate-in zoom-in-95 duration-700">
        <div className="absolute -top-24 -left-24 h-48 w-48 bg-act-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-act-red/10 rounded-full blur-3xl"></div>

        <div className="relative space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-20 w-20 bg-act-accent/10 border border-act-accent/20 rounded-3xl flex items-center justify-center text-act-accent mb-2">
                    {status === 'searching' ? <Loader2 size={40} className="animate-spin" /> : <Fingerprint size={40} className="animate-pulse" />}
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Neural Uplink</h1>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">
                    {status === 'searching' ? 'Scanning Tactical Registry...' : 'Operational Identity Verification'}
                </p>
            </div>

            {status === 'idle' || status === 'searching' ? (
                <form onSubmit={handleIdentityCheck} className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Callsign Entry</label>
                            <div className="group relative">
                                <Info size={12} className="text-gray-600 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-3 glass rounded-xl text-[9px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 uppercase tracking-wider leading-relaxed">
                                    Your callsign is your unique identity. Re-entering it restores your history.
                                </div>
                            </div>
                        </div>
                        <input 
                            autoFocus
                            type="text" 
                            disabled={status === 'searching'}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Identify yourself..."
                            className="w-full glass border-white/10 rounded-2xl px-6 py-5 text-lg font-mono text-white focus:border-act-accent outline-none transition-all placeholder:text-gray-700 disabled:opacity-50"
                        />
                    </div>

                    <button 
                        disabled={!name.trim() || status === 'searching'}
                        className="w-full bg-white text-act-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-act-accent hover:text-white transition-all disabled:opacity-20 uppercase font-mono tracking-widest text-xs group"
                    >
                        {status === 'searching' ? 'Checking Database...' : 'Access Neural Link'}
                    </button>
                </form>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className={`p-6 rounded-2xl border flex items-center gap-4 ${status === 'found' ? 'bg-act-green/10 border-act-green/20' : 'bg-act-accent/10 border-act-accent/20'}`}>
                        {status === 'found' ? <ShieldCheck className="text-act-green" size={24} /> : <UserPlus className="text-act-accent" size={24} />}
                        <div>
                            <p className="text-xs font-bold text-white uppercase">{status === 'found' ? 'Identity Verified' : 'New Operative'}</p>
                            <p className="text-[10px] font-mono text-gray-400 uppercase">{status === 'found' ? 'Intel Restoration Ready' : 'Initializing Fresh Data Node'}</p>
                        </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Authenticated Callsign</span>
                        <span className="text-xl font-black text-white uppercase font-mono">{name}</span>
                    </div>

                    <button 
                        onClick={handleFinalize}
                        className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase font-mono tracking-widest text-xs ${
                            status === 'found' ? 'bg-act-green text-black hover:bg-green-400' : 'bg-act-accent text-white hover:bg-blue-600'
                        }`}
                    >
                        {status === 'found' ? 'Restore Session' : 'Begin Deployment'} <ArrowRight size={18} />
                    </button>

                    <button onClick={() => setStatus('idle')} className="w-full text-[10px] font-mono text-gray-600 hover:text-white uppercase tracking-widest transition-colors">
                        Wrong Callsign? Re-scan
                    </button>
                </div>
            )}

            <div className="pt-4 text-center">
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Database size={12} /> Unique Identity Protocol Active
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};
