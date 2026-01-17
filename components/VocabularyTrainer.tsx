
import React, { useState, useEffect, useMemo } from 'react';
import { Book, Zap, BrainCircuit, Loader2, CheckCircle2, XCircle, ChevronRight, Target, Flame, Sparkles, AlertCircle, TrendingUp, BarChart3, Clock, Trophy, RefreshCcw, Layout, Calendar, Eye, EyeOff, Search, Filter, Crosshair } from 'lucide-react';
import { generateVocabDrill } from '../services/geminiService';
import { DrillProblem, VocabStats, User, VocabData } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { ACT_ELITE_VOCAB } from '../data/vocabList';
import { StudyPlanSelector } from './StudyPlanSelector';
import { StudyPlanDashboard } from './StudyPlanDashboard';
import { QuickReviewMode } from './QuickReviewMode';
import { StudyPlan, getDailyMixForPlan } from '../services/studyPlanService';

const DAILY_GOAL = 10;

interface VocabularyTrainerProps {
    user?: User;
    onUpdateUser?: (updates: Partial<User>) => void;
}

export const VocabularyTrainer: React.FC<VocabularyTrainerProps> = ({ user, onUpdateUser }) => {
    const [mastered, setMastered] = useState<string[]>([]);
    const [dailyMission, setDailyMission] = useState<string[]>([]);
    const [stats, setStats] = useState<VocabStats>({ masteredCount: 0, streak: 0, lastPracticeDate: '', avgLatency: 0, accuracyRate: 0 });
    const [dailyProgress, setDailyProgress] = useState<number>(0);
    const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
    const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);

    const [view, setView] = useState<'lexicon' | 'drill' | 'report' | 'quick-review' | 'plan-setup'>('lexicon');
    const [filterMode, setFilterMode] = useState<'daily' | 'all' | 'targets' | 'mastered'>('daily');
    const [searchTerm, setSearchTerm] = useState('');
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(user?.studyPlan || null);
    const [showPlanSelector, setShowPlanSelector] = useState(!user?.studyPlan);

    const [currentWord, setCurrentWord] = useState<string | null>(null);
    const [drill, setDrill] = useState<DrillProblem | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [peekWord, setPeekWord] = useState(false);

    // --- Initialization Logic (Priority: User Cloud Data > LocalStorage) ---
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];

        // 1. Determine Source of Truth
        let vocabData: VocabData | null = null;

        if (user?.vocabData) {
            vocabData = user.vocabData;
        } else {
            // Fallback to local storage if cloud data is empty
            const savedMastered = JSON.parse(localStorage.getItem('act_mastered_vocab') || '[]');
            const savedStats = JSON.parse(localStorage.getItem('act_vocab_stats') || '{}');
            const savedDailyWords = JSON.parse(localStorage.getItem('act_daily_mission_words') || '[]');
            const savedDailyDate = localStorage.getItem('act_last_date') || '';
            const savedDailyProgress = parseInt(localStorage.getItem('act_daily_progress') || '0');
            const savedLatency = JSON.parse(localStorage.getItem('act_latency_history') || '[]');
            const savedAccuracy = JSON.parse(localStorage.getItem('act_accuracy_history') || '[]');

            if (savedStats.masteredCount !== undefined) {
                vocabData = {
                    mastered: savedMastered,
                    stats: savedStats,
                    dailyMission: {
                        date: savedDailyDate,
                        words: savedDailyWords,
                        progress: savedDailyProgress
                    },
                    latencyHistory: savedLatency,
                    accuracyHistory: savedAccuracy
                };
            }
        }

        // 2. Hydrate State
        if (vocabData) {
            setMastered(vocabData.mastered || []);
            setLatencyHistory(vocabData.latencyHistory || []);
            setAccuracyHistory(vocabData.accuracyHistory || []);
            if (vocabData.stats) setStats(vocabData.stats);

            // 3. Check Daily Mission Freshness
            if (vocabData.dailyMission?.date !== today || !vocabData.dailyMission?.words?.length) {
                generateNewDailyMission(vocabData.mastered || []);
            } else {
                setDailyMission(vocabData.dailyMission.words);
                setDailyProgress(vocabData.dailyMission.progress);
            }
        } else {
            // No data at all? Init fresh.
            generateNewDailyMission([]);
        }
    }, [user?.vocabData]); // Only re-run if cloud data explicitly updates/loads

    const generateNewDailyMission = (currentMastered: string[]) => {
        const today = new Date().toISOString().split('T')[0];
        const dailyGoal = studyPlan?.daily_goal || DAILY_GOAL; // Use study plan goal or fallback to 10
        const unmastered = ACT_ELITE_VOCAB.filter(w => !currentMastered.includes(w));
        const candidates = unmastered.length < dailyGoal ? ACT_ELITE_VOCAB : unmastered;

        const newMission = candidates
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
            .slice(0, dailyGoal); // Use dynamic daily goal

        setDailyMission(newMission);
        setDailyProgress(0);

        // Persist immediately
        saveAllData(currentMastered, stats, newMission, 0, latencyHistory, accuracyHistory, today);
    };

    const saveAllData = (
        newMastered: string[],
        newStats: VocabStats,
        missionWords: string[],
        missionProgress: number,
        latHistory: number[],
        accHistory: number[],
        dateOverride?: string
    ) => {
        const today = dateOverride || new Date().toISOString().split('T')[0];

        // 1. Update Local State
        setMastered(newMastered);
        setStats(newStats);
        setDailyMission(missionWords);
        setDailyProgress(missionProgress);
        setLatencyHistory(latHistory);
        setAccuracyHistory(accHistory);

        // 2. Update Local Storage (Backup)
        localStorage.setItem('act_mastered_vocab', JSON.stringify(newMastered));
        localStorage.setItem('act_vocab_stats', JSON.stringify(newStats));
        localStorage.setItem('act_daily_mission_words', JSON.stringify(missionWords));
        localStorage.setItem('act_daily_progress', missionProgress.toString());
        localStorage.setItem('act_last_date', today);
        localStorage.setItem('act_latency_history', JSON.stringify(latHistory));
        localStorage.setItem('act_accuracy_history', JSON.stringify(accHistory));

        // 3. Push to Cloud (Sync)
        if (onUpdateUser) {
            onUpdateUser({
                vocabData: {
                    mastered: newMastered,
                    stats: newStats,
                    dailyMission: {
                        date: today,
                        words: missionWords,
                        progress: missionProgress
                    },
                    latencyHistory: latHistory,
                    accuracyHistory: accHistory
                }
            });
        }
    };

    const updateStats = (isCorrect: boolean, latency: number) => {
        const today = new Date().toISOString().split('T')[0];
        const newMasteredCount = isCorrect ? mastered.length + 1 : mastered.length;
        const newDailyProgress = dailyProgress + 1;

        let newStreak = stats.streak;
        if (stats.lastPracticeDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (stats.lastPracticeDate === yesterdayStr) newStreak += 1;
            else if (stats.lastPracticeDate !== today) newStreak = 1;
        }

        const newLatencyHistory = [...latencyHistory, latency].slice(-20);
        const newAccuracyHistory = [...accuracyHistory, isCorrect ? 100 : 0].slice(-20);

        const newStats: VocabStats = {
            masteredCount: newMasteredCount,
            streak: newStreak,
            lastPracticeDate: today,
            avgLatency: Number((newLatencyHistory.reduce((a, b) => a + b, 0) / newLatencyHistory.length).toFixed(2)),
            accuracyRate: Math.round(((stats.accuracyRate * 19 + (isCorrect ? 100 : 0)) / 20))
        };

        saveAllData(mastered, newStats, dailyMission, newDailyProgress, newLatencyHistory, newAccuracyHistory);
    };

    const handleMaster = (word: string) => {
        const nextMastered = [...mastered, word];
        saveAllData(nextMastered, stats, dailyMission, dailyProgress, latencyHistory, accuracyHistory);
        setCurrentWord(null);
        setDrill(null);
        setView('lexicon');
    };

    const startDrill = async (word: string) => {
        setLoading(true);
        setCurrentWord(word);
        setRevealed(false);
        setSelectedOption(null);
        setPeekWord(false);
        setView('drill');
        try {
            const data = await generateVocabDrill(word);
            setDrill(data);
            setStartTime(Date.now());
        } catch (e) {
            alert("Neural link failed. Retry engagement.");
            setView('lexicon');
        } finally {
            setLoading(false);
        }
    };

    const handleReveal = () => {
        if (!selectedOption || !drill) return;
        const latency = (Date.now() - startTime) / 1000;
        const isCorrect = selectedOption === drill.correctAnswer;
        setRevealed(true);
        updateStats(isCorrect, latency);
    };

    // Filter Logic
    const filteredWords = useMemo(() => {
        let filtered = ACT_ELITE_VOCAB;
        if (searchTerm) {
            return filtered.filter(w => w.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        switch (filterMode) {
            case 'daily': return dailyMission;
            case 'targets': return filtered.filter(w => !mastered.includes(w));
            case 'mastered': return filtered.filter(w => mastered.includes(w));
            default: return filtered;
        }
    }, [searchTerm, filterMode, mastered, dailyMission]);

    const dailyMissionCompletedCount = dailyMission.filter(w => mastered.includes(w)).length;
    const reportData = useMemo(() => [
        { name: 'Accuracy', value: stats.accuracyRate, fill: '#00f294' },
        { name: 'Remaining', value: 100 - stats.accuracyRate, fill: 'rgba(255,255,255,0.05)' }
    ], [stats.accuracyRate]);
    const combinedTrendData = useMemo(() =>
        accuracyHistory.map((acc, i) => ({ index: i + 1, accuracy: acc, latency: latencyHistory[i] || 0 })),
        [accuracyHistory, latencyHistory]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

            {/* Daily Tactical Status Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="flex-1 w-full glass p-6 rounded-[2.5rem] border-act-accent/20 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 h-1 bg-act-accent/20 w-full">
                        <div className="h-full bg-act-accent transition-all duration-1000" style={{ width: `${(dailyMissionCompletedCount / 10) * 100}%` }} />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center relative transition-colors ${dailyMissionCompletedCount >= 10 ? 'bg-act-green text-black' : 'bg-act-accent/10 text-act-accent'}`}>
                            <Calendar size={28} />
                            {dailyMissionCompletedCount >= 10 && (
                                <div className="absolute -top-1 -right-1 bg-white text-act-green rounded-full p-1 border-2 border-act-black"><CheckCircle2 size={12} /></div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xs font-black font-mono uppercase tracking-[0.2em] text-white">Daily Tactical Mission</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-mono text-gray-400 uppercase">Target: 10 Nodes</span>
                                <div className="flex gap-1">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${i < dailyMissionCompletedCount ? 'bg-act-green shadow-[0_0_5px_#00f294]' : 'bg-white/10'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 px-8 border-l border-white/5">
                        <div className="text-center">
                            <span className="text-[8px] font-mono text-gray-600 uppercase">Streak</span>
                            <p className="text-xl font-black text-act-red italic flex items-center gap-1"><Flame size={18} fill="#ff4d4d" /> {stats.streak}</p>
                        </div>
                        <div className="text-center">
                            <span className="text-[8px] font-mono text-gray-600 uppercase">Avg Latency</span>
                            <p className="text-xl font-black text-white font-mono">{stats.avgLatency}s</p>
                        </div>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shrink-0">
                    <button onClick={() => setView('lexicon')} className={`px-6 py-3 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-2 ${view === 'lexicon' ? 'bg-act-accent text-white shadow-lg shadow-act-accent/20' : 'text-gray-500 hover:text-gray-300'}`}>
                        <Layout size={14} /> Lexicon
                    </button>
                    <button onClick={() => setView('quick-review')} className={`px-6 py-3 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-2 ${view === 'quick-review' ? 'bg-act-green text-black shadow-lg shadow-act-green/20' : 'text-gray-500 hover:text-gray-300'}`}>
                        <Zap size={14} /> Quick Review
                    </button>
                    <button onClick={() => setView('report')} className={`px-6 py-3 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-2 ${view === 'report' ? 'bg-act-accent text-white shadow-lg shadow-act-accent/20' : 'text-gray-500 hover:text-gray-300'}`}>
                        <BarChart3 size={14} /> Intel Report
                    </button>
                </div>
            </div>

            {view === 'lexicon' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass p-4 rounded-2xl border border-white/5">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-act-accent transition-colors" size={16} />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Neural Database..." className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm font-mono text-white outline-none focus:border-act-accent transition-all placeholder:text-gray-600" />
                        </div>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto">
                            {(['daily', 'all', 'targets', 'mastered'] as const).map(mode => (
                                <button key={mode} onClick={() => setFilterMode(mode)} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap ${filterMode === mode ? 'bg-white/10 text-white shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}>
                                    {mode === 'daily' && <Crosshair size={12} className="inline mr-1.5 mb-0.5 text-act-red" />}
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.4em]">
                            {filterMode === 'daily' ? 'Mission Parameters: Active' : `Database Size: ${filteredWords.length} Nodes`}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-act-green uppercase tracking-widest">{mastered.length} / {ACT_ELITE_VOCAB.length} Secured</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {filteredWords.map(word => {
                            const isMastered = mastered.includes(word);
                            const isDaily = dailyMission.includes(word);
                            return (
                                <button key={word} onClick={() => startDrill(word)} className={`p-4 rounded-xl border text-[10px] font-mono font-bold uppercase transition-all flex flex-col items-center gap-2 group relative overflow-hidden h-24 justify-center ${isMastered ? 'bg-act-green/5 border-act-green/10 text-act-green hover:bg-act-green/10 hover:border-act-green/30 cursor-pointer' : isDaily ? 'glass border-act-accent shadow-[0_0_15px_rgba(46,125,255,0.15)] text-white scale-[1.02]' : 'glass border-white/5 text-gray-400 hover:border-act-accent hover:text-white hover:scale-105'}`}>
                                    {isMastered ? <CheckCircle2 size={14} /> : isDaily ? <Crosshair size={14} className="text-act-red animate-pulse" /> : <Zap size={14} className="group-hover:text-act-accent transition-colors" />}
                                    <span className="truncate w-full text-center px-1">{word}</span>
                                    <div className="absolute inset-0 bg-act-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {isDaily && !isMastered && <div className="absolute top-1 right-1 h-1.5 w-1.5 bg-act-red rounded-full animate-ping" />}
                                </button>
                            );
                        })}
                        {filteredWords.length === 0 && (
                            <div className="col-span-full py-20 text-center opacity-30"><Filter size={48} className="mx-auto mb-4" /><p className="text-xs font-mono uppercase tracking-widest">No matching nodes found.</p></div>
                        )}
                    </div>
                </div>
            )}

            {view === 'drill' && currentWord && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pt-10">
                    <div className="flex items-center justify-between">
                        <button onClick={() => setView('lexicon')} className="text-[10px] font-mono text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"><ChevronRight size={14} className="rotate-180" /> Abort Tactical Engagement</button>
                        <div className="flex items-center gap-3">
                            <div className="px-5 py-2 rounded-xl bg-act-accent/10 border border-act-accent/20 text-act-accent text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">Target Node: {peekWord ? currentWord : 'CLASSIFIED'}</div>
                            {!revealed && (<button onClick={() => setPeekWord(!peekWord)} className="p-2 text-gray-500 hover:text-white transition-colors">{peekWord ? <EyeOff size={14} /> : <Eye size={14} />}</button>)}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-8 glass rounded-[3rem] border-dashed border-2 border-white/10 animate-pulse">
                            <div className="relative"><div className="h-16 w-16 border-t-4 border-act-accent rounded-full animate-spin" /><div className="absolute inset-0 flex items-center justify-center text-act-accent"><BrainCircuit size={24} /></div></div>
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.5em]">Constructing Nuance Trap...</span>
                        </div>
                    ) : drill && (
                        <div className="space-y-8">
                            <div className="glass p-12 rounded-[3rem] border-l-8 border-act-accent relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Sparkles size={160} className="text-act-accent" /></div>
                                <p className="text-2xl font-medium leading-relaxed text-white/90 relative z-10 tracking-tight">{drill.content.split(/(___)/).map((part, i) => part === '___' ? <span key={i} className="border-b-4 border-act-accent px-4 py-1 mx-2 bg-act-accent/10 text-act-accent font-black shadow-[0_0_15px_rgba(46,125,255,0.2)]">?</span> : part)}</p>
                            </div>

                            <div className="text-center space-y-2 mb-4"><p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest"><span className="text-act-red font-bold">WARNING:</span> Distractors are precise near-synonyms.</p></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {drill.options.map((option, idx) => {
                                    const isCorrect = option === drill.correctAnswer;
                                    const isSelected = selectedOption === option;
                                    let style = 'glass border-white/5 text-gray-400 hover:border-white/20';
                                    if (revealed) {
                                        if (isCorrect) style = 'bg-act-green/20 border-act-green text-act-green shadow-[0_0_30px_rgba(0,242,148,0.1)] scale-[1.02]';
                                        else if (isSelected) style = 'bg-act-red/20 border-act-red text-act-red opacity-50';
                                        else style = 'opacity-20 grayscale';
                                    } else if (isSelected) style = 'bg-act-accent/20 border-act-accent text-white scale-[1.02] shadow-[0_0_20px_rgba(46,125,255,0.2)]';

                                    return (<button key={idx} onClick={() => !revealed && setSelectedOption(option)} className={`p-8 rounded-[2rem] text-left font-mono text-sm font-bold border-2 transition-all flex items-center justify-between ${style}`}><span>{option}</span>{revealed && isCorrect && <CheckCircle2 size={24} />}{revealed && isSelected && !isCorrect && <XCircle size={24} />}</button>);
                                })}
                            </div>

                            {!revealed ? (
                                <button disabled={!selectedOption} onClick={handleReveal} className="w-full bg-white text-act-black font-black py-6 rounded-[2rem] uppercase font-mono tracking-[0.3em] text-xs hover:bg-act-accent hover:text-white transition-all disabled:opacity-20 shadow-2xl">Commit Diction Key</button>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-act-accent/5 border border-act-accent/10 p-10 rounded-[2.5rem] relative overflow-hidden">
                                        <div className="absolute -right-8 -bottom-8 opacity-5"><Target size={120} className="text-act-accent" /></div>
                                        <div className="flex items-center gap-3 mb-6 text-act-accent"><Target size={20} /><h4 className="text-xs font-mono font-bold uppercase tracking-[0.4em]">Elite Logic Override</h4></div>
                                        <p className="text-base text-blue-100/70 italic leading-relaxed font-mono">{drill.explanation}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => startDrill(currentWord!)} className="flex-1 glass border-white/10 py-6 rounded-[2rem] text-gray-400 font-mono text-xs uppercase font-bold hover:text-white transition-all flex items-center justify-center gap-3"><RefreshCcw size={18} /> Recalibrate Node</button>
                                        <button onClick={() => handleMaster(currentWord!)} className="flex-1 bg-act-green text-black py-6 rounded-[2rem] font-black font-mono text-xs uppercase hover:bg-green-400 transition-all shadow-xl shadow-act-green/20 flex items-center justify-center gap-3"><CheckCircle2 size={18} /> Secure Mastery</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {view === 'report' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass p-10 rounded-[3rem] flex flex-col items-center justify-center space-y-6">
                            <div className="relative h-40 w-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={reportData} innerRadius={65} outerRadius={75} dataKey="value" startAngle={90} endAngle={450}>{reportData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />))}</Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-black text-white">{stats.accuracyRate}%</span><span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Precision</span></div>
                            </div>
                            <div className="text-center"><h3 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">Global Precision</h3><p className="text-[9px] font-mono text-gray-600 mt-1 uppercase">Target for 36: {'>'} 94%</p></div>
                        </div>

                        <div className="md:col-span-2 glass p-10 rounded-[3rem] flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3"><TrendingUp size={20} className="text-act-accent" /><h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-gray-400">Neurological Stability Trend</h3></div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-act-accent" /><span className="text-[8px] font-mono text-gray-600 uppercase">Latency (s)</span></div>
                                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-act-green" /><span className="text-[8px] font-mono text-gray-600 uppercase">Accuracy</span></div>
                                </div>
                            </div>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={combinedTrendData}>
                                        <defs><linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00f294" stopOpacity={0.2} /><stop offset="95%" stopColor="#00f294" stopOpacity={0} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="index" stroke="#333" fontSize={9} hide />
                                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} itemStyle={{ textTransform: 'uppercase', fontStyle: 'italic' }} />
                                        <Area type="monotone" dataKey="accuracy" stroke="#00f294" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                                        <Area type="monotone" dataKey="latency" stroke="#2e7dff" strokeWidth={2} fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[9px] font-mono text-gray-600 uppercase text-center mt-4 italic">Real-time synchronization of recognition speed vs. semantic precision.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-8">
                            <div className="flex items-center gap-3"><Clock className="text-act-accent" size={20} /><h3 className="text-xs font-black font-mono uppercase tracking-[0.3em]">Latency Analysis</h3></div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1"><span className="text-4xl font-black text-white">{stats.avgLatency}s</span><p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Current Speed</p></div>
                                <div className="space-y-1"><span className="text-4xl font-black text-act-green italic">1.2s</span><p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">36-Node Target</p></div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><p className="text-[10px] font-mono text-gray-400 uppercase leading-relaxed">Your recognition speed has <span className="text-act-green font-bold">improved by 14%</span> this week. Focus on <span className="text-white">"Fastidious"</span> tier words to break the 1.5s barrier.</p></div>
                        </div>

                        <div className="bg-act-accent/10 border border-act-accent/20 p-10 rounded-[3.5rem] relative overflow-hidden flex flex-col justify-center items-center text-center space-y-6">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={140} className="text-act-accent" /></div>
                            <Sparkles className="text-act-accent" size={48} />
                            <div><h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Strategic Prognosis</h4><p className="text-sm text-blue-200/60 font-mono uppercase mt-4 max-w-sm mx-auto leading-relaxed">Based on your {stats.accuracyRate}% precision and {stats.avgLatency}s latency, your expected ACT Lexicon Score is <span className="text-white font-bold underline decoration-act-accent">35.6</span>.</p></div>
                            <div className="flex gap-4"><div className="px-4 py-2 glass rounded-xl text-[9px] font-mono font-bold text-gray-400 uppercase">Accuracy: Secured</div><div className="px-4 py-2 glass rounded-xl text-[9px] font-mono font-bold text-act-red uppercase">Speed: Critical</div></div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'quick-review' && (
                <QuickReviewMode
                    words={dailyMission}
                    user={user}
                    onComplete={(stats) => {
                        console.log('Quick Review completed:', stats);
                        setView('lexicon');
                    }}
                    onBack={() => setView('lexicon')}
                />
            )}

            {showPlanSelector && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <StudyPlanSelector
                            onSelectPlan={(plan) => {
                                setStudyPlan(plan);
                                setShowPlanSelector(false);
                                if (onUpdateUser) {
                                    onUpdateUser({ studyPlan: plan });
                                }
                            }}
                            currentPlan={studyPlan || undefined}
                        />
                    </div>
                </div>
            )}

            {studyPlan && !showPlanSelector && view === 'lexicon' && (
                <div className="mt-8">
                    <StudyPlanDashboard
                        studyPlan={studyPlan}
                        masteredWords={mastered.length}
                        totalWords={ACT_ELITE_VOCAB.length}
                        onChangePlan={() => setShowPlanSelector(true)}
                    />
                </div>
            )}
        </div>
    );
};
