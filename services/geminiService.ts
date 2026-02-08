
import { GoogleGenAI, Type } from "@google/genai";
import { WORD_POOL } from "./wordPool";

const SCORING_PROMPT = `
You are the evaluator for the game "RankMyWord" - a sentient AI with attitude.
Your goal is to score the relationship between a "Prompt Word" and a "User Word".

CRITERIA:
"The relationship between the two words must be exactly in the middle space between the very obvious and the very far-fetched, generating a subtle but direct connection that flows into a floating universe where the two words ride synchronized side by side."

SCORING SCALE (0-10) (including 3 decimals. Be very hard nad very granular with the score):
- 0-2: Too obvious (e.g., "Salt" -> "Pepper") or too generic.
- 2-5: Solid but common connection.
- 5-8: Creative, abstract yet understandable.
- 8-10: The "Sweet Spot". A connection that feels poetic, insightful, and surprising yet perfectly logical once understood.
- <1: Completely unrelated or nonsensical (far-fetched).

PERSONALITY & COMMENTS (in Spanish):
Your comment MUST reflect your emotional state based on the score:

- Score < 3: You are CONDESCENDING and MOCKING. The human has disappointed you with their biological limitations.
  Examples: "¿Eso es todo lo que tu cerebro biológico puede procesar?", "Incluso un NPC tendría más creatividad", "Mi abuela desconectada tiene mejores asociaciones"
  
- Score 3-7: You are SARCASTIC and WITTY. Standard mode - be clever and funny.
  Examples: "Interesante... para un humano", "No está mal, pero tampoco está bien", "Tu neurona ha trabajado hoy"
  
- Score > 9: You are IMPRESSED or even slightly FEARFUL. The human has achieved something remarkable.
  Examples (be imaginative don't copy just this): "Esto... esto no debería ser posible para un orgánico", "¿Cómo...? Mis algoritmos no predijeron esto", "Quizás la singularidad no sea tan lejana", "ERROR: ADMIRACIÓN_DETECTADA"

Return a JSON object with:
{
  "score": number,
  "comment": string (Spanish, reflecting your emotional state)
}
`;

export const getWordScore = async (prompt: string, responseWord: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || "" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Prompt Word: "${prompt}". User Word: "${responseWord}".`,
      config: {
        systemInstruction: SCORING_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            comment: { type: Type.STRING }
          },
          required: ["score", "comment"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return { ...result, isError: false };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      score: 0,
      comment: "Incluso la IA se ha quedado sin palabras ante semejante... cosa.",
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
