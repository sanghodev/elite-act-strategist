import React from 'react';
import { TrendingUp, Target, Calendar, AlertCircle, CheckCircle2, Flame } from 'lucide-react';
import { StudyPlan, calculateProgress } from '../services/studyPlanService';

interface StudyPlanDashboardProps {
    studyPlan: StudyPlan;
    masteredWords: number;
    totalWords: number;
    onChangePlan: () => void;
}

export const StudyPlanDashboard: React.FC<StudyPlanDashboardProps> = ({
    studyPlan,
    masteredWords,
    totalWords,
    onChangePlan
}) => {
    const progress = calculateProgress(studyPlan, masteredWords);

    return (
        <div className="glass p-6 rounded-3xl border border-white/10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Target size={20} className="text-act-accent" />
                    <h3 className="text-sm font-black font-mono uppercase tracking-widest text-white">
                        Study Plan Progress
                    </h3>
                </div>
                <button
                    onClick={onChangePlan}
                    className="text-xs font-mono text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
                >
                    Change Plan
                </button>
            </div>

            {/* Days Remaining */}
            <div className="text-center p-6 bg-gradient-to-br from-act-accent/10 to-act-green/10 rounded-2xl border border-white/10">
                <p className="text-6xl font-black text-white mb-2">{progress.daysRemaining}</p>
                <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Days Until Test</p>
                <p className="text-xs font-mono text-gray-600 mt-2">
                    {new Date(studyPlan.target_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-500 uppercase">
                    <span>Progress</span>
                    <span>{progress.percentComplete}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-act-accent to-act-green transition-all duration-500"
                        style={{ width: `${progress.percentComplete}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs font-mono text-gray-600">
                    <span>{masteredWords} mastered</span>
                    <span>{totalWords} total</span>
                </div>
            </div>

            {/* On Track Indicator */}
            <div
                className={`p-4 rounded-xl border-2 flex items-center gap-3 ${progress.onTrack
                        ? 'bg-act-green/10 border-act-green/30'
                        : 'bg-act-red/10 border-act-red/30'
                    }`}
            >
                {progress.onTrack ? (
                    <>
                        <CheckCircle2 size={24} className="text-act-green shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-act-green">On Track!</p>
                            <p className="text-xs font-mono text-gray-400">
                                You're meeting your daily goals
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <AlertCircle size={24} className="text-act-red shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-act-red">Behind Schedule</p>
                            <p className="text-xs font-mono text-gray-400">
                                Need {progress.wordsPerDayNeeded} words/day to catch up
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl text-center">
                    <p className="text-2xl font-black text-white">{progress.expectedWords}</p>
                    <p className="text-xs font-mono text-gray-500 uppercase mt-1">Expected</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center">
                    <p className="text-2xl font-black text-act-accent">{studyPlan.daily_goal}</p>
                    <p className="text-xs font-mono text-gray-500 uppercase mt-1">Daily Goal</p>
                </div>
            </div>

            {/* Daily Breakdown */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-2">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Today's Target</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-400">New Words</span>
                    <span className="text-sm font-bold text-act-green">
                        {studyPlan.custom.new_words_per_day}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-400">Reviews</span>
                    <span className="text-sm font-bold text-act-accent">
                        {studyPlan.custom.review_words_per_day}
                    </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs font-mono text-white font-bold">Total</span>
                    <span className="text-lg font-black text-white">
                        {studyPlan.daily_goal}
                    </span>
                </div>
            </div>
        </div>
    );
};
