
import { GoogleGenAI, Type } from "@google/genai";
import { WORD_POOL } from "./wordPool";

const SCORING_PROMPT = `
You are the evaluator for the game "RankMyWord".
Your goal is to score the relationship between a "Prompt Word" and a "User Word".

CRITERIA:
"The relationship between the two words must be exactly in the middle space between the very obvious and the very far-fetched, generating a subtle but direct connection that flows into a floating universe where the two words ride synchronized side by side."

SCORING SCALE (0-10) (including 3 decimals):
- 0-2: Too obvious (e.g., "Salt" -> "Pepper") or too generic.
- 2-5: Solid but common connection.
- 5-8: Creative, abstract yet understandable.
- 8-10: The "Sweet Spot". A connection that feels poetic, insightful, and surprising yet perfectly logical once understood.
- <1: Completely unrelated or nonsensical (far-fetched).

COMMENTS:
You must provide a sarcastic, witty, and funny comment in Spanish about the pair. Be brutally honest if it's too obvious, or mocking if it's too weird.

Return a JSON object with:
{
  "score": number,
  "comment": string (Spanish)
}
`;

export const getWordScore = async (prompt: string, responseWord: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
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
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { score: 0, comment: "Incluso la IA se ha quedado sin palabras ante semejante... cosa." };
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
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const hourBlock = Math.floor(now.getHours() / 4);
  const seed = dayOfYear + hourBlock;

  const pool = WORD_POOL;

  const getWord = (offset: number) => pool[(seed * 17 + offset * 31) % pool.length];

  return [getWord(1), getWord(2), getWord(3)];
};

export const getNextRotationTime = (): Date => {
  const now = new Date();
  const nextHour = (Math.floor(now.getHours() / 4) + 1) * 4;
  const nextRotation = new Date(now);
  nextRotation.setHours(nextHour, 0, 0, 0);
  return nextRotation;
};
