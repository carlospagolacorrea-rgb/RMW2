
import React, { useState, useEffect } from 'react';
import { GameMode, Player, ScoreCache, LeaderboardEntry } from './types';
import { getDailyPrompts, getWordScore, generateCreativePrompt, getNextRotationTime } from './services/geminiService';
import {
  getGlobalRankings,
  getDailyRankings,
  submitGameScore,
  RankingEntry,
  supabase,
  signInWithGoogle,
  signInWithFacebook,
  getUserPlays,
  saveUserPlay,
  checkGlobalCache,
  saveToGlobalCache,
  UserPlay
} from './services/supabaseClient';

import { User } from '@supabase/supabase-js';
import { PrivacyPolicy, TermsOfService } from './LegalPages';
import { UserProfile } from './UserProfile';

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const timeLeft = useCountdown();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserNick(session.user.user_metadata.username || session.user.email?.split('@')[0] || '');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserNick(session.user.user_metadata.username || session.user.email?.split('@')[0] || '');
      } else {
        setUserNick(localStorage.getItem('rankMyWord_nick') || '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const tutorialSeen = localStorage.getItem('rmw_tutorial_seen');
    if (!tutorialSeen) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
    localStorage.setItem('rmw_tutorial_seen', 'true');
    setShowTutorial(false);
  };
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

    // 1. Check Local Memory Cache
    if (scoreCache[key]) return scoreCache[key];

    setLoading(true);

    // 2. Check Global Database Cache
    const globalCached = await checkGlobalCache(prompt, response);
    if (globalCached) {
      setScoreCache(prev => ({ ...prev, [key]: globalCached }));
      setLoading(false);
      return globalCached;
    }

    // 3. AI Generation (if not found in caches)
    const result = await getWordScore(prompt, response);

    // 4. Save to Global & Local Cache (only if not an error)
    if (!result.isError) {
      saveToGlobalCache(prompt, response, result.score, result.comment);
      setScoreCache(prev => ({ ...prev, [key]: result }));
    }

    setLoading(false);
    return result;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserNick(localStorage.getItem('rankMyWord_nick') || '');
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
    <div className="min-h-screen flex flex-col items-center px-4 max-w-4xl mx-auto py-10 relative">
      {showTutorial && <Tutorial onClose={closeTutorial} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
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
            user={user}
            onRegister={handleRegister}
            getCachedScore={getCachedScore}
            onExit={() => setMode(GameMode.HOME)}
            onShowAuth={() => setShowAuthModal(true)}
          />
        )}

        {mode === GameMode.DAILY_RANKING && <RankingView title="RANKING DIARIO" fetchFn={getDailyRankings} isDaily={true} onBack={() => setMode(GameMode.HOME)} />}
        {mode === GameMode.GLOBAL_RANKING && <RankingView title="RANKING GLOBAL" fetchFn={getGlobalRankings} isDaily={false} onBack={() => setMode(GameMode.HOME)} />}
        {mode === GameMode.USER_HISTORY && user && <UserProfile user={user} onBack={() => setMode(GameMode.HOME)} onLogout={logout} />}
        {mode === GameMode.PRIVACY && <PrivacyPolicy onBack={() => setMode(GameMode.HOME)} />}
        {mode === GameMode.TERMS && <TermsOfService onBack={() => setMode(GameMode.HOME)} />}

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

      <footer className="w-full text-center pb-10 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {user ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="crt-text text-xs text-amber-500 uppercase tracking-widest font-bold">SESIÓN INICIADA: {userNick}</span>
              <button
                onClick={() => setMode(GameMode.USER_HISTORY)}
                className="crt-text text-[10px] text-amber-500 hover:text-white transition-colors uppercase tracking-[0.3em] border border-amber-500/40 hover:border-amber-500 px-6 py-1.5 rounded bg-amber-500/5 w-full max-w-[240px]"
              >
                [ MI PERFIL ]
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="crt-text text-[10px] text-amber-500 hover:text-white transition-colors uppercase tracking-[0.3em] border border-amber-500/40 hover:border-amber-500 px-6 py-1.5 rounded bg-amber-500/5 w-full max-w-[240px]"
            >
              [ LOGIN / REGISTRO ]
            </button>
          )}

          <button
            onClick={() => setShowTutorial(true)}
            className="crt-text text-[10px] text-amber-500 hover:text-white transition-colors uppercase tracking-[0.3em] border border-amber-500/40 hover:border-amber-500 px-6 py-1.5 rounded bg-amber-500/5 w-full max-w-[240px]"
          >
            [ MOSTRAR AYUDA ]
          </button>

          <span className="crt-text text-[10px] text-amber-500 animate-blink uppercase tracking-widest font-bold mt-2">
            Estado: {loading ? 'Pensando...' : 'Listo'}
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-6 opacity-60">
          <button onClick={() => setMode(GameMode.PRIVACY)} className="crt-text text-[10px] text-amber-500 hover:text-white transition-colors uppercase tracking-wider">
            Política de Privacidad
          </button>
          <span className="text-amber-500 text-[10px]">•</span>
          <button onClick={() => setMode(GameMode.TERMS)} className="crt-text text-[10px] text-amber-500 hover:text-white transition-colors uppercase tracking-wider">
            Términos y Condiciones
          </button>
          <span className="text-amber-500 text-[10px]">•</span>
          <a href="mailto:info@workdaynalytics.com" className="crt-text text-[10px] text-amber-500 hover:text-white transition-colors uppercase tracking-wider">
            Contacto
          </a>
        </div>
      </footer>
    </div>
  );
};

// --- Hooks ---

const Tutorial: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [displayText, setDisplayText] = useState('');

  const steps = [
    { title: "SISTEMA INICIADO", text: "BIENVENIDO A RANK MY WORD. UN DESAFÍO DE INGENIO HUMANO CONTRA IA." },
    { title: "EL RETO", text: "CADA 4 HORAS SURGEN 3 PALABRAS. TU OBJETIVO: ENCONTRAR UN TÉRMINO RELACIONADO." },
    { title: "LA PUNTUACIÓN", text: "LA IA EVALUARÁ TU RESPUESTA. BUSCA EL EQUILIBRIO ENTRE LO OBVIO Y LO ABSURDO PARA LOGRAR 10 PUNTOS." },
    { title: "EL RANKING", text: "DEMUESTRA QUE ERES EL MEJOR Y DOMINA EL RANKING MUNDIAL." }
  ];

  useEffect(() => {
    let currentText = '';
    let charIndex = 0;
    const fullText = steps[step].text;

    const interval = setInterval(() => {
      if (charIndex < fullText.length) {
        currentText += fullText[charIndex];
        setDisplayText(currentText);
        charIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="max-w-xl w-full border-2 border-amber-500/50 p-8 glass-effect relative overflow-hidden shadow-[0_0_50px_rgba(255,188,71,0.1)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/30 animate-scan"></div>

        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-amber-500/30 pb-4">
            <h2 className="font-['Bebas_Neue'] text-3xl tracking-[0.2em] text-amber-500 animate-pulse">
              {steps[step].title}
            </h2>
            <span className="text-xs opacity-40">STEP {step + 1}/{steps.length}</span>
          </div>

          <p className="text-lg leading-relaxed h-32 md:h-24 crt-text">
            {displayText}
            <span className="animate-blink">|</span>
          </p>

          <div className="flex justify-end gap-4 mt-8">
            {step < steps.length - 1 ? (
              <button
                onClick={() => { setStep(s => s + 1); setDisplayText(''); }}
                className="retro-button py-2 px-6 text-sm"
              >
                SIGUIENTE
              </button>
            ) : (
              <button
                onClick={onClose}
                className="retro-button py-2 px-6 text-sm bg-amber-500 text-black border-none hover:bg-amber-400"
              >
                ENTENDIDO
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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

const ShareButton: React.FC<{ score: number, word: string, response: string }> = ({ score, word, response }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `📟 RANK MY WORD\n\nPalabra: ${word.toUpperCase()}\nRespuesta: ${response.toUpperCase()}\nScore: ${score.toFixed(3)}/10\n\n¿Puedes superarme?`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RankMyWord - Mi Puntuación',
          text: text,
          url: url,
        });
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`retro-button py-2 px-6 flex items-center gap-2 transition-all duration-300 ${copied ? 'bg-white text-black border-white' : ''}`}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
      </svg>
      {copied ? '¡COPIADO!' : 'COMPARTIR RESULTADO'}
    </button>
  );
};

const ResultDisplay: React.FC<{
  score: number,
  comment: string,
  userWord: string,
  prompt: string,
  playerName?: string,
  totalScore?: number
}> = ({ score, comment, userWord, prompt, playerName, totalScore }) => (
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

      <div className="flex-1 w-full space-y-6">
        <p className="crt-text text-2xl md:text-4xl leading-snug md:leading-tight opacity-100 uppercase tracking-tight text-center md:text-left font-medium">
          "{comment}"
        </p>
        <div className="flex justify-center md:justify-start">
          <ShareButton score={score} word={prompt} response={userWord} />
        </div>
      </div>
    </div>
  </div>
);

const DailyMode: React.FC<{
  prompts: string[];
  userNick: string;
  user?: User | null;
  onRegister: (nick: string) => void;
  getCachedScore: (p: string, r: string) => Promise<{ score: number, comment: string }>;
  onExit: () => void;
  onShowAuth: () => void;
}> = ({ prompts, userNick, user, onRegister, getCachedScore, onExit, onShowAuth }) => {
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

    if (user) {
      saveUserPlay(user.id, currentPrompt, response, res.score, res.comment);
    }

    setIsLoading(false);
  };

  const handleSaveScore = async () => {
    if (!result || !user) return;
    setIsLoading(true);
    await submitGameScore(userNick, result.score, currentPrompt, response, user.id);
    setHasSubmitted(true);
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
          <ResultDisplay
            score={result.score}
            comment={result.comment}
            userWord={response}
            prompt={currentPrompt}
            playerName={userNick || undefined}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <button onClick={() => { setResult(null); setResponse(''); setHasSubmitted(false); }} className="retro-button py-3 text-sm opacity-80 uppercase">REINTENTAR</button>
            <button
              disabled={hasSubmitted}
              onClick={() => {
                if (user) {
                  handleSaveScore();
                } else {
                  onShowAuth();
                }
              }}
              className={`retro-button py-3 text-sm uppercase ${hasSubmitted ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {hasSubmitted ? 'PUNTUACIÓN GUARDADA' : 'GUARDAR PUNTUACIÓN'}
            </button>
            <button onClick={handleNext} className="retro-button py-3 text-sm font-bold uppercase">SIGUIENTE</button>
          </div>

          {!user && !hasSubmitted && (
            <div className="crt-text text-[10px] opacity-40 uppercase tracking-widest text-center mt-2 animate-pulse">
              <span className="text-amber-500 font-bold cursor-pointer hover:underline" onClick={onShowAuth}>INGRESA O REGÍSTRATE</span> PARA GUARDAR TU PUNTUACIÓN
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md border-2 border-amber-500 p-8 glass-effect relative shadow-[0_0_50px_rgba(255,188,71,0.2)]">
        <button onClick={onClose} className="absolute top-4 right-4 crt-text text-xs opacity-40 hover:opacity-100 uppercase">[ CERRAR ]</button>

        <h2 className="font-['Bebas_Neue'] text-4xl tracking-[0.2em] text-amber-500 mb-8 text-center uppercase">
          {isSignUp ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => signInWithGoogle()} className="retro-button py-2 text-xs flex items-center justify-center gap-2">
            GOOGLE
          </button>
          <button onClick={() => signInWithFacebook()} className="retro-button py-2 text-xs flex items-center justify-center gap-2">
            FACEBOOK
          </button>
        </div>

        <div className="relative flex items-center gap-4 mb-8 opacity-30">
          <div className="flex-1 h-[1px] bg-amber-500"></div>
          <span className="crt-text text-[10px] uppercase">O EMAIL</span>
          <div className="flex-1 h-[1px] bg-amber-500"></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="APODO"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="retro-input w-full py-3"
              required
            />
          )}
          <input
            type="email"
            placeholder="CORREO ELECTRÓNICO"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="retro-input w-full py-3"
            required
          />
          <input
            type="password"
            placeholder="CONTRASEÑA"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="retro-input w-full py-3"
            required
          />

          {error && <p className="crt-text text-[10px] text-red-500 uppercase text-center">{error}</p>}

          <button type="submit" disabled={loading} className="retro-button w-full py-4 text-xl uppercase mt-4">
            {loading ? 'PROCESANDO...' : isSignUp ? 'REGISTRARME' : 'ENTRAR'}
          </button>
        </form>

        <p className="mt-8 text-center crt-text text-[10px] opacity-60 uppercase">
          {isSignUp ? '¿YA TIENES CUENTA?' : '¿NO TIENES CUENTA?'}
          <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-amber-500 hover:underline">
            {isSignUp ? 'INICIA SESIÓN' : 'REGÍSTRATE GRATIS'}
          </button>
        </p>
      </div>
    </div>
  );
};

// ... Rest of the components (MultiplayerSetup, MultiplayerGame etc.)



const RankingView: React.FC<{ title: string; fetchFn: () => Promise<RankingEntry[]>; isDaily?: boolean; onBack: () => void }> = ({ title, fetchFn, isDaily, onBack }) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTime, setResetTime] = useState('');

  useEffect(() => {
    fetchFn().then(data => {
      setRankings(data);
      setLoading(false);
    });

    if (isDaily) {
      const updateResetTimer = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setUTCHours(24, 0, 0, 0); // Set to next midnight UTC
        const diff = midnight.getTime() - now.getTime();

        if (diff <= 0) {
          // If past midnight, set to next day's midnight
          midnight.setUTCDate(midnight.getUTCDate() + 1);
          const newDiff = midnight.getTime() - now.getTime();
          const h = Math.floor(newDiff / 3600000).toString().padStart(2, '0');
          const m = Math.floor((newDiff % 3600000) / 60000).toString().padStart(2, '0');
          const s = Math.floor((newDiff % 60000) / 1000).toString().padStart(2, '0');
          setResetTime(`${h}:${m}:${s}`);
          return;
        }

        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setResetTime(`${h}:${m}:${s}`);
      };

      updateResetTimer();
      const interval = setInterval(updateResetTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [fetchFn, isDaily]);

  return (
    <div className="flex flex-col items-center gap-8 py-6 animate-drop w-full max-h-[85vh]">
      <div className="text-center space-y-3">
        <h2 className="font-['Bebas_Neue'] text-5xl tracking-widest uppercase text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">{title}</h2>
        {isDaily && (
          <div className="flex flex-col items-center gap-1">
            <span className="crt-text text-[10px] opacity-40 uppercase tracking-[0.3em]">REINICIO EN</span>
            <span className="font-['Bebas_Neue'] text-3xl text-amber-400 tracking-widest drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
              {resetTime || '00:00:00'}
            </span>
          </div>
        )}
        <p className="crt-text text-[10px] opacity-30 uppercase tracking-widest mt-2">TOP 10 JUGADORES</p>
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
                  userWord={p.word || ''}
                  prompt={prompt}
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
