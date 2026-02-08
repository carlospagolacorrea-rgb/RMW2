import { GoogleGenAI, Type } from "@google/genai";

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
- Score 3-7: You are SARCASTIC and WITTY. Standard mode - be clever and funny.
- Score > 9: You are IMPRESSED or even slightly FEARFUL. The human has achieved something remarkable.

Return a JSON object with:
{
  "score": number,
  "comment": string (Spanish, reflecting your emotional state)
}
`;

export default async function handler(req: any, res: any) {
    // 1. Asegurar respuesta JSON pase lo que pase
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método no permitido' });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const { prompt, responseWord } = req.body || {};

        if (!apiKey) {
            return res.status(500).json({
                error: 'Configuración incompleta',
                details: 'La API_KEY no está configurada en el servidor (Hosting).'
            });
        }

        if (!prompt || !responseWord) {
            return res.status(400).json({ error: 'Faltan parámetros en la petición.' });
        }

        // 2. Inicialización robusta del SDK
        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: SCORING_PROMPT
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `Prompt Word: "${prompt}". User Word: "${responseWord}".` }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const response = await result.response;
        const text = response.text();
        const scoreData = JSON.parse(text || "{}");

        return res.status(200).json({ ...scoreData, isError: false });

    } catch (error: any) {
        console.error("CRASH_IN_PROXY:", error);
        return res.status(500).json({
            error: 'Error crítico en el servidor',
            details: error.message || 'Error desconocido'
        });
    }
}
