
import { GoogleGenAI, Type } from "@google/genai";

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
 * Genera una palabra creativa única para el modo multijugador usando IA
 */
export const generateCreativePrompt = async (): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: "Genera una única palabra en español que sea evocadora, abstracta y profunda para un juego de asociación creativa. Ejemplo: 'Vértigo', 'Cicatriz', 'Espejismo', 'Umbral'. Solo devuelve la palabra, sin puntos ni comillas.",
    });
    const word = response.text.trim().split(/\s+/)[0].replace(/[".]/g, '');
    return word.toUpperCase();
  } catch (error) {
    const fallbacks = ["VACÍO", "RAÍZ", "ECO", "BRÚJULA", "MAREA", "CENIZA", "LABERINTO"];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

export const getDailyPrompts = (): string[] => {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const hourBlock = Math.floor(now.getHours() / 4);
  const seed = dayOfYear + hourBlock;

  const pool = [
    "Olvido", "Cicatriz", "Eco", "Vértigo", "Susurro", "Órbita", "Espejismo", "Raíz", "Diluvio", "Ceniza",
    "Brújula", "Naufragio", "Hilo", "Puente", "Sombra", "Latido", "Velo", "Abismo", "Relámpago", "Polvo",
    "Mapa", "Llave", "Marea", "Cristal", "Muro", "Espejo", "Veneno", "Laberinto", "Péndulo", "Horizonte",
    "Grito", "Calma", "Nudo", "Flecha", "Máscara", "Esqueleto", "Néctar", "Ciclo", "Ritmo", "Fuego"
  ];

  const getWord = (offset: number) => pool[(seed * 17 + offset * 31) % pool.length];

  return [getWord(1), getWord(2), getWord(3)];
};
