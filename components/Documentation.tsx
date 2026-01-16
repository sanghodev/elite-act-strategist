
import React from 'react';
import { BookOpen, Zap, Target, BrainCircuit, ShieldCheck, Clock, TrendingUp, Sparkles, ChevronRight, Info, Crosshair, ListChecks } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-32">
      
      {/* Hero Briefing */}
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-act-accent/10 border border-act-accent/20 text-act-accent text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-4">
            System Protocol v5.2 // Classified
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic text-white leading-none">
            THE 36-NODE <br /> <span className="text-act-accent">BLUEPRINT</span>
        </h1>
        <p className="text-gray-500 font-mono text-sm uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            "At the elite level, the ACT is no longer a test of knowledge. It is a test of Neurological Recognition Speed."
        </p>
      </div>

      {/* Core Philosophy: Recognition vs Interpretation */}
      <section className="glass rounded-[3rem] p-12 border-l-8 border-act-accent relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5">
            <BrainCircuit size={200} className="text-act-accent" />
        </div>
        <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-act-accent/20 rounded-2xl flex items-center justify-center text-act-accent">
                    <Zap size={24} />
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">The Recognition Protocol</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <h3 className="text-act-red font-mono text-xs font-bold uppercase tracking-widest">30-33 Score: Interpretation</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Students at this level <span className="text-white font-bold italic">interpret</span>. They read a word, translate it in their head, check the dictionary definition, and then look for a match. This process takes <span className="text-white underline">3-5 seconds</span> per node.
                    </p>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-act-red w-2/3" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-act-green font-mono text-xs font-bold uppercase tracking-widest">34-36 Score: Recognition</h3>
                    <p className="text-white text-sm leading-relaxed">
                        Elite operatives <span className="text-act-green font-black italic">recognize</span>. They don't translate; they see the word and the context immediately triggers the correct "semantic flavor." Total latency: <span className="text-act-green underline font-bold">&lt; 1.5 seconds</span>.
                    </p>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-act-green w-full shadow-[0_0_10px_#00f294]" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* The Daily Routine Loop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass p-10 rounded-[2.5rem] space-y-6 hover:border-act-accent/30 transition-all border border-white/5">
            <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-act-accent">
                <Target size={28} />
            </div>
            <h3 className="text-lg font-black uppercase italic">01. Infiltration</h3>
            <p className="text-xs text-gray-500 font-mono leading-relaxed uppercase">
                Complete your <span className="text-white">Daily Neural Mission</span> (10 Nodes). Do not skip days. Consistency is what builds the "instant recognition" pathways.
            </p>
        </div>
        <div className="glass p-10 rounded-[2.5rem] space-y-6 border border-act-accent/20 bg-act-accent/[0.02]">
            <div className="h-14 w-14 bg-act-accent/10 rounded-2xl flex items-center justify-center text-act-accent">
                <Crosshair size={28} />
            </div>
            <h3 className="text-lg font-black uppercase italic">02. Engagement</h3>
            <p className="text-xs text-gray-300 font-mono leading-relaxed uppercase">
                When you fail a question, perform a <span className="text-act-red">Combat Analysis</span>. Upload the intel. Let the AI diagnose the <span className="text-white italic">"Fatal Mistake."</span>
            </p>
        </div>
        <div className="glass p-10 rounded-[2.5rem] space-y-6 hover:border-act-green/30 transition-all border border-white/5">
            <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-act-green">
                <TrendingUp size={28} />
            </div>
            <h3 className="text-lg font-black uppercase italic">03. Calibration</h3>
            <p className="text-xs text-gray-500 font-mono leading-relaxed uppercase">
                Check your <span className="text-act-green">Intel Report</span>. If your latency is above 2.0s for a node, you don't know it yet. Re-train until it's instinct.
            </p>
        </div>
      </div>

      {/* Deep Metrics Explanation */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
            <Info className="text-act-accent" size={20} />
            <h2 className="text-sm font-black font-mono uppercase tracking-[0.4em] text-gray-500">Metric Intelligence</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex gap-6">
                <div className="shrink-0 h-10 w-10 bg-act-accent/10 rounded-xl flex items-center justify-center text-act-accent">
                    <Clock size={20} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white uppercase">Recognition Latency</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-mono uppercase italic">
                        The time between seeing a stimulus and executing a decision. 36-pointers have optimized this to the limit. High accuracy with high latency means you are vulnerable to "Time-Induced Errors" in the final 10 questions.
                    </p>
                </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex gap-6">
                <div className="shrink-0 h-10 w-10 bg-act-green/10 rounded-xl flex items-center justify-center text-act-green">
                    <ListChecks size={20} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white uppercase">Semantic Stability</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-mono uppercase italic">
                        How consistent your logic is across different "Edge Case" scenarios. If your accuracy drops on "Pressure" mode drills, your fundamental logic node is "Brittle."
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Closing Statement */}
      <div className="glass p-12 rounded-[3.5rem] text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-act-accent/10 via-transparent to-act-red/10"></div>
        <Sparkles className="text-act-accent mx-auto" size={40} />
        <div className="space-y-4 relative z-10">
            <h3 className="text-3xl font-black italic tracking-tighter text-white">READY FOR ASCENSION?</h3>
            <p className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.5em]">Stop Studying. Start Training.</p>
        </div>
        <div className="pt-6 relative z-10">
            <div className="inline-flex items-center gap-8 px-8 py-4 glass rounded-full border border-white/10 text-[10px] font-mono text-gray-500 uppercase">
                <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-act-green" /> 36 Target</span>
                <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-act-accent" /> Zero Latency</span>
                <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-act-red" /> Absolute Precision</span>
            </div>
        </div>
      </div>
    </div>
  );
};
