import { initSupabase } from './supabaseClient';

// Initialize supabase client
const supabase = initSupabase();

export interface WordProgress {
    id: string;
    user_id: string;
    word: string;
    ease_factor: number;
    interval: number;
    next_review_date: string;
    review_count: number;
    correct_count: number;
    last_reviewed_at: string | null;
    status: 'learning' | 'reviewing' | 'mastered';
    created_at: string;
    updated_at: string;
}

/**
 * Get words due for review today
 */
export const getDueWords = async (userId: string, limit: number = 10): Promise<string[]> => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('vocabulary_progress')
        .select('word')
        .eq('user_id', userId)
        .lte('next_review_date', today)
        .in('status', ['learning', 'reviewing'])
        .order('next_review_date', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching due words:', error);
        return [];
    }

    return data?.map(d => d.word) || [];
};

/**
 * Get random previously learned words for refresh
 */
export const getRandomLearnedWords = async (userId: string, limit: number = 3): Promise<string[]> => {
    const { data, error } = await supabase
        .from('vocabulary_progress')
        .select('word')
        .eq('user_id', userId)
        .in('status', ['reviewing', 'mastered'])
        .limit(100); // Get pool of learned words

    if (error || !data || data.length === 0) {
        return [];
    }

    // Randomly shuffle and take limit
    const shuffled = data
        .map(d => ({ word: d.word, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .slice(0, limit)
        .map(d => d.word);

    return shuffled;
};

/**
 * Get new words that haven't been learned yet
 */
export const getNewWords = async (
    userId: string,
    allWords: string[],
    limit: number = 3
): Promise<string[]> => {
    // Get all words user has progress on
    const { data, error } = await supabase
        .from('vocabulary_progress')
        .select('word')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching learned words:', error);
        return allWords.slice(0, limit);
    }

    const learnedWords = new Set(data?.map(d => d.word) || []);
    const newWords = allWords.filter(w => !learnedWords.has(w));

    // Randomly select from new words
    return newWords
        .map(w => ({ word: w, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .slice(0, limit)
        .map(d => d.word);
};

/**
 * Get word progress for a specific word
 */
export const getWordProgress = async (
    userId: string,
    word: string
): Promise<WordProgress | null> => {
    const { data, error } = await supabase
        .from('vocabulary_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('word', word)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No record found - this is expected for new words
            return null;
        }
        console.error('Error fetching word progress:', error);
        return null;
    }

    return data;
};

/**
 * Calculate next review interval using SM-2 algorithm
 * Optionally accepts custom intervals from study plan
 */
export const calculateNextReview = (
    currentInterval: number,
    easeFactor: number,
    isCorrect: boolean,
    customIntervals?: number[]
): { interval: number; easeFactor: number } => {
    let newEaseFactor = easeFactor;
    let newInterval = currentInterval;

    if (isCorrect) {
        if (customIntervals) {
            // Use study plan-specific intervals
            const currentIndex = customIntervals.indexOf(currentInterval);
            if (currentIndex >= 0 && currentIndex < customIntervals.length - 1) {
                newInterval = customIntervals[currentIndex + 1];
            } else if (currentIndex === customIntervals.length - 1) {
                // At max interval, stay there
                newInterval = customIntervals[currentIndex];
            } else {
                // Not in sequence, start from beginning
                newInterval = customIntervals[0];
            }
        } else {
            // Default SM-2 intervals
            if (currentInterval === 1) {
                newInterval = 2;
            } else if (currentInterval === 2) {
                newInterval = 4;
            } else {
                newInterval = Math.ceil(currentInterval * easeFactor);
            }
        }

        // Slightly increase ease factor (make it easier)
        newEaseFactor = Math.min(3.0, easeFactor + 0.1);
    } else {
        // Reset to beginning
        newInterval = customIntervals ? customIntervals[0] : 1;

        // Decrease ease factor (make it harder)
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
    }

    return { interval: newInterval, easeFactor: newEaseFactor };
};

/**
 * Record a review and update word progress
 */
export const recordReview = async (
    userId: string,
    word: string,
    isCorrect: boolean
): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];

    // Get current progress
    let progress = await getWordProgress(userId, word);

    if (!progress) {
        // First time seeing this word - create new record
        const { interval, easeFactor } = calculateNextReview(1, 2.5, isCorrect);
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);

        const { error } = await supabase
            .from('vocabulary_progress')
            .insert({
                user_id: userId,
                word,
                ease_factor: easeFactor,
                interval,
                next_review_date: nextReviewDate.toISOString().split('T')[0],
                review_count: 1,
                correct_count: isCorrect ? 1 : 0,
                last_reviewed_at: new Date().toISOString(),
                status: 'learning'
            });

        if (error) {
            console.error('Error creating word progress:', error);
        }
        return;
    }

    // Update existing record
    const { interval, easeFactor } = calculateNextReview(
        progress.interval,
        progress.ease_factor,
        isCorrect
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Determine status
    let status: 'learning' | 'reviewing' | 'mastered' = 'learning';
    const newCorrectCount = progress.correct_count + (isCorrect ? 1 : 0);
    const newReviewCount = progress.review_count + 1;

    if (newCorrectCount >= 5 && interval >= 14) {
        status = 'mastered';
    } else if (newReviewCount >= 2) {
        status = 'reviewing';
    }

    const { error } = await supabase
        .from('vocabulary_progress')
        .update({
            ease_factor: easeFactor,
            interval,
            next_review_date: nextReviewDate.toISOString().split('T')[0],
            review_count: newReviewCount,
            correct_count: newCorrectCount,
            last_reviewed_at: new Date().toISOString(),
            status
        })
        .eq('user_id', userId)
        .eq('word', word);

    if (error) {
        console.error('Error updating word progress:', error);
    }
};

/**
 * Get vocabulary statistics for a user
 */
export const getVocabularyStats = async (userId: string) => {
    const { data, error } = await supabase
        .from('vocabulary_progress')
        .select('status, review_count, correct_count')
        .eq('user_id', userId);

    if (error || !data) {
        return {
            total: 0,
            learning: 0,
            reviewing: 0,
            mastered: 0,
            totalReviews: 0,
            accuracy: 0
        };
    }

    const stats = {
        total: data.length,
        learning: data.filter(d => d.status === 'learning').length,
        reviewing: data.filter(d => d.status === 'reviewing').length,
        mastered: data.filter(d => d.status === 'mastered').length,
        totalReviews: data.reduce((sum, d) => sum + d.review_count, 0),
        accuracy: 0
    };

    const totalCorrect = data.reduce((sum, d) => sum + d.correct_count, 0);
    if (stats.totalReviews > 0) {
        stats.accuracy = Math.round((totalCorrect / stats.totalReviews) * 100);
    }

    return stats;
};

/**
 * Get smart daily word mix (due + refresh + new)
 */
export const getDailyWordMix = async (
    userId: string,
    allWords: string[],
    targetCount: number = 10
): Promise<string[]> => {
    // Get words due for review (40% of target)
    const dueCount = Math.ceil(targetCount * 0.4);
    const dueWords = await getDueWords(userId, dueCount);

    // Get random learned words for refresh (30% of target)
    const refreshCount = Math.ceil(targetCount * 0.3);
    const refreshWords = await getRandomLearnedWords(userId, refreshCount);

    // Get new words (remaining)
    const newCount = targetCount - dueWords.length - refreshWords.length;
    const newWords = await getNewWords(userId, allWords, Math.max(1, newCount));

    // Combine and shuffle
    const allDailyWords = [...dueWords, ...refreshWords, ...newWords];
    return allDailyWords
        .map(w => ({ word: w, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(d => d.word)
        .slice(0, targetCount);
};
