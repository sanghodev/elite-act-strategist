
import React, { useMemo, useState, useEffect } from 'react';
import { HistoryItem, User } from '../types';
import { AlertTriangle, Activity, Database, Trash2, Target, Radio, CloudLightning, Loader2, Clock, Zap, CheckCircle2, ShieldCheck, BarChart3, TrendingUp, PieChart as PieChartIcon, Filter, Eye, X, Flame, Crosshair, Sparkles } from 'lucide-react';
import { initSupabase, syncHistoryItem, syncUser } from '../services/supabaseClient';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

interface DashboardProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
}

const ACT_TRENDS = [
  { sector: 'Math', trend: 'Increased Vector/Matrix complexity in final 10 questions.', level: 'HIGH' },
  { sector: 'Reading', trend: 'More "Half-Right, Half-Wrong" traps in Dual Passages.', level: 'CRITICAL' },
  { sector: 'Science', trend: 'Shift toward data synthesis across multiple experiments.', level: 'MED' },
  { sector: 'English', trend: 'Subtle "Transition" traps involving punctuation nuances.', level: 'HIGH' },
];

export const Dashboard: React.FC<DashboardProps> = ({ history, onDelete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [sbStatus, setSbStatus] = useState<'online' | 'offline' | 'error'>('offline');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const checkSb = async () => {
    const supabase = initSupabase();
    if (!supabase) { setSbStatus('offline'); return; }
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) { setSbStatus('error'); setErrorMsg(error.message); }
      else { setSbStatus('online'); setErrorMsg(null); }
    } catch (e: any) { setSbStatus('error'); setErrorMsg(e.message); }
  };

  useEffect(() => { checkSb(); }, []);

  // Get unique sections and question types
  const sections = useMemo(() => {
    const unique = new Set(history.map(h => h.analysis?.surface?.section).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [history]);

  const questionTypes = useMemo(() => {
    const unique = new Set(history.map(h => h.analysis?.surface?.questionType).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [history]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const sectionMatch = filterSection === 'All' || item.analysis?.surface?.section === filterSection;
      const typeMatch = filterType === 'All' || item.analysis?.surface?.questionType === filterType;
      return sectionMatch && typeMatch;
    });
  }, [history, filterSection, filterType]);

  // Data Processing for Charts
  const chartData = useMemo(() => {
    return [...filteredHistory].reverse().slice(-7).map((item, idx) => ({
      name: `R-${idx + 1}`,
      accuracy: item.drillResult?.scorePercentage || 0,
      time: item.drillResult?.timeSpentSeconds || 0,
      overtime: item.drillResult?.overtimeCount || 0
    }));
  }, [filteredHistory]);

  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredHistory.forEach(item => {
      const sec = item.analysis?.surface?.section || 'Unknown';
      counts[sec] = (counts[sec] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredHistory]);

  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayHistory = filteredHistory.filter(h => new Date(h.timestamp).setHours(0, 0, 0, 0) === today);

    return {
      totalTime: todayHistory.reduce((acc, h) => acc + (h.drillResult?.timeSpentSeconds || 0), 0),
      avgAccuracy: todayHistory.length > 0
        ? Math.round(todayHistory.reduce((acc, h) => acc + (h.drillResult?.scorePercentage || 0), 0) / todayHistory.length)
        : 0,
      engagements: todayHistory.length
    };
  }, [filteredHistory]);

  const COLORS = ['#2e7dff', '#ff4d4d', '#00f294', '#facc15'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Top Banner: Status & Daily Summary */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-mono font-bold uppercase transition-all group relative ${sbStatus === 'online' ? 'bg-act-green/10 border-act-green/20 text-act-green' :
            sbStatus === 'error' ? 'bg-act-red/10 border-act-red/20 text-act-red' :
              'bg-white/5 border-white/10 text-gray-500'
            }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${sbStatus === 'online' ? 'bg-act-green animate-pulse' : 'bg-current'}`} />
            Cloud Uplink: {sbStatus}
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-gray-600 uppercase">Today's Focus</span>
              <span className="text-xs font-mono font-bold text-white uppercase">{Math.floor(stats.totalTime / 60)}m {stats.totalTime % 60}s</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-gray-600 uppercase">Daily Accuracy</span>
              <span className={`text-xs font-mono font-bold uppercase ${stats.avgAccuracy >= 90 ? 'text-act-green' : 'text-act-accent'}`}>{stats.avgAccuracy}%</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setIsSyncing(true); setTimeout(() => setIsSyncing(false), 1500); }}
          disabled={isSyncing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all group disabled:opacity-50"
        >
          {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <CloudLightning size={14} />}
          Manual Sync
        </button>
      </div>

      {/* Filter Controls */}
      <div className="glass p-6 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={16} className="text-act-accent" />
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Pattern Filter</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-mono text-gray-600 uppercase">Section</span>
            <div className="flex gap-2">
              {sections.map(sec => (
                <button
                  key={sec}
                  onClick={() => setFilterSection(sec)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${filterSection === sec
                    ? 'bg-act-accent text-white shadow-lg shadow-act-accent/20'
                    : 'bg-white/5 text-gray-500 hover:text-white'
                    }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-mono text-gray-600 uppercase">Question Type</span>
            <div className="flex gap-2 flex-wrap">
              {questionTypes.slice(0, 6).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${filterType === type
                    ? 'bg-act-red text-white shadow-lg shadow-act-red/20'
                    : 'bg-white/5 text-gray-500 hover:text-white'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 text-[9px] font-mono text-gray-600 uppercase">
          Showing {filteredHistory.length} of {history.length} records
        </div>
      </div>

      {/* Analytics Visualizers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Accuracy Trend */}
        <div className="xl:col-span-2 glass p-8 rounded-3xl border border-white/5 relative overflow-hidden h-[350px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-act-accent" />
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Accuracy Evolution (Last 7)</h3>
            </div>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-act-accent" />
              <span className="text-[8px] font-mono text-gray-600 uppercase">Score %</span>
            </div>
          </div>
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e7dff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2e7dff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#2e7dff', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#2e7dff" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Problem Distribution */}
        <div className="glass p-8 rounded-3xl border border-white/5 h-[350px]">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon size={16} className="text-act-red" />
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Sector Exposure</h3>
          </div>
          <div className="h-full w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={distributionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-[-40px] justify-center">
            {distributionData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[8px] font-mono text-gray-600 uppercase">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time & Latency Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-3xl h-[280px]">
          <div className="flex items-center gap-3 mb-6">
            <Clock size={16} className="text-act-green" />
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Pacing Latency (Sec/Unit)</h3>
          </div>
          <ResponsiveContainer width="100%" height="70%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#525252" fontSize={9} axisLine={false} tickLine={false} />
              <Bar dataKey="time" fill="#00f294" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-6 rounded-2xl border-l-4 border-act-red relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4 text-act-red">
            <Radio size={16} className="animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] font-bold">Intel Alert Feed</span>
          </div>
          <div className="space-y-3">
            {ACT_TRENDS.slice(0, 3).map((t, i) => (
              <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-gray-500 uppercase">{t.sector}</span>
                  <p className="text-[10px] text-gray-300 leading-tight">{t.trend}</p>
                </div>
                <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded ${t.level === 'CRITICAL' ? 'bg-act-red/20 text-act-red' : 'bg-act-accent/20 text-act-accent'}`}>{t.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
          <Database size={14} className="text-act-accent" />
          <h3 className="font-mono font-bold uppercase text-xs tracking-[0.2em]">Operational Deployment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase font-mono tracking-widest border-b border-white/5">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Section</th>
                <th className="px-8 py-5">Question Type</th>
                <th className="px-8 py-5">Accuracy</th>
                <th className="px-8 py-5">Latency</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredHistory.slice(0, 15).map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</td>
                  <td className="px-8 py-6">
                    <span className="text-[11px] text-white font-bold">{item.analysis?.surface?.section || 'N/A'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[9px] text-gray-400 uppercase truncate max-w-[150px] block">{item.analysis?.surface?.questionType || 'N/A'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.drillResult?.scorePercentage && item.drillResult.scorePercentage >= 90 ? 'bg-act-green' : 'bg-act-accent'}`} style={{ width: `${item.drillResult?.scorePercentage || 0}%` }} />
                      </div>
                      <span className="text-[11px] text-white">{item.drillResult?.scorePercentage || 0}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] flex items-center gap-1.5 ${item.drillResult?.overtimeCount ? 'text-act-red' : 'text-act-green'}`}>
                      {item.drillResult?.overtimeCount ? <AlertTriangle size={12} /> : <Zap size={12} />}
                      {item.drillResult?.timeSpentSeconds ? `${item.drillResult.timeSpentSeconds}s` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-act-accent transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-act-red transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr><td colSpan={6} className="px-8 py-20 text-center opacity-20 font-mono text-xs uppercase tracking-[0.5em]">No Strategic Data Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
          <div className="glass max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 p-8 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-act-accent/10 flex items-center justify-center text-act-accent">
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{selectedItem.analysis?.surface?.section || 'Analysis'}</h2>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{new Date(selectedItem.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {selectedItem.analysis && (
              <div className="space-y-6">
                {/* Surface Info */}
                <div className="glass p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Crosshair size={16} className="text-act-accent" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-act-accent">Problem Focus</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-mono text-gray-600 uppercase block mb-1">Underlined Snippet</span>
                      <p className="text-lg font-bold text-white underline decoration-act-accent underline-offset-4">{selectedItem.analysis.surface.underlinedSnippet}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-mono text-gray-600 uppercase block mb-1">Question Type</span>
                        <p className="text-sm text-white">{selectedItem.analysis.surface.questionType}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-gray-600 uppercase block mb-1">Difficulty</span>
                        <div className="flex gap-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className={`h-2 w-2 rounded-full ${i < (selectedItem.analysis?.surface?.difficulty || 0) ? 'bg-act-red' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fatal Mistake */}
                {selectedItem.analysis.tactical && (
                  <div className="glass p-6 rounded-2xl border-l-4 border-act-red">
                    <div className="flex items-center gap-3 mb-4">
                      <Flame size={16} className="text-act-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-act-red">The Fatal Mistake</h3>
                    </div>
                    <p className="text-xl font-black text-white mb-4">"{selectedItem.analysis.tactical.fatalMistake}"</p>
                    {selectedItem.analysis.diagnosis && (
                      <p className="text-sm text-gray-400 leading-relaxed">{selectedItem.analysis.diagnosis.explanation}</p>
                    )}
                  </div>
                )}

                {/* Execution Rule */}
                {selectedItem.analysis.tactical?.executionRule && (
                  <div className="bg-act-accent p-[2px] rounded-2xl">
                    <div className="bg-[#050505] rounded-[calc(1rem-2px)] p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Zap size={16} className="text-act-accent" fill="#2e7dff" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-act-accent">Execution Protocol</h3>
                      </div>
                      <p className="text-2xl font-black text-white tracking-tight italic">{selectedItem.analysis.tactical.executionRule}</p>
                    </div>
                  </div>
                )}

                {/* 36-Point Nuance */}
                {selectedItem.analysis.diagnosis?.nuance36 && (
                  <div className="glass p-6 rounded-2xl border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles size={16} className="text-yellow-500" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-500">Mastery Nuance (36-Point Level)</h3>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed italic">"{selectedItem.analysis.diagnosis.nuance36}"</p>
                  </div>
                )}

                {/* Impact Assessment */}
                {selectedItem.analysis.impact && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-4 rounded-xl">
                      <span className="text-[9px] font-mono text-gray-600 uppercase block mb-2">Score Loss</span>
                      <p className="text-lg font-black text-act-red">{selectedItem.analysis.impact.scoreLoss}</p>
                    </div>
                    <div className="glass p-4 rounded-xl">
                      <span className="text-[9px] font-mono text-gray-600 uppercase block mb-2">Urgency</span>
                      <p className="text-lg font-black text-white">{selectedItem.analysis.impact.urgency}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
