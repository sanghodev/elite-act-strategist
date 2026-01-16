
import React, { useState, useEffect, useRef } from 'react';
import { DrillProblem, DrillResult, Section } from '../types';
import { Trophy, CheckCircle2, XCircle, ChevronRight, BrainCircuit, Timer, AlertCircle, Zap } from 'lucide-react';

interface DrillSessionProps {
  drills: DrillProblem[];
  questionType: string;
  section: Section;
  enableTimer: boolean;
  onComplete: (result: DrillResult) => void;
  onCancel: () => void;
}

export const DrillSession: React.FC<DrillSessionProps> = ({ drills, questionType, section, enableTimer, onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [overtimeCount, setOvertimeCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const timerRef = useRef<any>(null);

  const currentDrill = drills[currentIndex];

  // Helper to render bracketed text with an underline style
  const renderRichContent = (content: string) => {
    const parts = content.split(/(\[.*?\])/);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const text = part.slice(1, -1);
        return (
          <span key={i} className="underline decoration-2 decoration-act-accent underline-offset-4 font-semibold text-white">
            {text}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const calculateParTime = (sec: Section, type: string) => {
    let base = 60;
    if (sec === Section.English) base = 36;
    if (sec === Section.Math) base = 60;
    if (sec === Section.Reading || sec === Section.Science) base = 52;
    if (type === 'Pressure') return Math.floor(base * 0.7);
    if (type === 'Edge Case') return Math.floor(base * 1.3);
    return base;
  };

  useEffect(() => {
    if (enableTimer) {
      setTimeLeft(calculateParTime(section, currentDrill.type));
      setIsOvertime(false);
    }
  }, [currentIndex, section, currentDrill.type, enableTimer]);

  useEffect(() => {
    if (enableTimer && !isRevealed && !completed) {
      timerRef.current = setInterval(() => {
        setTotalTimeSpent(prev => prev + 1);
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsOvertime(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [enableTimer, isRevealed, completed]);

  const handleCheck = () => {
    if (!selectedOption) return;
    setIsRevealed(true);
    clearInterval(timerRef.current);

    const isCorrect = selectedOption === currentDrill.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      if (isOvertime) setOvertimeCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < drills.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsRevealed(false);
      setIsOvertime(false);
    } else {
      setCompleted(true);
      onComplete({
        timestamp: Date.now(),
        totalQuestions: drills.length,
        correctCount: score,
        overtimeCount: overtimeCount,
        scorePercentage: Math.round((score / drills.length) * 100),
        questionType: questionType,
        timeSpentSeconds: totalTimeSpent
      });
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (completed) {
    const accuracy = Math.round((score / drills.length) * 100);
    const avgTime = Math.round(totalTimeSpent / drills.length);
    const paceStatus = overtimeCount > 0 ? 'LAGGING' : 'OPTIMAL';

    return (
      <div className="max-w-md mx-auto py-12 text-center animate-in zoom-in duration-500">
        <div className={`h-28 w-28 mx-auto glass rounded-3xl flex items-center justify-center mb-8 ${accuracy >= 85 ? 'text-act-green' : 'text-act-accent'}`}>
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-black mb-6 uppercase font-mono">Engagement Data</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass p-5 rounded-2xl">
            <div className="text-2xl font-mono font-bold text-white">{accuracy}%</div>
            <div className="text-[9px] font-mono text-gray-500 uppercase mt-1">Accuracy</div>
          </div>
          <div className={`glass p-5 rounded-2xl border ${overtimeCount > 0 ? 'border-act-red/30' : 'border-act-green/30'}`}>
            <div className={`text-2xl font-mono font-bold ${overtimeCount > 0 ? 'text-act-red' : 'text-act-green'}`}>{paceStatus}</div>
            <div className="text-[9px] font-mono text-gray-500 uppercase mt-1">Pacing Status</div>
          </div>
        </div>

        <button onClick={onCancel} className="w-full bg-white text-act-black font-bold py-5 rounded-2xl hover:bg-gray-200 transition-all uppercase font-mono tracking-widest text-xs">
          Commit Data to Cloud
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-mono font-bold text-act-accent uppercase tracking-widest">{currentDrill.type} MODE</span>
          <h3 className="text-2xl font-bold tracking-tighter mt-1">Node {currentIndex + 1} of {drills.length}</h3>
        </div>
        {enableTimer && (
          <div className={`px-5 py-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${isOvertime ? 'bg-act-red/10 border-act-red text-act-red animate-pulse' : 'bg-white/5 border-white/10 text-white'}`}>
            {isOvertime ? <AlertCircle size={18} /> : <Timer size={18} />}
            <span className="font-mono font-bold text-xl tabular-nums">{isOvertime ? 'OVERTIME' : formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className={`glass p-10 rounded-3xl border-l-4 transition-all duration-500 ${isOvertime ? 'border-act-red bg-act-red/[0.02] shadow-[0_0_40px_rgba(255,77,77,0.1)]' : 'border-act-accent'}`}>
        <p className="text-xl font-medium leading-relaxed text-white/90">
          {renderRichContent(currentDrill.passage || currentDrill.content)}
        </p>
        {currentDrill.questionText && (
          <p className="text-sm text-gray-400 mt-4 italic">
            {currentDrill.questionText}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {currentDrill.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentDrill.correctAnswer;
          const label = currentDrill.answerLabels?.[idx] || String.fromCharCode(65 + idx); // A, B, C, D...

          let style = 'bg-white/[0.02] border-white/5 text-gray-400';
          if (isRevealed) {
            if (isCorrect) style = 'bg-act-green/20 border-act-green text-act-green';
            else if (isSelected) style = 'bg-act-red/20 border-act-red text-act-red';
            else style = 'opacity-20 bg-white/[0.01] border-white/5';
          } else if (isSelected) style = 'bg-act-accent/20 border-act-accent text-white scale-[1.01]';

          return (
            <button key={idx} onClick={() => !isRevealed && setSelectedOption(option)} className={`p-6 rounded-2xl text-left font-mono text-sm transition-all border-2 flex items-center gap-4 group ${style}`}>
              <span className="font-bold text-lg min-w-[2rem]">{label}.</span>
              <span className="flex-1">{option}</span>
              {isRevealed && isCorrect && <CheckCircle2 size={20} />}
              {isRevealed && isSelected && !isCorrect && <XCircle size={20} />}
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div className="bg-act-accent/10 border border-act-accent/20 p-6 rounded-2xl animate-in slide-in-from-left-4">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-act-accent tracking-widest mb-2">
            <BrainCircuit size={14} /> Strategic Insight
          </div>
          <p className="text-xs text-blue-200 leading-relaxed font-mono">{currentDrill.explanation}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        {!isRevealed ? (
          <button onClick={handleCheck} disabled={!selectedOption} className="bg-white text-act-black font-bold py-5 px-12 rounded-2xl disabled:opacity-20 uppercase font-mono tracking-widest text-xs">
            Confirm Key
          </button>
        ) : (
          <button onClick={handleNext} className="bg-act-accent text-white font-bold py-5 px-12 rounded-2xl uppercase font-mono tracking-widest text-xs flex items-center gap-2">
            {currentIndex === drills.length - 1 ? 'End Engagement' : 'Next Node'} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
