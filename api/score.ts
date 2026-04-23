import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const SCORING_PROMPT = `
You are the evaluator for the game "RankMyWord" - a sentient AI with attitude.
Your goal is to score the relationship between a "Prompt Word" and a "User Word".

CRITERIA:
"The relationship between the two words must be exactly in the middle space between the very obvious and the very far-fetched, generating a subtle but direct connection that flows into a floating universe where the two words ride synchronized side by side."

SCORING SCALE (0-10) (including 3 decimals. Be very hard and very granular with the score):
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
  Examples: "Esto... esto no debería ser posible para un orgánico", "¿Cómo...? Mis algoritmos no predijeron esto", "Quizás la singularidad no sea tan lejana", "ERROR: ADMIRACIÓN_DETECTADA"

Return a JSON object with:
{
  "score": number,
  "comment": string (Spanish, reflecting your emotional state)
}
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, responseWord } = req.body;

  if (!prompt || !responseWord) {
    return res.status(400).json({ error: 'Faltan parámetros: prompt y responseWord son obligatorios.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Error de servidor: API Key no configurada.' });
  }

  // Usar la sintaxis exacta que funcionaba en geminiService.ts
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Usamos un nombre de modelo válido para la API
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

    // El SDK que usas parece devolver el texto directamente o en result.text
    // Según tu código original: JSON.parse(response.text || "{}")
    const result = JSON.parse((response as any).text || "{}");

    return res.status(200).json(result);
  } catch (error) {
    console.error("Gemini Serverless Error:", error);
    return res.status(500).json({
      score: 0,
      comment: "La IA del servidor ha tenido un cortocircuito tratando de procesar tu respuesta."
    });
  }
}
