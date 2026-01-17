import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2, Trophy, ArrowLeft, Sparkles } from 'lucide-react';
import { SwipeableCard } from './SwipeableCard';
import { recordReview } from '../services/vocabularyService';
import { User } from '../types';

interface QuickReviewModeProps {
    words: string[];
    user?: User;
    onComplete: (stats: { correct: number; total: number; timeSpent: number }) => void;
    onBack: () => void;
}

export const QuickReviewMode: React.FC<QuickReviewModeProps> = ({
    words,
    user,
    onComplete,
    onBack
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [startTime] = useState(Date.now());
    const [showCelebration, setShowCelebration] = useState(false);

    const currentWord = words[currentIndex];
    const progress = ((currentIndex) / words.length) * 100;
    const isComplete = currentIndex >= words.length;

    useEffect(() => {
        if (isComplete && !showCelebration) {
            setShowCelebration(true);
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            setTimeout(() => {
                onComplete({
                    correct: correctCount,
                    total: words.length,
                    timeSpent
                });
            }, 2000);
        }
    }, [isComplete, showCelebration, correctCount, words.length, startTime, onComplete]);

    const handleSwipeRight = async () => {
        // Know it - correct answer
        if (user?.id) {
            await recordReview(user.id, currentWord, true);
        }
        setCorrectCount(prev => prev + 1);
        setCurrentIndex(prev => prev + 1);
    };

    const handleSwipeLeft = async () => {
        // Don't know - incorrect answer
        if (user?.id) {
            await recordReview(user.id, currentWord, false);
        }
        setCurrentIndex(prev => prev + 1);
    };

    // Mock definitions - in production, fetch from API or database
    const getWordData = (word: string) => {
        return {
            definition: `Definition of ${word}`,
            example: `Example sentence using ${word} in context.`
        };
    };

    if (isComplete) {
        const accuracy = Math.round((correctCount / words.length) * 100);
        const timeSpent = Math.round((Date.now() - startTime) / 1000);

        return (
            <div className="min-h-screen flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
                <div className="max-w-lg w-full glass rounded-[3rem] p-12 text-center space-y-8 border-2 border-act-green/20">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Trophy size={200} className="text-act-green" />
                        </div>
                        <Sparkles size={60} className="text-act-green mx-auto mb-6 relative z-10 animate-pulse" />
                    </div>

                    <div>
                        <h2 className="text-4xl font-black text-white mb-2">Session Complete!</h2>
                        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Quick Review Finished</p>
                    </div>

                    <div className="grid grid-cols-3 gap-6 py-8">
                        <div className="space-y-2">
                            <p className="text-5xl font-black text-act-green">{correctCount}</p>
                            <p className="text-xs font-mono text-gray-500 uppercase">Correct</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black text-white">{words.length}</p>
                            <p className="text-xs font-mono text-gray-500 uppercase">Total</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black text-act-accent">{timeSpent}s</p>
                            <p className="text-xs font-mono text-gray-500 uppercase">Time</p>
                        </div>
                    </div>

                    <div className="p-6 bg-act-green/10 rounded-2xl border border-act-green/20">
                        <p className="text-2xl font-black text-act-green mb-2">{accuracy}% Accuracy</p>
                        <p className="text-sm text-gray-400 font-mono">
                            {accuracy >= 80 ? '🔥 Excellent work!' : accuracy >= 60 ? '👍 Good progress!' : '💪 Keep practicing!'}
                        </p>
                    </div>

                    <button
                        onClick={onBack}
                        className="w-full bg-white text-act-black font-black py-4 rounded-2xl uppercase font-mono tracking-widest text-sm hover:bg-act-accent hover:text-white transition-all"
                    >
                        Back to Lexicon
                    </button>
                </div>
            </div>
        );
    }

    const wordData = getWordData(currentWord);

    return (
        <div className="min-h-screen p-6 pt-20 pb-32">
            {/* Header */}
            <div className="max-w-md mx-auto mb-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-mono uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} />
                        Exit
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/10">
                        <Zap size={16} className="text-act-accent" />
                        <span className="text-xs font-mono font-bold text-white uppercase">Quick Review</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-gray-500 uppercase">
                        <span>{currentIndex} / {words.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-act-accent to-act-green transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Word Queue Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {words.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full transition-all ${i < currentIndex
                                    ? 'bg-act-green shadow-[0_0_5px_#00f294]'
                                    : i === currentIndex
                                        ? 'bg-act-accent w-4'
                                        : 'bg-white/10'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Swipeable Card */}
            <SwipeableCard
                word={currentWord}
                definition={wordData.definition}
                example={wordData.example}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
            />

            {/* Stats Footer */}
            <div className="max-w-md mx-auto mt-12 flex justify-center gap-8">
                <div className="text-center">
                    <p className="text-2xl font-black text-act-green">{correctCount}</p>
                    <p className="text-xs font-mono text-gray-600 uppercase">Correct</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-center">
                    <p className="text-2xl font-black text-white">{words.length - currentIndex}</p>
                    <p className="text-xs font-mono text-gray-600 uppercase">Remaining</p>
                </div>
            </div>
        </div>
    );
};
