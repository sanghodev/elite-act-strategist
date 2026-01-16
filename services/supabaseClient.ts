
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, HistoryItem } from '../types';

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

// Fallback defaults (for backward compatibility)
const FALLBACK_PROJECT_URL = 'https://mehofiukedhljrpfgtks.supabase.co';
const FALLBACK_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1laG9maXVrZWRobGpycGZndGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTM3NjIsImV4cCI6MjA4NDAyOTc2Mn0.66vDv46R44muWG4O43qxComyYshXRT7Rk6msaqQEbRc';

export const getSupabaseConfig = () => {
    // Priority: Environment variables > LocalStorage > Fallback defaults
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const url = (envUrl || localStorage.getItem('act_sb_url') || FALLBACK_PROJECT_URL).trim();
    const key = (envKey || localStorage.getItem('act_sb_key') || FALLBACK_API_KEY).trim();
    return { url, key };
};

export const initSupabase = (customUrl?: string, customKey?: string): SupabaseClient | null => {
    const { url, key } = customUrl && customKey ? { url: customUrl, key: customKey } : getSupabaseConfig();

    if (!url || !key || !url.startsWith('http')) {
        return null;
    }

    if (supabaseInstance && url === lastUsedUrl && key === lastUsedKey) {
        return supabaseInstance;
    }

    try {
        supabaseInstance = createClient(url, key, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
                storage: window.localStorage
            }
        });
        lastUsedUrl = url;
        lastUsedKey = key;
        return supabaseInstance;
    } catch (e) {
        console.error("Supabase Initialization Error:", e);
        return null;
    }
};

export const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
    try {
        const testClient = createClient(url.trim(), key.trim(), { auth: { persistSession: false } });
        const { error } = await testClient.from('users').select('id').limit(1);
        if (error) return { success: false, message: error.message };
        return { success: true, message: "Connection Established." };
    } catch (e: any) {
        return { success: false, message: e.message || "Unknown Connection Error" };
    }
};

// Search by Name column (case-insensitive) to ensure unique identity mapping
export const getUserByCallsign = async (name: string): Promise<User | null> => {
    const supabase = initSupabase();
    if (!supabase) return null;
    const cleanName = name.trim();
    try {
        // We search by the 'name' column to find legacy agent_ IDs OR name-based IDs.
        // We order by created_at to ensure we pick the first/original account if duplicates exist.
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .ilike('name', cleanName)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            targetScore: data.target_score,
            preferences: data.preferences,
            vocabData: data.vocab_data // Load the persisted vocab progress
        };
    } catch {
        return null;
    }
};

export const syncUser = async (user: User) => {
    const supabase = initSupabase();
    if (!supabase) return;
    try {
        await supabase.from('users').upsert({
            id: user.id,
            name: user.name,
            target_score: user.targetScore,
            preferences: user.preferences,
            vocab_data: user.vocabData // Persist vocabulary progress
        });
    } catch (e) {
        console.error("Sync User Failed:", e);
    }
};

export const syncHistoryItem = async (userId: string, item: HistoryItem) => {
    const supabase = initSupabase();
    if (!supabase) return;
    try {
        await supabase.from('history').upsert({
            id: item.id,
            user_id: userId,
            timestamp: item.timestamp,
            data: item
        });
    } catch (e) {
        console.error("Sync History Failed:", e);
    }
};

export const pullHistory = async (userId: string): Promise<HistoryItem[]> => {
    const supabase = initSupabase();
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('history')
            .select('data')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
        if (error) return [];
        return data ? data.map(d => d.data) : [];
    } catch {
        return [];
    }
};

export const wipeCloudHistory = async (userId: string) => {
    const supabase = initSupabase();
    if (!supabase) return;
    try {
        await supabase.from('history').delete().eq('user_id', userId);
    } catch (e) {
        console.error("Wipe failed:", e);
    }
};
