
import React from 'react';
import { AnalysisData, DrillProblem } from '../types';
import { Skull, Crosshair, Zap, ShieldAlert, ArrowRight, BrainCircuit, Info, Sparkles, Target, ShieldCheck, Flame } from 'lucide-react';

interface AnalysisResultProps {
  data: AnalysisData;
  drills: DrillProblem[] | null;
  loadingDrills: boolean;
  onGenerateDrills: () => void;
  userAnswer?: string;
  correctAnswer?: string;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  data,
  drills,
  loadingDrills,
  onGenerateDrills,
  userAnswer,
  correctAnswer
}) => {
  const isProactive = !data.diagnosis;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">

      {/* Sector & Node Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
        <div className="flex items-center gap-5">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isProactive ? 'bg-act-green/10 text-act-green' : 'bg-act-red/10 text-act-red'}`}>
            {isProactive ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-act-accent uppercase tracking-[0.2em]">{data.surface.section} Sector</span>
              <span className="h-1.5 w-1.5 bg-gray-800 rounded-full" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{data.diagnosis?.errorCategory || 'Maintenance'}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
              {isProactive ? 'Fortifying Logic' : 'Diagnosis: Critical Flaw'}
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Complexity Index</span>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-700 ${i < (data.surface.difficulty || 3) ? (isProactive ? 'bg-act-green shadow-[0_0_8px_#00f294]' : 'bg-act-red shadow-[0_0_8px_#ff4d4d]') : 'bg-white/5'}`} />
            ))}
          </div>
        </div>
      </div>

      {!isProactive ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Diagnostic Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass p-8 rounded-[2rem] border-l-4 border-act-red relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Skull size={200} className="text-act-red" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <Flame size={18} className="text-act-red" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-act-red">The Fatal Mistake</h3>
              </div>
              <p className="text-2xl font-black text-white leading-tight mb-4 tracking-tighter">
                "{data.tactical?.fatalMistake}"
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {data.diagnosis?.explanation}
              </p>
              <div className="bg-act-red/5 border border-act-red/10 p-5 rounded-2xl">
                <h4 className="text-[10px] font-mono font-bold text-act-red uppercase mb-2 flex items-center gap-2">
                  <Crosshair size={12} /> Designer's Deception
                </h4>
                <p className="text-xs text-red-200/70 italic leading-relaxed">
                  {data.tactical?.designersIntent}
                </p>
              </div>
            </div>

            <div className="bg-act-accent p-[2px] rounded-[2.5rem] shadow-[0_20px_50px_rgba(46,125,255,0.15)]">
              <div className="bg-[#050505] rounded-[calc(2.5rem-2px)] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Zap size={100} className="text-act-accent" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Zap size={20} className="text-act-accent" fill="#2e7dff" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-[0.4em] text-act-accent">Execution Protocol</h3>
                </div>
                <p className="text-3xl font-black text-white tracking-tighter leading-none mb-4 italic">
                  {data.tactical?.executionRule}
                </p>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Permanent Neurological Override</p>
              </div>
            </div>
          </div>

          {/* Context & Impact Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass p-8 rounded-[2rem] h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Target size={18} className="text-act-accent" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-act-accent">Tactical Focus</h3>
                </div>

                {/* Answer Display */}
                {(userAnswer || correctAnswer) && (
                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border-2 ${userAnswer ? 'bg-act-red/10 border-act-red/30' : 'bg-white/5 border-white/10'}`}>
                        <span className="text-[9px] font-mono text-gray-500 uppercase block mb-2">Your Answer</span>
                        <p className={`text-2xl font-black ${userAnswer ? 'text-act-red' : 'text-gray-600'}`}>
                          {userAnswer || 'N/A'}
                        </p>
                      </div>
                      <div className={`p-4 rounded-xl border-2 ${correctAnswer ? 'bg-act-green/10 border-act-green/30' : 'bg-white/5 border-white/10'}`}>
                        <span className="text-[9px] font-mono text-gray-500 uppercase block mb-2">Correct Answer</span>
                        <p className={`text-2xl font-black ${correctAnswer ? 'text-act-green' : 'text-gray-600'}`}>
                          {correctAnswer || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* AI가 추출한 정답 내용 표시 */}
                    {data.tactical?.correctAnswerContent && (
                      <div className="p-4 bg-act-green/5 border border-act-green/20 rounded-xl">
                        <span className="text-[9px] font-mono text-act-green uppercase block mb-2">✓ Correct Answer Content</span>
                        <p className="text-sm text-gray-300 leading-relaxed">{data.tactical.correctAnswerContent}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 mb-8">
                  <p className="text-xl font-bold text-white mb-2 underline decoration-act-accent underline-offset-8">
                    {data.surface.underlinedSnippet}
                  </p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-4">Active Logic Node</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-xs font-mono text-gray-400 uppercase">Impact on 36</span>
                    <span className="text-lg font-black text-act-red">{data.impact?.scoreLoss}</span>
                  </div>
                  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-yellow-500" />
                      <span className="text-[10px] font-mono font-bold uppercase text-yellow-500 tracking-widest">Mastery Nuance</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed italic">"{data.diagnosis?.nuance36}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass p-10 rounded-[2.5rem] border-t-4 border-act-green">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 bg-act-green/10 rounded-xl flex items-center justify-center text-act-green"><ShieldCheck size={20} /></div>
              <h3 className="text-sm font-black font-mono uppercase tracking-[0.2em] text-act-green">Maintenance Brief</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg font-medium">
              You've maintained a clean record here. However, perfection requires constant calibration. These drills will expose you to the most deceptive versions of {data.surface.questionType}.
            </p>
          </div>
          <div className="glass p-10 rounded-[2.5rem] border-t-4 border-act-accent">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 bg-act-accent/10 rounded-xl flex items-center justify-center text-act-accent"><BrainCircuit size={20} /></div>
              <h3 className="text-sm font-black font-mono uppercase tracking-[0.2em] text-act-accent">Pattern Stability</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg font-medium">
              The target is zero-latency recognition. We are testing your ability to spot {data.surface.questionType} nodes in under 3 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Intervention Action */}
      <div className="pt-12">
        {!drills && !loadingDrills && (
          <button
            onClick={onGenerateDrills}
            className="w-full group bg-white text-black p-10 rounded-[3rem] flex items-center justify-between hover:bg-act-accent hover:text-white transition-all duration-500 shadow-2xl hover:shadow-act-accent/40"
          >
            <div className="flex items-center gap-8">
              <div className="h-16 w-16 glass rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRight size={32} />
              </div>
              <div className="text-left">
                <h4 className="text-2xl font-black uppercase tracking-tighter leading-tight">
                  Commence Targeted Redemption
                </h4>
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-[0.4em] mt-1">Forging {drills ? 'Success' : 'Precision'} Pathways</p>
              </div>
            </div>
            <div className="hidden md:flex gap-1.5 px-6">
              <div className="h-12 w-[1px] bg-current opacity-20" />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Nodes</span>
                <span className="text-xl font-black">03</span>
              </div>
            </div>
          </button>
        )}

        {loadingDrills && (
          <div className="w-full py-24 flex flex-col items-center gap-8 glass rounded-[3rem] border-dashed border-2 border-white/10 animate-pulse">
            <div className="relative">
              <div className="h-20 w-20 border-b-4 border-act-accent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Target size={28} className="text-act-accent" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <span className="text-xl font-black uppercase tracking-[0.3em] text-white block">Constructing Reality...</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-gray-500">Injecting Logical Traps for Calibration</span>
            </div>
          </div>
        )}

        {drills && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.5em]">Intervention Set :: Alpha-01</h3>
              <div className="flex items-center gap-2 text-act-accent">
                <div className="h-1.5 w-1.5 rounded-full bg-act-accent animate-ping" />
                <span className="text-[10px] font-mono font-bold uppercase">Ready for Deployment</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {drills.map((drill, idx) => (
                <div key={idx} className="glass p-8 rounded-[2rem] flex flex-col h-full hover:border-act-accent/40 transition-colors group">
                  <div className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full w-fit mb-6 uppercase tracking-widest ${drill.type === 'Cloned' ? 'bg-act-accent/10 text-act-accent' :
                    drill.type === 'Pressure' ? 'bg-act-red/10 text-act-red' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                    {drill.type} Protocol
                  </div>
                  <p className="text-gray-300 font-medium leading-relaxed line-clamp-5 mb-8 text-sm italic">
                    "{drill.content.replace(/\[(.*?)\]/g, '$1')}"
                  </p>
                  <div className="mt-auto flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono uppercase tracking-widest">Node Locked</span>
                    <Crosshair size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
