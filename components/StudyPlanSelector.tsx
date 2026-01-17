import React, { useState } from 'react';
import { Calendar, Target, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { STUDY_PERIODS, calculateStudyPlan, createStudyPlan, StudyPlan } from '../services/studyPlanService';

interface StudyPlanSelectorProps {
    onSelectPlan: (plan: StudyPlan) => void;
    currentPlan?: StudyPlan;
}

export const StudyPlanSelector: React.FC<StudyPlanSelectorProps> = ({
    onSelectPlan,
    currentPlan
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPlan?.period || 'balanced');
    const [useTestDate, setUseTestDate] = useState(false);
    const [testDate, setTestDate] = useState('');

    const handlePeriodSelect = (period: string) => {
        setSelectedPeriod(period);
        const plan = createStudyPlan(period as keyof typeof STUDY_PERIODS);
        onSelectPlan(plan);
    };

    const handleTestDateSelect = (date: string) => {
        setTestDate(date);
        const plan = calculateStudyPlan(new Date(date));
        setSelectedPeriod(plan.period);
        onSelectPlan(plan);
    };

    const selectedConfig = STUDY_PERIODS[selectedPeriod];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                    <Target size={32} className="text-act-accent" />
                    <h2 className="text-3xl font-black text-white">Set Your Study Timeline</h2>
                </div>
                <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
                    Choose your ACT test date or select a study period. We'll automatically adjust your daily goals and review schedule.
                </p>
            </div>

            {/* Toggle: Test Date vs Manual Period */}
            <div className="flex justify-center">
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setUseTestDate(false)}
                        className={`px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase transition-all ${!useTestDate
                                ? 'bg-act-accent text-white shadow-lg'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Clock size={14} className="inline mr-2 mb-0.5" />
                        Study Period
                    </button>
                    <button
                        onClick={() => setUseTestDate(true)}
                        className={`px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase transition-all ${useTestDate
                                ? 'bg-act-accent text-white shadow-lg'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Calendar size={14} className="inline mr-2 mb-0.5" />
                        Test Date
                    </button>
                </div>
            </div>

            {/* Test Date Picker */}
            {useTestDate && (
                <div className="max-w-md mx-auto glass p-8 rounded-3xl border border-white/10 animate-in zoom-in-95 duration-300">
                    <label className="block text-sm font-mono text-gray-400 uppercase tracking-widest mb-3">
                        ACT Test Date
                    </label>
                    <input
                        type="date"
                        value={testDate}
                        onChange={(e) => handleTestDateSelect(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-4 text-white font-mono text-lg focus:border-act-accent focus:outline-none transition-all"
                    />
                    {testDate && (
                        <div className="mt-4 p-4 bg-act-accent/10 rounded-xl border border-act-accent/20">
                            <p className="text-sm font-mono text-act-accent">
                                📅 Recommended: <span className="font-black">{selectedConfig.name}</span> Plan
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Period Cards */}
            {!useTestDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(STUDY_PERIODS).map(([key, period]) => {
                        const isSelected = selectedPeriod === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handlePeriodSelect(key)}
                                className={`p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${isSelected
                                        ? 'bg-act-accent/20 border-act-accent shadow-lg shadow-act-accent/20 scale-105'
                                        : 'glass border-white/10 hover:border-white/30 hover:scale-102'
                                    }`}
                            >
                                {/* Background Emoji */}
                                <div className="absolute top-2 right-2 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">
                                    {period.emoji}
                                </div>

                                {/* Content */}
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-white">{period.name}</h3>
                                        {isSelected && <CheckCircle2 size={20} className="text-act-green" />}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Clock size={14} />
                                            <span className="text-xs font-mono">{period.duration_days} days</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Target size={14} />
                                            <span className="text-xs font-mono">{period.total_daily} words/day</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 font-mono leading-relaxed">
                                        {period.description}
                                    </p>

                                    {/* Daily Breakdown */}
                                    <div className="pt-3 border-t border-white/10 space-y-1">
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-gray-600">New:</span>
                                            <span className="text-act-green font-bold">{period.new_words_per_day}/day</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-gray-600">Review:</span>
                                            <span className="text-act-accent font-bold">{period.review_words_per_day}/day</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Preview Panel */}
            {selectedConfig && (
                <div className="max-w-2xl mx-auto glass p-8 rounded-3xl border-2 border-act-accent/20 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp size={24} className="text-act-accent" />
                        <h3 className="text-xl font-black text-white">Your Study Plan</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <p className="text-3xl font-black text-act-green">{selectedConfig.total_daily}</p>
                            <p className="text-xs font-mono text-gray-500 uppercase mt-1">Words/Day</p>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <p className="text-3xl font-black text-act-accent">{selectedConfig.new_words_per_day}</p>
                            <p className="text-xs font-mono text-gray-500 uppercase mt-1">New</p>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <p className="text-3xl font-black text-white">{selectedConfig.review_words_per_day}</p>
                            <p className="text-xs font-mono text-gray-500 uppercase mt-1">Review</p>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <p className="text-3xl font-black text-gray-400">{selectedConfig.duration_days}</p>
                            <p className="text-xs font-mono text-gray-500 uppercase mt-1">Days</p>
                        </div>
                    </div>

                    <div className="p-4 bg-act-accent/10 rounded-xl border border-act-accent/20">
                        <p className="text-sm font-mono text-gray-300 leading-relaxed">
                            <span className="text-act-accent font-bold">Review Schedule:</span> Words will reappear at intervals of{' '}
                            <span className="text-white font-bold">
                                {selectedConfig.intervals.join(' → ')} days
                            </span>
                            {' '}based on your performance.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
