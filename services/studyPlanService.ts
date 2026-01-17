import { getDueWords, getNewWords } from './vocabularyService';

export interface StudyPlan {
    period: 'intensive' | 'accelerated' | 'balanced' | 'relaxed';
    start_date: string;
    target_date: string;
    daily_goal: number;
    total_words: number;
    custom: {
        new_words_per_day: number;
        review_words_per_day: number;
    };
}

export interface StudyPeriodConfig {
    name: string;
    duration_days: number;
    new_words_per_day: number;
    review_words_per_day: number;
    total_daily: number;
    intervals: number[];
    description: string;
    emoji: string;
}

export const STUDY_PERIODS: Record<string, StudyPeriodConfig> = {
    intensive: {
        name: 'Intensive',
        duration_days: 14,
        new_words_per_day: 22,
        review_words_per_day: 18,
        total_daily: 40,
        intervals: [1, 2, 3, 5, 7],
        description: 'High-intensity crash course',
        emoji: '🔥'
    },
    accelerated: {
        name: 'Accelerated',
        duration_days: 30,
        new_words_per_day: 11,
        review_words_per_day: 12,
        total_daily: 23,
        intervals: [1, 2, 4, 7, 14],
        description: 'Fast-paced but sustainable',
        emoji: '⚡'
    },
    balanced: {
        name: 'Balanced',
        duration_days: 60,
        new_words_per_day: 6,
        review_words_per_day: 10,
        total_daily: 16,
        intervals: [1, 2, 4, 7, 14, 21],
        description: 'Optimal retention and pacing',
        emoji: '⚖️'
    },
    relaxed: {
        name: 'Relaxed',
        duration_days: 90,
        new_words_per_day: 4,
        review_words_per_day: 7,
        total_daily: 11,
        intervals: [1, 2, 4, 7, 14, 21, 30],
        description: 'Low-pressure deep learning',
        emoji: '🌱'
    }
};

/**
 * Calculate optimal study plan based on target date
 */
export const calculateStudyPlan = (
    targetDate: Date,
    totalWords: number = 300
): StudyPlan => {
    const today = new Date();
    const daysUntilTest = Math.ceil(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine period based on days available
    let period: keyof typeof STUDY_PERIODS;
    if (daysUntilTest <= 14) {
        period = 'intensive';
    } else if (daysUntilTest <= 30) {
        period = 'accelerated';
    } else if (daysUntilTest <= 60) {
        period = 'balanced';
    } else {
        period = 'relaxed';
    }

    const config = STUDY_PERIODS[period];

    return {
        period,
        start_date: today.toISOString(),
        target_date: targetDate.toISOString(),
        daily_goal: config.total_daily,
        total_words: totalWords,
        custom: {
            new_words_per_day: config.new_words_per_day,
            review_words_per_day: config.review_words_per_day
        }
    };
};

/**
 * Create study plan from manual period selection
 */
export const createStudyPlan = (
    period: keyof typeof STUDY_PERIODS,
    totalWords: number = 300
): StudyPlan => {
    const today = new Date();
    const config = STUDY_PERIODS[period];

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + config.duration_days);

    return {
        period,
        start_date: today.toISOString(),
        target_date: targetDate.toISOString(),
        daily_goal: config.total_daily,
        total_words: totalWords,
        custom: {
            new_words_per_day: config.new_words_per_day,
            review_words_per_day: config.review_words_per_day
        }
    };
};

/**
 * Get daily word mix based on study plan
 */
export const getDailyMixForPlan = async (
    userId: string,
    allWords: string[],
    studyPlan: StudyPlan
): Promise<string[]> => {
    const { new_words_per_day, review_words_per_day } = studyPlan.custom;

    // Get due words for review
    const dueWords = await getDueWords(userId, review_words_per_day);

    // Get new words to learn
    const newWords = await getNewWords(userId, allWords, new_words_per_day);

    // Combine and shuffle
    const allDailyWords = [...dueWords, ...newWords];
    return allDailyWords
        .map(w => ({ word: w, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(d => d.word);
};

/**
 * Calculate progress metrics for study plan
 */
export const calculateProgress = (
    studyPlan: StudyPlan,
    masteredWords: number
): {
    daysRemaining: number;
    daysElapsed: number;
    totalDays: number;
    percentComplete: number;
    expectedWords: number;
    onTrack: boolean;
    wordsPerDayNeeded: number;
} => {
    const today = new Date();
    const startDate = new Date(studyPlan.start_date);
    const targetDate = new Date(studyPlan.target_date);

    const totalDays = Math.ceil(
        (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysElapsed = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    const percentComplete = Math.round((masteredWords / studyPlan.total_words) * 100);

    // Expected words based on daily goal and days elapsed
    const expectedWords = Math.min(
        studyPlan.total_words,
        Math.floor(daysElapsed * studyPlan.custom.new_words_per_day)
    );

    // Check if on track (within 10% tolerance)
    const onTrack = masteredWords >= expectedWords * 0.9;

    // Calculate words per day needed to finish on time
    const wordsRemaining = studyPlan.total_words - masteredWords;
    const wordsPerDayNeeded = daysRemaining > 0
        ? Math.ceil(wordsRemaining / daysRemaining)
        : 0;

    return {
        daysRemaining,
        daysElapsed,
        totalDays,
        percentComplete,
        expectedWords,
        onTrack,
        wordsPerDayNeeded
    };
};

/**
 * Get review intervals for a study plan
 */
export const getIntervalsForPlan = (period: keyof typeof STUDY_PERIODS): number[] => {
    return STUDY_PERIODS[period].intervals;
};

/**
 * Check if study plan needs adjustment
 */
export const shouldAdjustPlan = (
    studyPlan: StudyPlan,
    masteredWords: number
): { shouldAdjust: boolean; reason: string; suggestedPeriod?: keyof typeof STUDY_PERIODS } => {
    const progress = calculateProgress(studyPlan, masteredWords);

    // If significantly behind schedule (< 70% of expected)
    if (masteredWords < progress.expectedWords * 0.7) {
        return {
            shouldAdjust: true,
            reason: `You're behind schedule. Consider switching to a longer study period.`,
            suggestedPeriod: getSuggestedLongerPeriod(studyPlan.period)
        };
    }

    // If way ahead of schedule (> 130% of expected)
    if (masteredWords > progress.expectedWords * 1.3) {
        return {
            shouldAdjust: true,
            reason: `You're ahead of schedule! You could switch to a shorter period.`,
            suggestedPeriod: getSuggestedShorterPeriod(studyPlan.period)
        };
    }

    return { shouldAdjust: false, reason: 'On track!' };
};

const getSuggestedLongerPeriod = (
    current: keyof typeof STUDY_PERIODS
): keyof typeof STUDY_PERIODS | undefined => {
    const order: (keyof typeof STUDY_PERIODS)[] = ['intensive', 'accelerated', 'balanced', 'relaxed'];
    const currentIndex = order.indexOf(current);
    return order[currentIndex + 1];
};

const getSuggestedShorterPeriod = (
    current: keyof typeof STUDY_PERIODS
): keyof typeof STUDY_PERIODS | undefined => {
    const order: (keyof typeof STUDY_PERIODS)[] = ['intensive', 'accelerated', 'balanced', 'relaxed'];
    const currentIndex = order.indexOf(current);
    return currentIndex > 0 ? order[currentIndex - 1] : undefined;
};
