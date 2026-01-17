import { initSupabase } from './supabaseClient';
import { generateBatchVocabDrills } from './geminiService';
import { DrillProblem } from '../types';

/**
 * Get cached drills for today, or generate and cache if not exists
 * This ensures we only call the API once per day for the same set of words
 */
export async function getDailyVocabDrills(
    userId: string,
    words: string[]
): Promise<Record<string, DrillProblem>> {
    const supabase = initSupabase();
    if (!supabase) {
        console.warn('Supabase not initialized, generating drills without cache');
        return generateBatchVocabDrills(words);
    }

    const today = new Date().toISOString().split('T')[0];

    // Try to get cached drills for today
    const { data: cachedDrills, error } = await supabase
        .from('vocabulary_drills')
        .select('word, drill_data')
        .eq('user_id', userId)
        .eq('generated_date', today)
        .in('word', words);

    if (error) {
        console.error('Error fetching cached drills:', error);
    }

    // Convert cached drills to map
    const drillsMap: Record<string, DrillProblem> = {};
    const cachedWords = new Set<string>();

    if (cachedDrills) {
        for (const cached of cachedDrills) {
            drillsMap[cached.word.toLowerCase()] = cached.drill_data as DrillProblem;
            cachedWords.add(cached.word.toLowerCase());
        }
    }

    // Find words that need to be generated
    const wordsToGenerate = words.filter(w => !cachedWords.has(w.toLowerCase()));

    if (wordsToGenerate.length > 0) {
        console.log(`📝 Generating drills for ${wordsToGenerate.length} new words...`);

        // Generate drills for missing words
        const newDrills = await generateBatchVocabDrills(wordsToGenerate);

        // Cache the newly generated drills
        const drillsToInsert = Object.entries(newDrills).map(([word, drill]) => ({
            user_id: userId,
            word: word,
            drill_data: drill,
            generated_date: today
        }));

        if (drillsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('vocabulary_drills')
                .insert(drillsToInsert);

            if (insertError) {
                console.error('Error caching drills:', insertError);
            } else {
                console.log(`✅ Cached ${drillsToInsert.length} new drills`);
            }
        }

        // Merge new drills with cached drills
        Object.assign(drillsMap, newDrills);
    } else {
        console.log(`✅ Using ${cachedDrills?.length || 0} cached drills (no API call needed!)`);
    }

    return drillsMap;
}

/**
 * Get a single cached drill for a word
 * Returns null if not cached for today
 */
export async function getCachedDrill(
    userId: string,
    word: string
): Promise<DrillProblem | null> {
    const supabase = initSupabase();
    if (!supabase) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('vocabulary_drills')
        .select('drill_data')
        .eq('user_id', userId)
        .eq('word', word.toLowerCase())
        .eq('generated_date', today)
        .maybeSingle();

    if (error || !data) return null;

    return data.drill_data as DrillProblem;
}

/**
 * Manually clear cached drills for a user
 * Useful for testing or if user wants fresh drills
 */
export async function clearDrillCache(userId: string): Promise<void> {
    const supabase = initSupabase();
    if (!supabase) return;

    const { error } = await supabase
        .from('vocabulary_drills')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Error clearing drill cache:', error);
    } else {
        console.log('✅ Drill cache cleared');
    }
}

/**
 * Get cache statistics for a user
 */
export async function getDrillCacheStats(userId: string): Promise<{
    totalCached: number;
    cachedToday: number;
    oldestDate: string | null;
}> {
    const supabase = initSupabase();
    if (!supabase) {
        return { totalCached: 0, cachedToday: 0, oldestDate: null };
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: allDrills } = await supabase
        .from('vocabulary_drills')
        .select('generated_date')
        .eq('user_id', userId);

    const { data: todayDrills } = await supabase
        .from('vocabulary_drills')
        .select('id')
        .eq('user_id', userId)
        .eq('generated_date', today);

    const dates = allDrills?.map(d => d.generated_date).sort() || [];

    return {
        totalCached: allDrills?.length || 0,
        cachedToday: todayDrills?.length || 0,
        oldestDate: dates.length > 0 ? dates[0] : null
    };
}
