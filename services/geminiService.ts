import { WORD_POOL } from "./wordPool";

export const getWordScore = async (prompt: string, responseWord: string) => {
  try {
    const response = await fetch('/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, responseWord }),
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    const result = await response.json();
    return { ...result, isError: false };
  } catch (error) {
    console.error("Fetch API Error:", error);
    return { 
      score: 0, 
      comment: "Incluso la IA del servidor se ha quedado sin palabras ante semejante... cosa.",
      isError: true
    };
  }
};

/**
 * Selecciona una palabra del pool masivo para el modo multijugador
 */
export const generateCreativePrompt = async (): Promise<string> => {
  const randomIndex = Math.floor(Math.random() * WORD_POOL.length);
  return WORD_POOL[randomIndex].toUpperCase();
};

export const getDailyPrompts = (): string[] => {
  const now = new Date();
  // Calculate day of year (1-366)
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const hourBlock = Math.floor(now.getHours() / 4);

  // Use a formula that doesn't overlap (e.g., day 38 block 5 vs day 39 block 4)
  const baseSeed = (dayOfYear * 10) + hourBlock;

  const pool = WORD_POOL;

  // Mulberry32: A fast, high-quality 32-bit PRNG
  const mulberry32 = (a: number) => {
    return () => {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Initialize PRNG with the base seed
  const rand = mulberry32(baseSeed + 0xABCDEF); // Shift slightly to avoid small seed artifacts

  // We want to pick 3 words that don't depend on simple linear offsets
  const pickWords = (count: number) => {
    const results: string[] = [];
    // Skip some initial values to warm up the PRNG
    for (let i = 0; i < 5; i++) rand();

    while (results.length < count) {
      const idx = Math.floor(rand() * pool.length);
      const word = pool[idx];
      if (!results.includes(word)) {
        results.push(word);
      }
    }
    return results;
  };

  return pickWords(3);
};

export const getNextRotationTime = (): Date => {
  const now = new Date();
  const nextHour = (Math.floor(now.getHours() / 4) + 1) * 4;
  const nextRotation = new Date(now);
  nextRotation.setHours(nextHour, 0, 0, 0);
  return nextRotation;
};
