
import React, { useState, useMemo } from 'react';
import { MasteryMetrics, HistoryItem, AnalysisData, Section, TACTICAL_MAP, ErrorCategory } from '../types';
import { Swords, Compass, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

interface TrainingGroundsProps {
  masteryData: MasteryMetrics[];
  history: HistoryItem[];
  onDeployDrill: (analysis: AnalysisData & { proactiveCategory?: string }) => void;
  loading: boolean;
}

export const TrainingGrounds: React.FC<TrainingGroundsProps> = ({ masteryData, history, onDeployDrill, loading }) => {
  const [activeSection, setActiveSection] = useState<Section>(Section.English);

  const categoryMap = useMemo(() => {
    const map: Record<string, MasteryMetrics> = {};
    masteryData.forEach(m => { map[m.category] = m; });
    return map;
  }, [masteryData]);

  const handleTrain = (category: string, section: Section) => {
    const existing = history.find(h => h.analysis?.surface?.questionType === category);

    // Create a structured proactive analysis object even if no history exists
    const proactiveAnalysis: AnalysisData = {
      surface: {
        section,
        questionType: category,
        underlinedSnippet: `Proactive Training: ${category}`,
        difficulty: 4
      },
      diagnosis: {
        errorCategory: ErrorCategory.ConceptDeficit,
        explanation: "Strategic fortification of a known tactical node.",
        nuance36: "Proactive mastery ensures zero-latency recognition under pressure."
      },
      pattern: {
        isKillerType: false,
        repetitionCount: existing ? 1 : 0
      },
      impact: {
        scoreLoss: "0.0 (Maintenance)",
        urgency: "Low (Proactive Training)"
      },
      tactical: {
        fatalMistake: "None (Proactive Session)",
        designersIntent: "Standard testing of core principles.",
        executionRule: `Continue to dominate ${category} with speed and precision.`
      }
    };

    onDeployDrill({
      ...proactiveAnalysis,
      proactiveCategory: category
    } as any);
  };

  const currentSyllabusUnits = TACTICAL_MAP[activeSection];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">

      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Compass className="text-act-accent" size={32} /> COMBAT MAP v2.1
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">Sync Verified: AI Mapping & Proactive Logging Enabled</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto">
          {Object.values(Section).map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap ${activeSection === s ? 'bg-act-accent text-white shadow-lg shadow-act-accent/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Ultra-Granular Skill Grid */}
      <div className="space-y-12">
        {currentSyllabusUnits.map((unit, uIdx) => (
          <section key={uIdx} className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-black font-mono uppercase tracking-widest text-gray-500">{unit.unit}</h3>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unit.nodes.map((node, nIdx) => {
                const mastery = categoryMap[node];
                const isUnexplored = !mastery;

                let statusColor = 'text-act-green';
                let borderColor = 'border-white/5';
                let label = 'SECURED';

                if (mastery) {
                  if (mastery.status === 'Critical') { statusColor = 'text-act-red'; borderColor = 'border-act-red/20'; label = 'CRITICAL'; }
                  else if (mastery.status === 'Unstable') { statusColor = 'text-yellow-500'; borderColor = 'border-yellow-500/20'; label = 'UNSTABLE'; }
                  else if (mastery.status === 'Stabilized') { label = 'STABILIZED'; }
                }

                return (
                  <div key={nIdx} className={`glass rounded-2xl p-5 border transition-all hover:scale-[1.02] hover:border-act-accent/30 group ${borderColor}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isUnexplored ? 'bg-act-green' : mastery.status === 'Critical' ? 'bg-act-red animate-pulse' : mastery.status === 'Unstable' ? 'bg-yellow-500' : 'bg-act-green'}`} />
                        <span className={`text-[9px] font-mono font-bold ${statusColor} uppercase tracking-widest`}>{label}</span>
                      </div>
                      {mastery && <span className="text-[10px] font-mono font-bold text-gray-600">{Math.round(mastery.avgAccuracy)}%</span>}
                    </div>
                    <h4 className="text-sm font-bold text-white mb-6 leading-tight group-hover:text-act-accent transition-colors">{node}</h4>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                      <span className="text-[9px] font-mono text-gray-600 uppercase">{mastery ? `${mastery.attempts} Engagements` : 'Unexplored Sector'}</span>
                      <button onClick={() => handleTrain(node, activeSection)} disabled={loading} className="p-2 rounded-lg bg-white/5 hover:bg-act-accent hover:text-white transition-all text-gray-500">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 bg-act-green/10 rounded-xl flex items-center justify-center text-act-green"><CheckCircle2 size={20} /></div>
          <div><h5 className="text-[10px] font-bold uppercase text-white">Green Status</h5><p className="text-[9px] font-mono text-gray-500 uppercase leading-relaxed">Secured or Unexplored. Considered mastered (36) until data proves otherwise.</p></div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500"><Zap size={20} /></div>
          <div><h5 className="text-[10px] font-bold uppercase text-white">Yellow Status</h5><p className="text-[9px] font-mono text-gray-500 uppercase leading-relaxed">Unstable. Precision fluctuates under pressure. Training highly recommended.</p></div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 bg-act-red/10 rounded-xl flex items-center justify-center text-act-red"><AlertTriangle size={20} /></div>
          <div><h5 className="text-[10px] font-bold uppercase text-white">Red Status</h5><p className="text-[9px] font-mono text-gray-500 uppercase leading-relaxed">Critical Flaw. Constant score loss. Priority #1 for combat engagement.</p></div>
        </div>
      </div>
    </div>
  );
};
