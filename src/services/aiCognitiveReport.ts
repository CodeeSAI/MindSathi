import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

export interface CognitiveAIReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  areasToPractice: string[];
  recommendations: string[];
  patientMessage: string;
}

export async function generateCognitiveAIReport(
  gameHistory: any[]
): Promise<CognitiveAIReport> {

  const safeGames = gameHistory.map((game) => ({
    gameName: game.gameName,
    cognitiveDomain: game.cognitiveDomain,
    score: Math.max(
      0,
      Math.min(100, Number(game.score || 0))
    ),
    difficulty: game.difficulty,
    duration: game.duration,
  }));

  const overallScore = safeGames.length
    ? Math.round(
        safeGames.reduce(
          (sum, game) => sum + game.score,
          0
        ) / safeGames.length
      )
    : 0;

  const fallback: CognitiveAIReport = {
    overallScore,
    summary:
      "Recent cognitive activities have been reviewed.",
    strengths: [
      "Regular cognitive activity",
      "Continued participation",
    ],
    areasToPractice: [
      "Memory practice",
      "Attention activities",
    ],
    recommendations: [
      "Continue daily cognitive activities.",
      "Try a variety of memory and attention games.",
    ],
    patientMessage:
      "Great job staying active! Keep practicing a little each day.",
  };

  if (!ai || safeGames.length === 0) {
    return fallback;
  }

  try {
    const prompt = `
You are the AI cognitive activity assistant for MemoryNest.

Analyze ONLY the patient's cognitive GAME PERFORMANCE.

Do NOT diagnose dementia or any medical condition.
Do NOT make medical claims.
Do NOT say the patient is healthy or unhealthy.

Game performance:
${JSON.stringify(safeGames, null, 2)}

Return ONLY valid JSON:

{
  "overallScore": number,
  "summary": "short performance summary",
  "strengths": ["strength 1", "strength 2"],
  "areasToPractice": ["area 1", "area 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "patientMessage": "simple encouraging message"
}

Rules:
- overallScore must be between 0 and 100.
- Use only the supplied game data.
- Identify stronger and weaker cognitive-game domains.
- Keep language simple and supportive.
- Recommendations must be cognitive activity suggestions.
- Never provide a medical diagnosis.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      return fallback;
    }

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      overallScore: Math.max(
        0,
        Math.min(
          100,
          Number(parsed.overallScore || overallScore)
        )
      ),

      summary:
        String(parsed.summary || fallback.summary),

      strengths:
        Array.isArray(parsed.strengths)
          ? parsed.strengths.map(String)
          : fallback.strengths,

      areasToPractice:
        Array.isArray(parsed.areasToPractice)
          ? parsed.areasToPractice.map(String)
          : fallback.areasToPractice,

      recommendations:
        Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map(String)
          : fallback.recommendations,

      patientMessage:
        String(
          parsed.patientMessage ||
          fallback.patientMessage
        ),
    };

  } catch (error) {
    console.error(
      "Gemini cognitive report failed:",
      error
    );

    return fallback;
  }
}