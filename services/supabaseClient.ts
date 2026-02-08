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

export const getRankFromScore = (totalScore: number): string => {
    if (totalScore < 50) return 'NPC GENÉRICO';
    if (totalScore < 200) return 'BOT IDIOTA';
    if (totalScore < 500) return 'HUMANO SIN GRACIA';
    if (totalScore < 1000) return 'PENSAWORD';
    if (totalScore < 2000) return 'HACKER DE LA SEMÁNTICA';
    if (totalScore < 5000) return 'ARQUITECTO DEL CONCEPTO';
    return 'SINGULARIDAD';
};

export const getUserStats = async (userId: string): Promise<{ total: number, recent: UserPlay[], totalScore: number, rank: string, streak: number }> => {
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

    // 3. Calculate total score from all plays
    const { data: allPlays, error: scoreError } = await supabase
        .from('user_plays')
        .select('score')
        .eq('user_id', userId);

    if (scoreError) {
        console.error('Error fetching user scores:', scoreError);
    }

    const totalScore = allPlays?.reduce((sum, play) => sum + play.score, 0) || 0;
    const rank = getRankFromScore(totalScore);

    // 4. Calculate streak (consecutive days with at least one play)
    const { data: allPlaysWithDates, error: datesError } = await supabase
        .from('user_plays')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (datesError) {
        console.error('Error fetching play dates:', datesError);
    }

    let streak = 0;
    if (allPlaysWithDates && allPlaysWithDates.length > 0) {
        // Get unique dates (YYYY-MM-DD format)
        const uniqueDates = [...new Set(
            allPlaysWithDates.map(play => new Date(play.created_at).toISOString().split('T')[0])
        )].sort().reverse(); // Most recent first

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Streak must start today or yesterday
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            streak = 1;
            let expectedDate = new Date(uniqueDates[0]);

            for (let i = 1; i < uniqueDates.length; i++) {
                expectedDate.setDate(expectedDate.getDate() - 1);
                const expectedDateStr = expectedDate.toISOString().split('T')[0];

                if (uniqueDates[i] === expectedDateStr) {
                    streak++;
                } else {
                    break; // Streak broken
                }
            }
        }
    }

    return {
        total: count || 0,
        recent: data || [],
        totalScore,
        rank,
        streak
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
