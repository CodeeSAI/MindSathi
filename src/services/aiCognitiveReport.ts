import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { checkReportGenerationAllowed, recordReportGeneration } from "./apiUsageGuard";

const COGNITIVE_REPORT_VERSION = "cognitive-report-v2";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

export type CognitiveTrend = "improving" | "declining" | "stable" | "insufficient_data";

export interface CognitiveReportObservation {
  domain: string;
  observation: string;
}

export interface CognitiveDomainMetrics {
  domain: string;
  sessions: number;
  averageScore: number;
  averageAccuracy: number | null;
  trend: CognitiveTrend;
  difficultyLevels: number[];
}

export interface CognitiveRecentPerformance {
  recentSessionCount: number;
  recentAverageScore: number | null;
  previousAverageScore: number | null;
  scoreChange: number | null;
  averageAccuracy: number | null;
  averageDurationSeconds: number | null;
  averageHintsUsed: number | null;
  starsEarned: number;
  consistency: "consistent" | "some_variation" | "variable" | "insufficient_data";
}

export interface CognitiveAIReport {
  reportVersion: string;
  sourceFingerprint: string;
  sourceGameCount?: number;
  overallScore: number;
  totalSessions: number;
  completedSessions: number;
  completionRate: number | null;
  overallAccuracy: number | null;
  totalStars: number;
  trend: CognitiveTrend;
  trendExplanation: string;
  summary: string;
  strengths: CognitiveReportObservation[];
  areasToImprove: CognitiveReportObservation[];
  personalizedRecommendations: string[];
  recentPerformance: CognitiveRecentPerformance;
  domainInsights: (CognitiveDomainMetrics & { observation: string })[];
  encouragement: string;
}

interface CognitiveReportMetrics {
  overallScore: number;
  totalSessions: number;
  completedSessions: number;
  completionRate: number | null;
  overallAccuracy: number | null;
  totalStars: number;
  trend: CognitiveTrend;
  recentPerformance: CognitiveRecentPerformance;
  domainMetrics: CognitiveDomainMetrics[];
  strongestDomains: string[];
  practiceDomains: string[];
  recentSessions: {
    game: string;
    domain: string;
    score: number;
    accuracy: number | null;
    difficulty: number | null;
    durationSeconds: number | null;
    hintsUsed: number | null;
    starsEarned: number;
  }[];
}

interface CognitiveAIContent {
  summary: string;
  strengths: CognitiveReportObservation[];
  areasToImprove: CognitiveReportObservation[];
  personalizedRecommendations: string[];
  trendExplanation: string;
  domainInsights: CognitiveReportObservation[];
  encouragement: string;
}

export interface CognitiveGameHistoryEntry {
  id: string;
  gameName: string;
  score: number;
  maxScore: 100;
  cognitiveDomain: string;
  playedTime: string;
  duration: string;
  difficulty: string;
  completedAtMs?: number | null;
  accuracy?: number | null;
  difficultyLevel?: number | null;
  durationSeconds?: number | null;
  hintsUsed?: number | null;
  starsEarned?: number;
  completionStatus?: "completed" | "abandoned";
}

export function normalizeCognitiveGameResult(
  id: string,
  data: Record<string, any>
): CognitiveGameHistoryEntry {
  const gameName = String(data.gameName || data.gameType || "Cognitive Game");
  const completedAt = data.completedAt?.toDate?.()
    ?? (data.completedAt instanceof Date ? data.completedAt : null);
  const completedAtMs = typeof data.timestamp === "number" && Number.isFinite(data.timestamp)
    ? data.timestamp
    : completedAt?.getTime() ?? null;
  const rawAccuracy = Number(data.accuracy);
  const rawDifficultyLevel = Number(data.difficultyLevel);
  const rawDurationSeconds = Number(data.completionTimeSeconds ?? data.durationSeconds);
  const rawHintsUsed = Number(data.hintsUsed);
  let score = 0;

  if (data.normalizedScore !== undefined) {
    score = Number(data.normalizedScore);
  } else if (data.maxScore) {
    score = (Number(data.score || 0) / Number(data.maxScore)) * 100;
  } else if (gameName === "Memory Match") {
    score = (Number(data.score || 0) / 20) * 100;
  } else {
    score = (Number(data.score || 0) / 5) * 100;
  }

  const domainMap: Record<string, string> = {
    "Memory Match": "Memory",
    "Focus Finder": "Attention",
    "Daily Life Recall": "Routine Recall",
    "Pattern Path": "Pattern Recognition",
    "Familiar Place": "Memory",
    "Picture Recall": "Memory",
  };

  return {
    id,
    gameName,
    score: Math.max(0, Math.min(100, Math.round(score))),
    maxScore: 100,
    cognitiveDomain: String(data.cognitiveDomain || domainMap[gameName] || "Cognitive"),
    playedTime: completedAtMs !== null ? new Date(completedAtMs).toLocaleString() : "Recently",
    duration: data.completionTimeSeconds
      ? `${Math.round(data.completionTimeSeconds)}s`
      : data.durationSeconds
      ? `${data.durationSeconds}s`
      : "Completed",
    difficulty: data.difficultyLevel ? `Level ${data.difficultyLevel}` : "Adaptive",
    completedAtMs,
    accuracy: data.accuracy == null || !Number.isFinite(rawAccuracy)
      ? null
      : Math.max(0, Math.min(100, rawAccuracy)),
    difficultyLevel: Number.isFinite(rawDifficultyLevel) && rawDifficultyLevel > 0
      ? rawDifficultyLevel
      : null,
    durationSeconds: Number.isFinite(rawDurationSeconds) && rawDurationSeconds > 0
      ? rawDurationSeconds
      : null,
    hintsUsed: data.hintsUsed == null || !Number.isFinite(rawHintsUsed) || rawHintsUsed < 0
      ? null
      : rawHintsUsed,
    starsEarned: Number(data.starsEarned ?? data.stars ?? 0) || 0,
    completionStatus: data.completionStatus === "abandoned"
      ? "abandoned"
      : data.completionStatus === "completed"
      ? "completed"
      : undefined,
  };
}

export function calculateCognitiveOverallScore(
  games: readonly { score: number }[]
): number {
  if (games.length === 0) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(games.reduce((total, game) => total + Number(game.score || 0), 0) / games.length)
    )
  );
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function calculateTrend(
  newestFirst: CognitiveGameHistoryEntry[]
): {
  trend: CognitiveTrend;
  scoreChange: number | null;
  recentAverage: number | null;
  previousAverage: number | null;
  recentSessionCount: number;
} {
  const windowSize = Math.min(5, Math.floor(newestFirst.length / 2));
  const recentSessionCount = windowSize >= 2 ? windowSize : Math.min(5, newestFirst.length);
  const recentAverage = average(newestFirst.slice(0, recentSessionCount).map((game) => game.score));

  if (windowSize < 2) {
    return {
      trend: "insufficient_data",
      scoreChange: null,
      recentAverage,
      previousAverage: null,
      recentSessionCount,
    };
  }

  const recentAverageForTrend = average(newestFirst.slice(0, windowSize).map((game) => game.score));
  const previousAverage = average(
    newestFirst.slice(windowSize, windowSize * 2).map((game) => game.score)
  );
  const scoreChange =
    recentAverageForTrend !== null && previousAverage !== null
      ? recentAverageForTrend - previousAverage
      : null;

  return {
    trend:
      scoreChange === null
        ? "insufficient_data"
        : scoreChange >= 5
        ? "improving"
        : scoreChange <= -5
        ? "declining"
        : "stable",
    scoreChange,
    recentAverage,
    previousAverage,
    recentSessionCount,
  };
}

function calculateConsistency(scores: number[]): CognitiveRecentPerformance["consistency"] {
  if (scores.length < 3) return "insufficient_data";
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const deviation = Math.sqrt(
    scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length
  );
  return deviation <= 8 ? "consistent" : deviation <= 15 ? "some_variation" : "variable";
}

export function calculateCognitiveReportMetrics(
  gameHistory: readonly CognitiveGameHistoryEntry[]
): CognitiveReportMetrics {
  const games = [...gameHistory];
  const datedNewestFirst = games
    .filter((game) => game.completedAtMs !== null && game.completedAtMs !== undefined)
    .sort((a, b) => (b.completedAtMs! - a.completedAtMs!) || a.id.localeCompare(b.id));
  const comparison = calculateTrend(datedNewestFirst);
  const recentGames = datedNewestFirst.slice(0, 5);
  const recentPerformanceGames = datedNewestFirst.slice(0, comparison.recentSessionCount);
  const knownAccuracies = games
    .map((game) => game.accuracy)
    .filter((accuracy): accuracy is number => typeof accuracy === "number");
  const statusKnown = games.filter((game) => game.completionStatus !== undefined);
  const completedSessions = games.filter((game) => game.completionStatus !== "abandoned").length;
  const domains = new Map<string, CognitiveGameHistoryEntry[]>();

  games.forEach((game) => {
    const domain = game.cognitiveDomain || game.gameName;
    domains.set(domain, [...(domains.get(domain) || []), game]);
  });

  const domainMetrics = Array.from(domains.entries())
    .map(([domain, sessions]) => {
      const domainComparison = calculateTrend(
        sessions
          .filter((game) => game.completedAtMs !== null && game.completedAtMs !== undefined)
          .sort((a, b) => (b.completedAtMs! - a.completedAtMs!) || a.id.localeCompare(b.id))
      );
      return {
        domain,
        sessions: sessions.length,
        averageScore: calculateCognitiveOverallScore(sessions),
        averageAccuracy: average(
          sessions
            .map((game) => game.accuracy)
            .filter((accuracy): accuracy is number => typeof accuracy === "number")
        ),
        trend: domainComparison.trend,
        difficultyLevels: Array.from(
          new Set(
            sessions
              .map((game) => game.difficultyLevel)
              .filter((level): level is number => typeof level === "number")
          )
        ).sort((a, b) => a - b),
      };
    })
    .sort((a, b) => a.domain.localeCompare(b.domain));

  const overallScore = calculateCognitiveOverallScore(games);
  const hasComparativeData = games.length >= 4 && domainMetrics.length >= 2;
  const strongestDomains = hasComparativeData
    ? domainMetrics
        .filter((domain) => domain.sessions >= 2 && domain.averageScore >= overallScore + 5)
        .map((domain) => domain.domain)
    : [];
  const practiceDomains = hasComparativeData
    ? domainMetrics
        .filter((domain) => domain.sessions >= 2 && domain.averageScore <= overallScore - 5)
        .map((domain) => domain.domain)
    : [];
  const recentAccuracy = recentPerformanceGames
    .map((game) => game.accuracy)
    .filter((accuracy): accuracy is number => typeof accuracy === "number");
  const recentDurations = recentPerformanceGames
    .map((game) => game.durationSeconds)
    .filter((duration): duration is number => typeof duration === "number");
  const recentHints = recentPerformanceGames
    .map((game) => game.hintsUsed)
    .filter((hints): hints is number => typeof hints === "number");

  return {
    overallScore,
    totalSessions: games.length,
    completedSessions,
    completionRate: statusKnown.length === games.length && games.length > 0
      ? Math.round((completedSessions / games.length) * 100)
      : null,
    overallAccuracy: average(knownAccuracies),
    totalStars: games.reduce((total, game) => total + game.starsEarned, 0),
    trend: comparison.trend,
    recentPerformance: {
      recentSessionCount: comparison.recentSessionCount,
      recentAverageScore: comparison.recentAverage,
      previousAverageScore: comparison.previousAverage,
      scoreChange: comparison.scoreChange,
      averageAccuracy: average(recentAccuracy),
      averageDurationSeconds: recentDurations.length
        ? Math.round(recentDurations.reduce((sum, duration) => sum + duration, 0) / recentDurations.length)
        : null,
      averageHintsUsed: recentHints.length
        ? Math.round((recentHints.reduce((sum, hints) => sum + hints, 0) / recentHints.length) * 10) / 10
        : null,
      starsEarned: recentPerformanceGames.reduce((total, game) => total + game.starsEarned, 0),
      consistency: calculateConsistency(games.map((game) => game.score)),
    },
    domainMetrics,
    strongestDomains,
    practiceDomains,
    recentSessions: recentGames.map((game) => ({
      game: game.gameName,
      domain: game.cognitiveDomain,
      score: game.score,
      accuracy: game.accuracy ?? null,
      difficulty: game.difficultyLevel ?? null,
      durationSeconds: game.durationSeconds ?? null,
      hintsUsed: game.hintsUsed ?? null,
      starsEarned: game.starsEarned,
    })),
  };
}

export async function generateCognitiveAIReport(
  gameHistory: readonly CognitiveGameHistoryEntry[],
  patientFirstName: string,
  metrics = calculateCognitiveReportMetrics(gameHistory)
): Promise<CognitiveAIContent | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || gameHistory.length === 0) return Promise.resolve(null);

  const quotaCheck = checkReportGenerationAllowed();
  if (!quotaCheck.allowed) {
    console.warn(`[CognitiveAIReport] ${quotaCheck.message}`);
    return null;
  }

  const knownDomains = metrics.domainMetrics.map((domain) => domain.domain);
  const performanceInput = {
    patientFirstName,
    overallScore: metrics.overallScore,
    totalSessions: metrics.totalSessions,
    completedSessions: metrics.completedSessions,
    completionRate: metrics.completionRate,
    overallAccuracy: metrics.overallAccuracy,
    totalStars: metrics.totalStars,
    trend: metrics.trend,
    recentPerformance: metrics.recentPerformance,
    domains: metrics.domainMetrics,
    strongestDomains: metrics.strongestDomains,
    practiceDomains: metrics.practiceDomains,
    recentSessions: metrics.recentSessions,
  };

  const systemMessage = `You write concise, supportive cognitive-game performance reports for older adults. Use plain, reassuring language and address the person by their first name when natural. This is not a medical assessment. Never diagnose or make medical claims.

Use only the supplied observed metrics. Do not invent scores, counts, accuracy, dates, strengths, weaknesses, or trends. The deterministic trend is authoritative: explain only that trend. If trend is insufficient_data, state that there is not enough dated activity to identify a trend. If strongestDomains or practiceDomains is empty, return an empty strengths or areasToImprove array respectively. For insufficient activity, do not claim strengths or weaker areas. Every recommendation must refer to a game or domain in the supplied data. Do not include numeric scores or counts in prose; the dashboard displays those deterministic values separately.

Return one JSON object with exactly these fields: summary (string, no more than 320 characters), strengths (array of up to 3 objects with exact domain and a short observation), areasToImprove (same shape), personalizedRecommendations (array of 1-3 short strings), trendExplanation (string, no more than 220 characters), domainInsights (one short observation for every supplied domain, using its exact name), and encouragement (string, no more than 180 characters). For each strength, domain must be one of strongestDomains. For each areaToImprove, domain must be one of practiceDomains. Never output medical diagnoses or claims.`;

  const userMessage = `Observed cognitive-game performance metrics:\n${JSON.stringify(performanceInput)}`;

  const callGroqWithProtection = async (retryCount = 0): Promise<Response | null> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 800,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      // Do NOT retry 401, 403, 429
      if (response.status === 401 || response.status === 403 || response.status === 429) {
        console.warn(`[CognitiveAIReport] Groq responded with status ${response.status}. Fallback preserved.`);
        return response;
      }

      if (!response.ok && retryCount === 0 && response.status >= 500) {
        // At most 1 controlled retry for transient 5xx server failures
        await new Promise((res) => setTimeout(res, 1200));
        return callGroqWithProtection(1);
      }

      return response;
    } catch (err: any) {
      if (retryCount === 0 && err?.name !== "AbortError") {
        await new Promise((res) => setTimeout(res, 1000));
        return callGroqWithProtection(1);
      }
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  try {
    const response = await callGroqWithProtection();
    if (!response || !response.ok) {
      return null;
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length > 12000) return null;
    const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const validated = validateCognitiveAIContent(JSON.parse(cleaned), metrics, knownDomains);
    if (validated) {
      recordReportGeneration();
    }
    return validated;
  } catch {
    console.warn("Personalized cognitive report unavailable; keeping the last valid report.");
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readShortText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (
    !text ||
    text.length > maxLength ||
    /\d/.test(text) ||
    /\b(dementia|diagnos(?:is|e|ed)|cognitive impairment|medical condition|disease)\b/i.test(text)
  ) {
    return null;
  }
  return text;
}

function readObservations(
  value: unknown,
  allowedDomains: string[],
  maxItems: number
): CognitiveReportObservation[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const observations: CognitiveReportObservation[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.domain !== "string" || !allowedDomains.includes(item.domain)) return null;
    const observation = readShortText(item.observation, 220);
    if (!observation) return null;
    observations.push({ domain: item.domain, observation });
  }
  if (new Set(observations.map((item) => item.domain)).size !== observations.length) return null;
  return observations;
}

function validateCognitiveAIContent(
  value: unknown,
  metrics: CognitiveReportMetrics,
  knownDomains: string[]
): CognitiveAIContent | null {
  if (!isRecord(value)) return null;
  const summary = readShortText(value.summary, 320);
  const encouragement = readShortText(value.encouragement, 180);
  const rawTrendExplanation = readShortText(value.trendExplanation, 220);
  const strengths = readObservations(value.strengths, metrics.strongestDomains, 3);
  const areasToImprove = readObservations(value.areasToImprove, metrics.practiceDomains, 3);
  const domainInsights = readObservations(value.domainInsights, knownDomains, 12);
  const recommendations = value.personalizedRecommendations;

  if (
    !summary ||
    !encouragement ||
    !rawTrendExplanation ||
    !strengths ||
    !areasToImprove ||
    !domainInsights ||
    !Array.isArray(recommendations) ||
    recommendations.length < 1 ||
    recommendations.length > 3 ||
    domainInsights.length !== knownDomains.length ||
    !knownDomains.every((domain) => domainInsights.some((item) => item.domain === domain))
  ) return null;

  const allowedRecommendationTerms = metrics.domainMetrics.map((domain) => domain.domain);
  for (const game of metrics.recentSessions) allowedRecommendationTerms.push(game.game);
  const safeRecommendations: string[] = [];
  for (const recommendation of recommendations) {
    const text = readShortText(recommendation, 180);
    if (!text || !allowedRecommendationTerms.some((term) => text.toLowerCase().includes(term.toLowerCase()))) {
      return null;
    }
    safeRecommendations.push(text);
  }

  if (metrics.trend === "improving" && !/improv|higher|increase|upward|stronger/i.test(rawTrendExplanation)) return null;
  if (metrics.trend === "declining" && !/declin|lower|decrease|downward|weaker/i.test(rawTrendExplanation)) return null;
  if (metrics.trend === "stable" && !/stable|steady|similar|consistent|remain/i.test(rawTrendExplanation)) return null;

  const trendExplanation = metrics.trend === "insufficient_data"
    ? "There is not enough dated activity to identify a performance trend yet."
    : rawTrendExplanation;

  return {
    summary,
    strengths,
    areasToImprove,
    personalizedRecommendations: safeRecommendations,
    trendExplanation,
    domainInsights,
    encouragement,
  };
}

const pendingReportSyncs = new Map<string, Promise<void>>();
const latestReportFingerprints = new Map<string, string>();

function createSourceFingerprint(gameHistory: readonly CognitiveGameHistoryEntry[]): string {
  return JSON.stringify(
    gameHistory
      .map((game) => ({
        id: game.id,
        gameName: game.gameName,
        cognitiveDomain: game.cognitiveDomain,
        score: game.score,
        accuracy: game.accuracy ?? null,
        difficultyLevel: game.difficultyLevel ?? null,
        durationSeconds: game.durationSeconds ?? null,
        hintsUsed: game.hintsUsed ?? null,
        starsEarned: game.starsEarned,
        completionStatus: game.completionStatus,
        completedAtMs: game.completedAtMs ?? null,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

export async function syncCanonicalCognitiveAIReport(
  patientId: string,
  gameHistory: readonly CognitiveGameHistoryEntry[]
): Promise<void> {
  if (!patientId || gameHistory.length === 0) return;

  const sourceFingerprint = createSourceFingerprint(gameHistory);
  latestReportFingerprints.set(patientId, sourceFingerprint);
  const requestKey = `${patientId}:${COGNITIVE_REPORT_VERSION}:${sourceFingerprint}`;
  const pending = pendingReportSyncs.get(requestKey);
  if (pending) return pending;

  const cachedFingerprintKey = `mindsathi_report_fp_${patientId}`;
  try {
    if (localStorage.getItem(cachedFingerprintKey) === sourceFingerprint) {
      return;
    }
  } catch {
    // Ignore storage error
  }

  const operation = (async () => {
    const patientRef = doc(db, "users", patientId);
    const patientSnapshot = await getDoc(patientRef);
    const existingReport = patientSnapshot.data()?.cognitiveReport;
    if (
      existingReport?.reportVersion === COGNITIVE_REPORT_VERSION &&
      existingReport?.sourceFingerprint === sourceFingerprint
    ) {
      try {
        localStorage.setItem(cachedFingerprintKey, sourceFingerprint);
      } catch {}
      return;
    }
    if (latestReportFingerprints.get(patientId) !== sourceFingerprint) return;

    const patientData = patientSnapshot.data();
    const patientFirstName = String(patientData?.name || patientData?.fullName || "")
      .trim()
      .split(/\s+/)[0]
      .slice(0, 40);
    const metrics = calculateCognitiveReportMetrics(gameHistory);
    const content = await generateCognitiveAIReport(gameHistory, patientFirstName, metrics);
    if (!content || latestReportFingerprints.get(patientId) !== sourceFingerprint) return;

    const report: CognitiveAIReport = {
      reportVersion: COGNITIVE_REPORT_VERSION,
      sourceFingerprint,
      sourceGameCount: metrics.totalSessions,
      overallScore: metrics.overallScore,
      totalSessions: metrics.totalSessions,
      completedSessions: metrics.completedSessions,
      completionRate: metrics.completionRate,
      overallAccuracy: metrics.overallAccuracy,
      totalStars: metrics.totalStars,
      trend: metrics.trend,
      trendExplanation: content.trendExplanation,
      summary: content.summary,
      strengths: content.strengths,
      areasToImprove: content.areasToImprove,
      personalizedRecommendations: content.personalizedRecommendations,
      recentPerformance: metrics.recentPerformance,
      domainInsights: metrics.domainMetrics.map((domain) => ({
        ...domain,
        observation: content.domainInsights.find((item) => item.domain === domain.domain)!.observation,
      })),
      encouragement: content.encouragement,
    };

    await setDoc(
      patientRef,
      { cognitiveReport: report, cognitiveReportUpdatedAt: serverTimestamp() },
      { merge: true }
    );
    try {
      localStorage.setItem(cachedFingerprintKey, sourceFingerprint);
    } catch {}
  })();

  const trackedOperation = operation.finally(() => {
    if (pendingReportSyncs.get(requestKey) === trackedOperation) {
      pendingReportSyncs.delete(requestKey);
    }
  });
  pendingReportSyncs.set(requestKey, trackedOperation);
  return trackedOperation;
}