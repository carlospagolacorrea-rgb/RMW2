
export enum GameMode {
  HOME = 'HOME',
  DAILY = 'DAILY',
  MULTIPLAYER_SETUP = 'MULTIPLAYER_SETUP',
  MULTIPLAYER_GAME = 'MULTIPLAYER_GAME',
  MULTIPLAYER_RESULTS = 'MULTIPLAYER_RESULTS',
  DAILY_RANKING = 'DAILY_RANKING',
  GLOBAL_RANKING = 'GLOBAL_RANKING',
  USER_HISTORY = 'USER_HISTORY',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  CONTACT = 'CONTACT',
  METHODOLOGY = 'METHODOLOGY',
  FAQ = 'FAQ'
}

export interface Player {
  id: string;
  name: string;
  word?: string;
  score?: number;
  totalScore: number;
  comment?: string;
}

export interface ScoreCache {
  [key: string]: {
    score: number;
    comment: string;
  };
}

export interface DailyResult {
  prompt: string;
  response: string;
  score: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  player_name: string;
  prompt: string;
  response: string;
  score: number;
}
