import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RankingEntry {
    player_name: string;
    score: number;
    prompt: string;
    response: string;
    created_at?: string;
}

export interface UserProfile {
    id: string;
    username: string;
    updated_at: string;
}

export interface UserPlay {
    id: string;
    user_id: string;
    prompt: string;
    response: string;
    score: number;
    comment: string;
    created_at: string;
}

export const getGlobalRankings = async (): Promise<RankingEntry[]> => {
    const { data, error } = await supabase
        .from('global_ranking')
        .select('player_name, score, prompt, response, created_at')
        .order('score', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching global rankings:', error);
        return [];
    }
    return data || [];
};

export const getDailyRankings = async (): Promise<RankingEntry[]> => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('daily_ranking')
        .select('player_name, score, prompt, response, created_at')
        .gte('created_at', today)
        .order('score', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching daily rankings:', error);
        return [];
    }
    return data || [];
};

export const saveUserPlay = async (userId: string, prompt: string, response: string, score: number, comment: string = '') => {
    const { error: playError } = await supabase
        .from('user_plays')
        .insert({
            user_id: userId,
            prompt,
            response,
            score,
            comment
        });

    if (playError) {
        console.error('Error saving personal play:', playError);
    }
};

export const submitGameScore = async (playerName: string, score: number, prompt: string, response: string, userId?: string) => {
    // 1. Submit to rankings (Public/Global)
    const { error: globalError } = await supabase.rpc('submit_score', {
        t_name: 'global_ranking',
        p_name: playerName,
        p_score: score,
        p_prompt: prompt,
        p_response: response
    });

    const { error: dailyError } = await supabase.rpc('submit_score', {
        t_name: 'daily_ranking',
        p_name: playerName,
        p_score: score,
        p_prompt: prompt,
        p_response: response
    });

    if (globalError || dailyError) {
        console.error('Error submitting scores to rankings:', globalError || dailyError);
    }

    // Note: User play history is now handled separately by saveUserPlay
};

export const getUserPlays = async (userId: string): Promise<UserPlay[]> => {
    const { data, error } = await supabase
        .from('user_plays')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user plays:', error);
        return [];
    }
    return data || [];
};

export const getUserStats = async (userId: string): Promise<{ total: number, recent: UserPlay[] }> => {
    // 1. Get total count
    const { count, error: countError } = await supabase
        .from('user_plays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) {
        console.error('Error fetching user stats count:', countError);
    }

    // 2. Get last 20 plays
    const { data, error: dataError } = await supabase
        .from('user_plays')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (dataError) {
        console.error('Error fetching user stats data:', dataError);
    }

    return {
        total: count || 0,
        recent: data || []
    };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
};

// --- Global Cache Functions ---

export const checkGlobalCache = async (prompt: string, response: string): Promise<{ score: number, comment: string } | null> => {
    // Normalize inputs for lookup (assuming case-insensitive logic, but exact match on DB)
    // Ideally DB should handle CI, but let's be consistent.
    // The prompt comes from the system (UPPERCASE usually), response from user (any case).
    // Let's rely on the DB storing them as accepted.

    const { data, error } = await supabase
        .from('daily_cache')
        .select('score, comment')
        .eq('prompt', prompt)
        .eq('response', response) // The user response might be case sensitive in meaning, but usually not.
        .single(); // Assuming unique constraint or just taking one

    if (error) {
        // If row not found, it returns an error with code 'PGRST116' (JSON object empty) or similar.
        // We just return null to indicate miss.
        return null;
    }

    return data;
};

export const saveToGlobalCache = async (prompt: string, response: string, score: number, comment: string) => {
    const { error } = await supabase
        .from('daily_cache')
        .insert({
            prompt,
            response,
            score,
            comment
        });

    if (error) {
        console.error('Error saving to global cache:', error);
    }
};

export const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
};

export const signInWithFacebook = async () => {
    return await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
            redirectTo: window.location.origin
        }
    });
};
