
import React, { useState } from 'react';
import { User, UserPreferences } from '../types';
import { Trash2, LogOut, Target, Sliders, ShieldAlert, Moon, Link, Check, Database, Key, Activity, FileCode, Copy, Timer, ExternalLink, HelpCircle, Loader2, AlertCircle, User as UserIcon, Languages, Save } from 'lucide-react';
import { getSupabaseConfig, testSupabaseConnection, initSupabase } from '../services/supabaseClient';

interface SettingsProps {
    user: User;
    onWipe: () => void;
    onUpdateScore: (score: number) => void;
    onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
    onUpdateCallsign: (name: string) => void;
    onLogout: () => void;
}

const SUPABASE_SCHEMA_SQL = `
-- 1. Tables
-- Primary Key (id) is now the standardized lower-case callsign.
create table if not exists users (
  id text primary key,
  name text not null,
  target_score int default 36,
  preferences jsonb default '{}'::jsonb,
  vocab_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists history (
  id text primary key,
  user_id text references users(id) on delete cascade,
  timestamp bigint not null,
  data jsonb not null,
  created_at timestamp with time zone default now()
);

-- 2. Performance Indexes
create index if not exists idx_history_user_id on history(user_id);
create index if not exists idx_history_timestamp on history(timestamp desc);

-- 3. Security (RLS)
alter table users enable row level security;
alter table history enable row level security;

-- 4. Policies (Public Access for prototype, restrict in prod)
drop policy if exists "Public Access" on users;
create policy "Public Access" on users for all using (true) with check (true);

drop policy if exists "Public History" on history;
create policy "Public History" on history for all using (true) with check (true);
`;

export const Settings: React.FC<SettingsProps> = ({ user, onWipe, onUpdateScore, onUpdatePreferences, onUpdateCallsign, onLogout }) => {
    const scores = [32, 33, 34, 35, 36];

    const initialSupabase = getSupabaseConfig();
    const [sbUrl, setSbUrl] = useState(initialSupabase.url);
    const [sbKey, setSbKey] = useState(initialSupabase.key);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [showSql, setShowSql] = useState(false);

    const [editingCallsign, setEditingCallsign] = useState(user.name);

    const toggleHighContrast = () => onUpdatePreferences({ highContrast: !user.preferences.highContrast });
    const toggleTimer = () => onUpdatePreferences({ enableTimer: !user.preferences.enableTimer });
    const toggleAutoSave = () => onUpdatePreferences({ autoSave: !user.preferences.autoSave });
    const toggleKoreanExplanations = () => onUpdatePreferences({ showKoreanExplanations: !user.preferences.showKoreanExplanations });

    const saveSupabaseConfig = async () => {
        setTestStatus('loading');
        setTestMessage('');
        const result = await testSupabaseConnection(sbUrl, sbKey);
        if (result.success) {
            localStorage.setItem('act_sb_url', sbUrl.trim());
            localStorage.setItem('act_sb_key', sbKey.trim());
            initSupabase(sbUrl.trim(), sbKey.trim());
            setTestStatus('success');
            setTestMessage("Configuration Secured and Synced.");
            setTimeout(() => setTestStatus('idle'), 3000);
        } else {
            setTestStatus('error');
            setTestMessage(result.message);
        }
    };

    const copyIdToClipboard = () => {
        navigator.clipboard.writeText(user.id);
        alert("Operative ID copied to clipboard!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">

            {/* Profile Control */}
            <section className="glass rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                    <Sliders size={18} className="text-act-accent" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Operative Profile</h3>
                </div>
                <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <UserIcon size={12} /> Active Callsign
                            </label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    type="text"
                                    value={user.name}
                                    className="flex-1 glass border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white opacity-60 outline-none"
                                />
                            </div>
                            <p className="text-[8px] font-mono text-gray-600 uppercase">Callsign changes require a session reset for data integrity.</p>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Key size={12} /> Neural Key (ID)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    type="text"
                                    value={user.id}
                                    className="flex-1 bg-white/5 border-white/5 rounded-xl px-4 py-3 text-[10px] font-mono text-gray-500 outline-none cursor-default"
                                />
                                <button onClick={copyIdToClipboard} className="p-3 glass rounded-xl text-gray-500 hover:text-white transition-colors">
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-bold text-white uppercase flex items-center gap-2"><Target size={16} className="text-act-accent" /> Strategic Objective</p>
                        <div className="grid grid-cols-5 gap-3">
                            {scores.map(s => (
                                <button key={s} onClick={() => onUpdateScore(s)} className={`py-4 rounded-xl font-mono text-sm font-bold border-2 transition-all ${user.targetScore === s ? 'bg-act-accent text-white border-act-accent shadow-lg shadow-act-accent/20' : 'bg-white/[0.02] border-white/5 text-gray-600 hover:border-white/20'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
                        <div className="text-center md:text-left order-2 md:order-1">
                            <p className="text-xs font-bold text-white uppercase">System Access</p>
                            <p className="text-[9px] font-mono text-gray-600 uppercase mt-1">Agent Profile Linked: {user.name}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full md:w-auto order-1 md:order-2 flex items-center justify-center gap-3 px-10 py-5 bg-act-red/10 hover:bg-act-red/20 border border-act-red/20 hover:border-act-red/40 rounded-2xl text-act-red hover:text-white text-xs font-mono font-bold uppercase transition-all group shadow-lg shadow-act-red/5"
                        >
                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Sign Out & Reset Session
                        </button>
                    </div>
                </div>
            </section>

            {/* Preferences & Display */}
            <section className="glass rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                    <Sliders size={18} className="text-act-accent" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Training Preferences</h3>
                </div>
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5 hover:border-act-accent/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 glass rounded-xl text-purple-400 group-hover:text-purple-300 transition-colors">
                                <Languages size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">한글 설명 표시</p>
                                <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">Show Korean Explanations</p>
                            </div>
                        </div>
                        <button onClick={toggleKoreanExplanations} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${user.preferences.showKoreanExplanations ? 'bg-act-accent' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${user.preferences.showKoreanExplanations ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5 hover:border-act-accent/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 glass rounded-xl text-act-accent group-hover:text-blue-300 transition-colors">
                                <Timer size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Combat Timer</p>
                                <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">Enable Countdown Timer</p>
                            </div>
                        </div>
                        <button onClick={toggleTimer} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${user.preferences.enableTimer ? 'bg-act-accent' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${user.preferences.enableTimer ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5 hover:border-act-accent/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 glass rounded-xl text-yellow-400 group-hover:text-yellow-300 transition-colors">
                                <Moon size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">High Contrast Mode</p>
                                <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">Enhanced Visual Clarity</p>
                            </div>
                        </div>
                        <button onClick={toggleHighContrast} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${user.preferences.highContrast ? 'bg-act-accent' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${user.preferences.highContrast ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5 hover:border-act-accent/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 glass rounded-xl text-act-green group-hover:text-green-300 transition-colors">
                                <Save size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Auto-Save Progress</p>
                                <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">Automatic Cloud Sync</p>
                            </div>
                        </div>
                        <button onClick={toggleAutoSave} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${user.preferences.autoSave ? 'bg-act-accent' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${user.preferences.autoSave ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Database Connection */}
            <section className={`glass rounded-3xl overflow-hidden transition-colors border-2 ${testStatus === 'success' ? 'border-act-green/30' :
                testStatus === 'error' ? 'border-act-red/30' :
                    'border-act-green/10'
                }`}>
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database size={18} className={testStatus === 'success' ? 'text-act-green' : 'text-act-accent'} />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Supabase Integration</h3>
                    </div>
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[9px] font-mono text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                        Open Dashboard <ExternalLink size={10} />
                    </a>
                </div>
                <div className="p-8 space-y-8">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                        <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <HelpCircle size={14} /> Cloud Uplink Setup
                        </h4>
                        <ol className="text-[11px] space-y-3 text-gray-400 list-decimal pl-4 font-sans leading-relaxed">
                            <li>Go to your Supabase Project <span className="text-white font-mono">Settings</span> &rarr; <span className="text-white font-mono">API</span>.</li>
                            <li>Copy <span className="text-act-green font-bold">Project URL</span> and paste it below.</li>
                            <li>Copy <span className="text-act-green font-bold">anon public</span> key and paste it below.</li>
                            <li>Click <span className="text-white font-mono uppercase">View SQL</span> 아래 코드를 복사해서 <span className="text-white font-mono">SQL Editor</span>에 실행하세요.</li>
                        </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2"><Link size={12} /> Project URL</label>
                            <input
                                type="text"
                                value={sbUrl}
                                onChange={(e) => { setSbUrl(e.target.value); setTestStatus('idle'); }}
                                placeholder="https://your-id.supabase.co"
                                className="w-full glass border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:border-act-accent outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2"><Key size={12} /> Anon Key (Public)</label>
                            <input
                                type="password"
                                value={sbKey}
                                onChange={(e) => { setSbKey(e.target.value); setTestStatus('idle'); }}
                                placeholder="eyJhbGciOiJIUzI1Ni..."
                                className="w-full glass border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:border-act-accent outline-none"
                            />
                        </div>
                    </div>

                    {testStatus !== 'idle' && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-1 ${testStatus === 'success' ? 'bg-act-green/10 border-act-green/20 text-act-green' :
                            testStatus === 'error' ? 'bg-act-red/10 border-act-red/20 text-act-red' :
                                'bg-white/5 border-white/10 text-gray-400'
                            }`}>
                            {testStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> :
                                testStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                            <span className="text-[11px] font-mono font-bold uppercase">{testMessage || 'Testing Connection...'}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4">
                        <button onClick={() => setShowSql(!showSql)} className="px-4 py-3 rounded-xl font-mono text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 uppercase transition-all">
                            <FileCode size={14} className="inline mr-2" /> {showSql ? 'Hide SQL Schema' : 'View SQL Schema'}
                        </button>
                        <button
                            onClick={saveSupabaseConfig}
                            disabled={testStatus === 'loading' || !sbUrl || !sbKey}
                            className={`px-8 py-3 rounded-xl font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-2 disabled:opacity-50 ${testStatus === 'success' ? 'bg-act-green text-black' :
                                testStatus === 'error' ? 'bg-act-red text-white shadow-lg shadow-act-red/20' :
                                    'bg-act-accent text-white hover:bg-blue-600'
                                }`}
                        >
                            {testStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> :
                                testStatus === 'success' ? <Check size={14} /> : null}
                            {testStatus === 'success' ? 'Verified & Saved' : testStatus === 'error' ? 'Retry Connection' : 'Test & Save Link'}
                        </button>
                    </div>

                    {showSql && (
                        <div className="animate-in slide-in-from-top-4">
                            <div className="bg-black/40 border border-act-accent/20 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                    <span className="text-[9px] font-mono text-act-accent uppercase font-bold">SQL Editor Command</span>
                                    <button onClick={() => { navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL); alert("SQL Copied!"); }} className="text-[9px] text-gray-400 hover:text-white uppercase font-bold flex items-center gap-1">
                                        <Copy size={10} /> Copy SQL
                                    </button>
                                </div>
                                <pre className="text-[9px] font-mono text-gray-500 whitespace-pre-wrap leading-relaxed select-all max-h-48 overflow-y-auto">{SUPABASE_SCHEMA_SQL}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
