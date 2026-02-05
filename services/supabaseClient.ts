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

export const submitGameScore = async (playerName: string, score: number, prompt: string, response: string) => {
    // We use the RPC function we created in the database for atomic 'top 10' logic
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
        console.error('Error submitting scores:', globalError || dailyError);
        // Fallback to simple insert if RPC fails (though we want the atomic logic)
    }
};
