
import React, { useState, useEffect } from 'react';
import { GameMode, Player, ScoreCache, LeaderboardEntry } from './types';
import { getDailyPrompts, getWordScore, generateCreativePrompt, getNextRotationTime } from './services/geminiService';
import { getGlobalRankings, getDailyRankings, submitGameScore, RankingEntry } from './services/supabaseClient';

// --- Retro UI Components ---

const RetroBox: React.FC<{ letter: string; size?: 'sm' | 'md' | 'lg'; customClass?: string }> = ({ letter, size = 'md', customClass }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xl',
    md: 'w-12 h-12 text-3xl',
    lg: 'w-16 h-16 text-5xl md:w-20 md:h-20 md:text-6xl'
  };
  return (
    <div className={`retro-box ${customClass || sizes[size]} relative`}>
      {letter}
    </div>
  );
};

const WordBoard: React.FC<{ word: string; size?: 'sm' | 'md' | 'lg' }> = ({ word, size = 'md' }) => {
  let customClass = undefined;

  // Ajuste dinámico de tamaño para móviles si la palabra es larga y el tamaño solicitado es grande
  if (size === 'lg') {
    const len = word.length;
    if (len > 8) {
      // Muy larga (>8): muy pequeña en móvil
      customClass = 'w-8 h-8 text-xl md:w-20 md:h-20 md:text-6xl';
    } else if (len > 6) {
      // Larga (7-8): pequeña en móvil
      customClass = 'w-10 h-10 text-2xl md:w-20 md:h-20 md:text-6xl';
    } else if (len > 5) {
      // Media (6): mediana en móvil
      customClass = 'w-12 h-12 text-3xl md:w-20 md:h-20 md:text-6xl';
    }
    // <= 5: usa el defecto lg (w-16)
  }

  return (
    <div className="flex flex-wrap justify-center gap-1 md:gap-2">
      {word.split('').map((l, i) => (
        <RetroBox key={i} letter={l} size={size} customClass={customClass} />
      ))}
    </div>
  );
};

export const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.HOME);
  const timeLeft = useCountdown();
  const [userNick, setUserNick] = useState<string>(localStorage.getItem('rankMyWord_nick') || '');
  const [dailyPrompts, setDailyPrompts] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [multiplayerPrompt, setMultiplayerPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoreCache, setScoreCache] = useState<ScoreCache>(() => {
    const saved = localStorage.getItem('rankMyWord_cache');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('rankMyWord_cache', JSON.stringify(scoreCache));
  }, [scoreCache]);

  useEffect(() => {
    setDailyPrompts(getDailyPrompts());
  }, []);

  const handleRegister = (nick: string) => {
    if (!nick.trim()) return;
    setUserNick(nick);
    localStorage.setItem('rankMyWord_nick', nick);
  };

  const getCachedScore = async (prompt: string, response: string) => {
    const key = `${prompt.toLowerCase()}_${response.toLowerCase()}`;
    if (scoreCache[key]) return scoreCache[key];
    setLoading(true);
    const result = await getWordScore(prompt, response);
    setScoreCache(prev => ({ ...prev, [key]: result }));
    setLoading(false);
    return result;
  };

  const startMultiplayerGame = async (playerNames: string[]) => {
    setLoading(true);
    // Init totalScore to 0
    const newPlayers = playerNames.map((name, i) => ({ id: String(i), name, totalScore: 0 }));
    setPlayers(newPlayers);
    const freshWord = await generateCreativePrompt();
    setMultiplayerPrompt(freshWord);
    setLoading(false);
    setMode(GameMode.MULTIPLAYER_GAME);
    setCurrentPlayerIndex(0);
  };

  const restartMultiplayerGame = async () => {
    setLoading(true);
    // Keep totalScore, reset current round fields
    const resetPlayers = players.map(p => ({ ...p, word: undefined, score: undefined, comment: undefined }));
    setPlayers(resetPlayers);
    const freshWord = await generateCreativePrompt();
    setMultiplayerPrompt(freshWord);
    setLoading(false);
    setMode(GameMode.MULTIPLAYER_GAME);
    setCurrentPlayerIndex(0);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 max-w-4xl mx-auto py-10">
      <div className="retro-line"></div>

      <header className="w-full flex flex-col items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => setMode(GameMode.HOME)}>
          <div className="absolute -top-12 -left-12 opacity-80 hidden md:block">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="40" r="20" />
              <path d="M30 70 Q50 40 70 70" stroke="currentColor" strokeWidth="4" fill="none" />
              <rect x="35" y="35" width="5" height="5" />
              <rect x="60" y="35" width="5" height="5" />
            </svg>
          </div>
          <WordBoard word="RANKMYWORD" size="sm" />
        </div>
        <h2 className="font-['Bebas_Neue'] text-xl tracking-[0.5em] opacity-60 uppercase">
          {mode === GameMode.HOME ? 'HUMANS VS AI' : mode.replace('_', ' ')}
        </h2>
      </header>

      <div className="retro-line"></div>

      <main className="w-full flex-1">
        {mode === GameMode.HOME && (
          <div className="flex flex-col gap-8 py-10 items-center">
            <div className="text-center space-y-6 mb-4 max-w-2xl">
              <h3 className="font-['Bebas_Neue'] text-6xl md:text-7xl tracking-widest uppercase text-amber-500 drop-shadow-[0_0_15px_rgba(255,188,71,0.3)]">DOMINA EL RANKING</h3>
              <p className="crt-text text-xs md:text-sm opacity-80 leading-relaxed text-center">
                CADA 4 HORAS SURGEN 3 NUEVAS PALABRAS. TU OBJETIVO ES RESPONDER CON UN TÉRMINO QUE ESTÉ EN EL PUNTO EXACTO ENTRE LO OBVIO Y LO ABSURDO. CONSIGUE LA MÁXIMA PUNTUACIÓN Y DOMINA EL RANKING MUNDIAL O COMPITE CON AMIGOS EN EL MODO LOCAL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <button onClick={() => setMode(GameMode.DAILY)} className="retro-button py-6 px-10 flex flex-col items-center justify-center gap-1 group">
                <span className="text-xl md:text-2xl font-black">Reto Diario</span>
                <span className="crt-text text-sm md:text-base font-black opacity-90 transition-opacity tracking-widest text-black">
                  SIGUIENTE EN {timeLeft || '00:00:00'}
                </span>
              </button>
              <button onClick={() => setMode(GameMode.MULTIPLAYER_SETUP)} className="retro-button py-6 px-10">Duelo Local</button>
              <button onClick={() => setMode(GameMode.DAILY_RANKING)} className="retro-button py-4 px-10 text-lg">Ranking Diario</button>
              <button onClick={() => setMode(GameMode.GLOBAL_RANKING)} className="retro-button py-4 px-10 text-lg">Ranking Global</button>
            </div>
          </div>
        )}

        {mode === GameMode.DAILY && (
          <DailyMode
            prompts={dailyPrompts}
            userNick={userNick}
            onRegister={handleRegister}
            getCachedScore={getCachedScore}
            onExit={() => setMode(GameMode.HOME)}
          />
        )}

        {(mode === GameMode.DAILY_RANKING || mode === GameMode.GLOBAL_RANKING) && (
          <RankingView
            type={mode === GameMode.DAILY_RANKING ? 'DIARIO' : 'GLOBAL'}
            onBack={() => setMode(GameMode.HOME)}
          />
        )}

        {mode === GameMode.MULTIPLAYER_SETUP && (
          <MultiplayerSetup
            onStart={startMultiplayerGame}
            loading={loading}
          />
        )}

        {mode === GameMode.MULTIPLAYER_GAME && (
          <MultiplayerGame
            key={currentPlayerIndex}
            prompt={multiplayerPrompt}
            currentPlayer={players[currentPlayerIndex]}
            playerIndex={currentPlayerIndex}
            totalPlayers={players.length}
            loading={loading}
            onSubmit={async (word) => {
              const updated = [...players];
              updated[currentPlayerIndex].word = word;
              setPlayers(updated);
              if (currentPlayerIndex < players.length - 1) {
                setCurrentPlayerIndex(prev => prev + 1);
              } else {
                setLoading(true);
                const scored = await Promise.all(updated.map(async p => {
                  const res = await getCachedScore(multiplayerPrompt, p.word!);
                  return {
                    ...p,
                    score: res.score,
                    comment: res.comment,
                    totalScore: (p.totalScore || 0) + res.score // Accumulate score
                  };
                }));
                // Sort by current round score for suspenseful reveal
                setPlayers(scored.sort((a, b) => (a.score || 0) - (b.score || 0)));
                setLoading(false);
                setMode(GameMode.MULTIPLAYER_RESULTS);
              }
            }}
          />
        )}

        {mode === GameMode.MULTIPLAYER_RESULTS && (
          <MultiplayerResults
            players={players}
            prompt={multiplayerPrompt}
            onFinish={() => setMode(GameMode.HOME)}
            onRestart={restartMultiplayerGame}
            loading={loading}
          />
        )}
      </main>

      <div className="retro-line"></div>

      <footer className="w-full text-center pb-10">
        <span className="crt-text text-[10px] opacity-40 animate-blink uppercase">Estado: {loading ? 'Pensando...' : 'Listo'}</span>
      </footer>
    </div>
  );
};

// --- Hooks ---

const useCountdown = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const next = getNextRotationTime();
      const diff = next.getTime() - new Date().getTime();

      if (diff <= 0) {
        window.location.reload();
        return;
      }

      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

      setTimeLeft(`${h}:${m}:${s}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
};

// --- Sub-components ---

const ResultDisplay: React.FC<{ score: number, comment: string, userWord: string, playerName?: string, totalScore?: number }> = ({ score, comment, userWord, playerName, totalScore }) => (
  <div className="w-full flex flex-col items-center gap-6 animate-drop">
    <div className="flex flex-col items-center gap-1">
      {playerName && <span className="font-['Bebas_Neue'] text-amber-500 tracking-widest text-xl opacity-70 uppercase">JUGADOR: {playerName}</span>}
      <h4 className="font-['Bebas_Neue'] text-6xl md:text-8xl text-white tracking-widest uppercase mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] text-center px-4">
        "{userWord}"
      </h4>
    </div>

    <div className="w-full flex flex-col md:flex-row items-center gap-8 md:gap-12 py-10 px-6 md:px-12 bg-black/95 border-2 border-amber-500 shadow-[0_0_40px_rgba(255,188,71,0.15)] relative">
      <div className="flex flex-col items-center gap-4 shrink-0">
        <div className="w-44 h-44 md:w-60 md:h-60 border-4 border-amber-500 flex items-center justify-center bg-black relative shadow-[0_0_20px_rgba(255,188,71,0.3)] overflow-hidden">
          <span className="text-4xl md:text-6xl font-bold tracking-tighter text-amber-500 drop-shadow-[0_0_12px_rgba(255,188,71,0.5)] whitespace-nowrap px-4">
            {score.toFixed(3)}
          </span>
        </div>
        <span className="crt-text text-sm md:text-md tracking-[0.5em] opacity-80 font-bold uppercase">RONDA</span>

        {totalScore !== undefined && (
          <div className="mt-2 flex flex-col items-center">
            <span className="font-['Bebas_Neue'] text-2xl text-white opacity-80">{totalScore.toFixed(3)}</span>
            <span className="crt-text text-[10px] opacity-60 uppercase tracking-wider">ACUMULADO</span>
          </div>
        )}
      </div>

      <div className="hidden md:block w-[2px] h-60 bg-amber-500/40"></div>
      <div className="block md:hidden w-full h-[2px] bg-amber-500/40"></div>

      <div className="flex-1 w-full">
        <p className="crt-text text-2xl md:text-4xl leading-snug md:leading-tight opacity-100 uppercase tracking-tight text-center md:text-left font-medium">
          "{comment}"
        </p>
      </div>
    </div>
  </div>
);

const DailyMode: React.FC<{
  prompts: string[];
  userNick: string;
  onRegister: (nick: string) => void;
  getCachedScore: (p: string, r: string) => Promise<{ score: number, comment: string }>;
  onExit: () => void;
}> = ({ prompts, userNick, onRegister, getCachedScore, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [result, setResult] = useState<{ score: number, comment: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNickInput, setShowNickInput] = useState(false);
  const [tempNick, setTempNick] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const currentPrompt = prompts[currentIndex];

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setIsLoading(true);
    const res = await getCachedScore(currentPrompt, response);
    setResult(res);
    setIsLoading(false);
  };

  const handleSaveScore = async (nick: string) => {
    if (!nick.trim() || !result) return;
    setIsLoading(true);
    await submitGameScore(nick, result.score, currentPrompt, response);
    onRegister(nick);
    setHasSubmitted(true);
    setShowNickInput(false);
    setIsLoading(false);
  };

  const handleNext = () => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setResponse('');
      setResult(null);
      setHasSubmitted(false);
    } else {
      onExit();
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 py-6">
      <div className="text-center w-full">
        <div className="flex justify-between items-center mb-6 px-2 opacity-40 crt-text text-[10px]">
          <span>PALABRA {currentIndex + 1} DE {prompts.length}</span>
        </div>
        <WordBoard word={currentPrompt} size="lg" />
      </div>

      {!result ? (
        <div className="flex flex-col w-full max-w-md gap-6 animate-drop">
          <input
            autoFocus
            type="text"
            placeholder="ESCRIBE TU ASOCIACIÓN..."
            value={response}
            onChange={e => setResponse(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="retro-input w-full py-4 text-3xl"
          />
          <button onClick={handleSubmit} disabled={isLoading || !response.trim()} className="retro-button py-4 text-2xl uppercase">
            {isLoading ? 'EVALUANDO...' : 'ENVIAR'}
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-8 items-center animate-drop">
          <ResultDisplay score={result.score} comment={result.comment} userWord={response} playerName={userNick || undefined} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <button onClick={() => { setResult(null); setResponse(''); setHasSubmitted(false); }} className="retro-button py-3 text-sm opacity-80 uppercase">REINTENTAR</button>
            <button
              disabled={hasSubmitted}
              onClick={() => setShowNickInput(true)}
              className={`retro-button py-3 text-sm uppercase ${hasSubmitted ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {hasSubmitted ? 'PUNTUACIÓN GUARDADA' : 'GUARDAR PUNTUACIÓN'}
            </button>
            <button onClick={handleNext} className="retro-button py-3 text-sm font-bold uppercase">SIGUIENTE</button>
          </div>

          {showNickInput && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="flex flex-col w-full max-w-sm gap-6 border-2 border-amber-500 p-8 bg-black shadow-[0_0_50px_rgba(255,188,71,0.2)] animate-drop relative">
                <h3 className="font-['Bebas_Neue'] text-3xl tracking-[0.2em] text-center uppercase text-amber-500 mb-2">IDENTIFÍCATE</h3>

                <input
                  autoFocus
                  type="text"
                  value={tempNick}
                  onChange={e => setTempNick(e.target.value)}
                  placeholder="APODO"
                  className="retro-input py-3 text-2xl w-full bg-transparent focus:shadow-[0_0_15px_rgba(255,188,71,0.3)] transition-shadow"
                  onKeyDown={e => e.key === 'Enter' && handleSaveScore(tempNick)}
                />

                <button
                  disabled={isLoading || !tempNick.trim()}
                  onClick={() => handleSaveScore(tempNick)}
                  className="retro-button py-3 text-xl uppercase w-full mt-2 hover:shadow-[0_0_20px_rgba(255,188,71,0.4)]"
                >
                  {isLoading ? 'GUARDANDO...' : 'GUARDAR'}
                </button>

                <button
                  onClick={() => setShowNickInput(false)}
                  className="crt-text text-xs opacity-40 uppercase hover:opacity-100 mt-2 tracking-widest transition-opacity text-center"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RankingView: React.FC<{ type: 'DIARIO' | 'GLOBAL', onBack: () => void }> = ({ type, onBack }) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      const data = type === 'DIARIO' ? await getDailyRankings() : await getGlobalRankings();
      setRankings(data);
      setLoading(false);
    };
    fetchRankings();
  }, [type]);

  return (
    <div className="flex flex-col items-center gap-8 py-6 animate-drop w-full max-h-[85vh]">
      <div className="text-center">
        <h2 className="font-['Bebas_Neue'] text-4xl tracking-widest uppercase">RANKING {type}</h2>
        <p className="crt-text text-[10px] opacity-40 uppercase">TOP 10 JUGADORES</p>
      </div>

      <div className="w-full border-2 border-amber-500/30 bg-black/60 overflow-y-auto overflow-x-hidden max-h-[450px] scrollbar-thin scrollbar-thumb-amber-500">
        {loading ? (
          <div className="p-20 text-center crt-text text-amber-500 animate-pulse uppercase">Cargando datos...</div>
        ) : rankings.length === 0 ? (
          <div className="p-20 text-center crt-text text-amber-500/50 uppercase">No hay puntuaciones registradas aún.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-black z-10 border-b-2 border-amber-500/50">
              <tr className="crt-text text-[10px] md:text-xs opacity-80 text-amber-500 uppercase">
                <th className="p-4 font-black">#</th>
                <th className="p-4 font-black">APODO</th>
                <th className="p-4 font-black hidden md:table-cell">ASOCIACIÓN</th>
                <th className="p-4 font-black text-right">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((entry, i) => (
                <tr key={i} className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors group">
                  <td className="p-4 font-['Bebas_Neue'] text-xl opacity-40">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-['Bebas_Neue'] text-xl md:text-2xl tracking-wider group-hover:text-white transition-colors uppercase">{entry.player_name}</span>
                      <div className="md:hidden mt-1 flex items-center gap-1.5 crt-text text-[10px] uppercase font-bold">
                        <span className="opacity-40">{entry.prompt}</span>
                        <span className="text-amber-500">»</span>
                        <span className="text-white italic">{entry.response}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-3 font-['Courier_Prime'] text-xs">
                      <span className="bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 opacity-60 uppercase">{entry.prompt}</span>
                      <span className="text-amber-500 font-bold animate-pulse text-lg">→</span>
                      <span className="bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-white uppercase font-bold italic tracking-wider shadow-[0_0_5px_rgba(255,255,255,0.1)]">
                        {entry.response}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-amber-500 text-lg md:text-2xl">
                    {entry.score.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={onBack} className="retro-button px-12 py-4 w-full max-w-sm uppercase">VOLVER AL MENÚ</button>
    </div>
  );
};

const MultiplayerResults: React.FC<{
  players: Player[],
  prompt: string,
  onFinish: () => void,
  onRestart: () => void,
  loading: boolean
}> = ({ players, prompt, onFinish, onRestart, loading }) => {
  const [rev, setRev] = useState(-1);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [isThinking, setIsThinking] = useState(true);

  const initialThinkingPhrases = [
    "ESCANEANDO SINAPSIS CREATIVAS...",
    "MIDIENDO LA DISTANCIA ENTRE LO OBVIO Y LO ABSURDO...",
    "CONSULTANDO EL ARCHIVO DE CLICHÉS...",
    "ANALIZANDO NIVELES DE SARCASMO...",
    "CALCULANDO EL VEREDICTO FINAL..."
  ];

  const newRoundPhrases = [
    "GENIAL, OTRA VEZ...",
    "BUSCANDO UNA PALABRA QUE NO SEA DEMASIADO DIFÍCIL PARA VOSOTROS...",
    "REINICIANDO LOS MOTORES DE LA CREATIVIDAD...",
    "ESTA VEZ, INTENTAD QUE SEA POÉTICO...",
    "PREPARANDO EL SIGUIENTE ENIGMA..."
  ];

  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setThinkingIdx(prev => {
          if (prev >= initialThinkingPhrases.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setIsThinking(false);
              setRev(0);
            }, 800);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [isThinking]);

  // If the parent is loading a new word, show the new round thinking screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-8 animate-drop">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="crt-text text-xl md:text-2xl text-amber-500 text-center uppercase tracking-widest max-w-md px-6">
          {newRoundPhrases[Math.floor(Date.now() / 2000) % newRoundPhrases.length]}
        </p>
        <span className="crt-text text-[10px] opacity-40 uppercase animate-blink">GENERANDO NUEVA PALABRA CLAVE...</span>
      </div>
    );
  }

  // Calculate standby/leaderboard data when all results are shown
  const isFinished = !isThinking && rev >= players.length - 1;
  const sortedByTotal = isFinished ? [...players].sort((a, b) => b.totalScore - a.totalScore) : [];

  return (
    <div className="flex flex-col items-center gap-10 py-10 pb-40 w-full">
      <div className="text-center">
        <span className="crt-text text-xs opacity-40 mb-4 block uppercase tracking-widest">RESULTADOS DEL DUELO</span>
        <WordBoard word={prompt} size="md" />
      </div>

      {isThinking ? (
        <div className="flex flex-col items-center justify-center py-20 gap-8 animate-pulse">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="crt-text text-xl md:text-2xl text-amber-500 text-center uppercase tracking-widest max-w-md px-6">
            {initialThinkingPhrases[thinkingIdx]}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-24">
          {players.slice(0, rev + 1).map((p, i) => (
            <div key={i} className="animate-drop">
              {p.word && p.score !== undefined && (
                <ResultDisplay
                  score={p.score}
                  totalScore={p.totalScore}
                  comment={p.comment || ""}
                  userWord={p.word}
                  playerName={p.name}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Table shown at the end */}
      {isFinished && (
        <div className="w-full max-w-2xl mt-12 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <h3 className="font-['Bebas_Neue'] text-3xl tracking-widest uppercase text-center mb-6 text-amber-500">CLASIFICACIÓN ACTUAL</h3>
          <div className="w-full border-2 border-amber-500/30 bg-black/60">
            <table className="w-full text-left">
              <thead className="bg-amber-500/10 border-b border-amber-500/30 text-amber-500 crt-text text-xs uppercase">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">JUGADOR</th>
                  <th className="p-3 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="crt-text text-sm">
                {sortedByTotal.map((p, i) => (
                  <tr key={p.id} className="border-b border-amber-500/10">
                    <td className="p-3 opacity-60">{i + 1}</td>
                    <td className="p-3 font-bold">{p.name}</td>
                    <td className="p-3 text-right text-amber-500">{p.totalScore.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full flex justify-center p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-50">
        <div className="w-full max-w-lg flex flex-col md:flex-row gap-4">
          {!isThinking && rev < players.length - 1 ? (
            <button onClick={() => setRev(rev + 1)} className="retro-button py-5 w-full text-2xl uppercase animate-drop">
              MOSTRAR SIGUIENTE
            </button>
          ) : !isThinking ? (
            <>
              <button onClick={onRestart} className="retro-button py-5 w-full text-xl uppercase flex-1 animate-drop" disabled={loading}>
                SIGUIENTE RONDA
              </button>
              <button onClick={onFinish} className="retro-button py-5 w-full text-xl uppercase flex-1 animate-drop">
                MENÚ PRINCIPAL
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const MultiplayerSetup: React.FC<{ onStart: (names: string[]) => void, loading: boolean }> = ({ onStart, loading }) => {
  const [names, setNames] = useState(['', '']);
  return (
    <div className="flex flex-col gap-8 items-center py-10">
      <h2 className="font-['Bebas_Neue'] text-4xl tracking-widest uppercase text-center">DUELO MULTIJUGADOR</h2>
      <div className="flex flex-col w-full max-w-sm gap-4">
        {names.map((n, i) => (
          <input key={i} value={n} onChange={e => {
            const nn = [...names];
            nn[i] = e.target.value;
            setNames(nn);
          }} placeholder={`JUGADOR ${i + 1}`} className="retro-input w-full py-2 text-xl uppercase" />
        ))}
        {names.length < 8 && (
          <button onClick={() => setNames([...names, ''])} className="crt-text text-[10px] opacity-40 uppercase hover:opacity-100 tracking-widest">+ AÑADIR JUGADOR</button>
        )}
      </div>
      <button onClick={() => onStart(names)} className="retro-button px-12 py-4 w-full max-w-sm uppercase" disabled={loading || names.some(n => !n.trim())}>
        {loading ? 'BUSCANDO PALABRA...' : 'EMPEZAR PARTIDA'}
      </button>
    </div>
  );
};

const MultiplayerGame: React.FC<{
  prompt: string,
  currentPlayer: Player,
  playerIndex: number,
  totalPlayers: number,
  onSubmit: (w: string) => void,
  loading: boolean
}> = ({ prompt, currentPlayer, playerIndex, totalPlayers, onSubmit, loading }) => {
  const [val, setVal] = useState('');

  const handleSubmission = () => {
    onSubmit(val);
    setVal('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-12 py-20 animate-pulse">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="font-['Bebas_Neue'] text-3xl text-amber-500 tracking-wider uppercase">EVALUANDO RESULTADOS...</h3>
          <p className="crt-text text-xs opacity-50 uppercase">LA IA ESTÁ JUZGANDO VUESTRAS ALMAS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-12 py-10">
      <div className="text-center opacity-40 crt-text text-xs tracking-[0.5em] mb-4 uppercase">PALABRA CLAVE</div>
      <WordBoard word={prompt} size="lg" />
      <div className="w-full max-w-md space-y-8 bg-black/80 p-8 border-4 border-amber-500 shadow-2xl">
        <div className="text-center space-y-2">
          <h3 className="font-['Bebas_Neue'] text-4xl text-amber-500 tracking-wider uppercase">TURNO DE: {currentPlayer.name}</h3>
          <p className="crt-text text-xs opacity-50 uppercase">Jugador {playerIndex + 1} de {totalPlayers}</p>
        </div>
        <input
          autoFocus
          type="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmission()}
          placeholder="TU RESPUESTA..."
          className="retro-input w-full py-6 text-5xl border-b-4 border-t-0 border-x-0 rounded-none focus:border-white transition-colors uppercase"
        />
        <button onClick={handleSubmission} className="retro-button py-5 w-full text-2xl uppercase" disabled={loading}>
          {loading ? 'EVALUANDO ASOCIACIÓN...' : 'JUGAR'}
        </button>
      </div>
    </div>
  );
};
