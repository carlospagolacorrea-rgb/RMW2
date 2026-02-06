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

    // 2. If user is logged in, submit to their personal history
    if (userId) {
        const { error: playError } = await supabase
            .from('user_plays')
            .insert({
                user_id: userId,
                prompt,
                response,
                score,
                comment: '' // Will be updated if the comment is available in the context
            });

        if (playError) {
            console.error('Error submitting personal play:', playError);
        }
    }
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
