/**
 * SAHARA ADAPTIVE COGNITIVE ENGINE
 * 
 * Unified, deterministic intelligence engine powering all four cognitive activities:
 * 1. Memory Match (Memory / working memory)
 * 2. Focus Finder (Attention / concentration)
 * 3. Daily Life Recall (Daily routine recall)
 * 4. Pattern Path (Pattern and object recognition)
 * 
 * Core Principles:
 * - Deterministic, rule-based mathematical scoring (0-100 normalized performance score)
 * - Safe clamped difficulty (Level 1 to Level 5)
 * - Shared engine function: getNextDifficulty(currentDifficulty, performanceMetrics, gameType)
 * - Full telemetry tracking structured for future Scikit-learn / ML consumption
 * - Offline sync queue with idempotent document IDs (zero duplicate records)
 * - Strictly non-diagnostic language: game performance and engagement only
 */

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export type CognitiveGameType =
  | "memory-match"
  | "focus-finder"
  | "daily-life-recall"
  | "pattern-path";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface GamePerformanceMetrics {
  currentDifficulty: DifficultyLevel;
  accuracy: number; // 0 - 100
  incorrectAttempts: number;
  moves?: number;
  pairsCount?: number;
  completionTimeSeconds: number;
  averageResponseTimeSeconds: number;
  hintsUsed: number;
  hesitationCount: number;
  totalRounds?: number;
  correctAnswers?: number;
}

export interface AdaptiveEngineOutput {
  nextDifficulty: DifficultyLevel;
  levelChange: "increased" | "decreased" | "maintained";
  normalizedScore: number; // 0 - 100
  feedbackMessage: string;
  supportiveNote: string;
}

export interface GameTelemetryRecord {
  patientId: string;
  gameId: CognitiveGameType;
  gameName: string;
  cognitiveDomain?: "Memory" | "Attention" | "Routine Recall" | "Pattern Recognition";
  difficultyLevel: DifficultyLevel;
  score: number; // 0 - 100
  maxScore?: number;
  accuracy: number; // 0 - 100
  completionTimeSeconds: number;
  averageResponseTimeSeconds: number;
  incorrectAttempts: number;
  moves?: number;
  pairsCount?: number;
  hintsUsed: number;
  hesitationCount: number;
  completionStatus?: "completed" | "abandoned";
  nextDifficultyLevel: DifficultyLevel;
  starsEarned: number;
  clientSubmissionId: string;
  timestamp: number;
}

export interface CognitiveDomainPerformance {
  domain: "Memory" | "Attention" | "Routine Recall" | "Pattern Recognition";
  gameId: CognitiveGameType;
  gameName: string;
  score: number; // 0-100
  accuracy: number; // 0-100
  difficultyLevel: DifficultyLevel;
  trend: "Improving" | "Stable" | "Practice Suggested";
  totalSessions: number;
  lastPlayedTimestamp: number | null;
}

export interface UnifiedCognitiveProfile {
  overallScore: number; // 0-100
  domains: {
    memory: CognitiveDomainPerformance;
    attention: CognitiveDomainPerformance;
    recall: CognitiveDomainPerformance;
    pattern: CognitiveDomainPerformance;
  };
  recommendedJourney: {
    gameId: CognitiveGameType;
    gameName: string;
    domain: string;
    icon: string;
    description: string;
    reason: string;
  }[];
  journeyHeadline: string;
  totalCompletedActivities: number;
}

export const GAME_METADATA: Record<
  CognitiveGameType,
  {
    name: string;
    domain: "Memory" | "Attention" | "Routine Recall" | "Pattern Recognition";
    icon: string;
    shortDesc: string;
    colorBg: string;
    badgeText: string;
  }
> = {
  "memory-match": {
    name: "Memory Match",
    domain: "Memory",
    icon: "🃏",
    shortDesc: "Pair friendly cards to exercise visual working memory.",
    colorBg: "bg-[#EDE7F6]",
    badgeText: "Working Memory",
  },
  "focus-finder": {
    name: "Focus Finder",
    domain: "Attention",
    icon: "🎯",
    shortDesc: "Spot target symbols and tune out gentle visual distractions.",
    colorBg: "bg-[#FFF3E0]",
    badgeText: "Attention & Focus",
  },
  "daily-life-recall": {
    name: "Daily Life Recall",
    domain: "Routine Recall",
    icon: "🗓️",
    shortDesc: "Reconstruct familiar morning and evening daily routines.",
    colorBg: "bg-[#E3F2FD]",
    badgeText: "Routine Recall",
  },
  "pattern-path": {
    name: "Pattern Path",
    domain: "Pattern Recognition",
    icon: "🧩",
    shortDesc: "Complete colorful visual sequences and shape patterns.",
    colorBg: "bg-[#F3E5F5]",
    badgeText: "Pattern & Logic",
  },
};

const STORAGE_PREFIX = "sahara_cognitive_level_";
const OFFLINE_QUEUE_KEY = "sahara_offline_game_results";

/**
 * Retrieves the daily difficulty for a specific game (Level 1 to Level 5).
 * Resets to Level 1 if on a brand new day unless already practiced today.
 */
export function getDailyGameDifficulty(gameId: CognitiveGameType): DifficultyLevel {
  try {
    const todayKey = new Date().toLocaleDateString("en-CA");
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
    if (!raw) return 1;

    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey) {
      // Gentle daily starting baseline
      saveDailyGameDifficulty(gameId, 1);
      return 1;
    }

    const lvl = Number(parsed.level);
    if (lvl >= 1 && lvl <= 5) {
      return lvl as DifficultyLevel;
    }
    return 1;
  } catch {
    return 1;
  }
}

/**
 * Saves the daily difficulty for a specific game.
 */
export function saveDailyGameDifficulty(
  gameId: CognitiveGameType,
  level: DifficultyLevel
): void {
  try {
    const todayKey = new Date().toLocaleDateString("en-CA");
    const clamped = Math.max(1, Math.min(5, Math.round(level))) as DifficultyLevel;
    localStorage.setItem(
      `${STORAGE_PREFIX}${gameId}`,
      JSON.stringify({ date: todayKey, level: clamped })
    );
  } catch {
    // Ignore storage quota limits
  }
}

/**
 * Computes a normalized performance score (0 to 100) tailored to each game's telemetry.
 * Weightings:
 * - Accuracy: highest importance
 * - Mistakes: negative factor
 * - Response / completion efficiency: secondary factor
 * - Hints: slight negative/neutral factor
 * - Hesitation: secondary factor
 */
export function calculateNormalizedScore(
  gameType: CognitiveGameType,
  metrics: GamePerformanceMetrics
): number {
  const {
    accuracy,
    incorrectAttempts,
    completionTimeSeconds,
    averageResponseTimeSeconds,
    hintsUsed,
    hesitationCount,
  } = metrics;

  const clampedAcc = Math.max(0, Math.min(100, accuracy));
  let baseScore = 0;

  switch (gameType) {
    case "memory-match": {
      // Accuracy counts for 60%
      const accScore = clampedAcc * 0.60;
      // Target time based on pairs (e.g. 5 pairs -> ~40s is great)
      const pairs = metrics.pairsCount || 4;
      const expectedSeconds = pairs * 9;
      const timeEfficiency = Math.max(
        0,
        Math.min(100, 100 - ((completionTimeSeconds - expectedSeconds) / (expectedSeconds * 1.5)) * 50)
      );
      const timeScore = timeEfficiency * 0.25;
      const mistakePenalty = Math.min(25, incorrectAttempts * 4);
      const hintPenalty = hintsUsed * 3;
      const hesitationPenalty = Math.min(15, hesitationCount * 2);

      baseScore = accScore + timeScore - mistakePenalty - hintPenalty - hesitationPenalty;
      break;
    }

    case "focus-finder": {
      // Attention task: accuracy 65% + response speed 25%
      const accScore = clampedAcc * 0.65;
      // Fast target identification: <= 3s is 100, 6s is 70, > 9s drops
      const speedScore = Math.max(
        10,
        Math.min(100, 100 - Math.max(0, averageResponseTimeSeconds - 2.5) * 12)
      ) * 0.25;
      const mistakePenalty = Math.min(25, incorrectAttempts * 5);
      const hintPenalty = hintsUsed * 4;
      const hesitationPenalty = Math.min(15, hesitationCount * 3);

      baseScore = accScore + speedScore - mistakePenalty - hintPenalty - hesitationPenalty;
      break;
    }

    case "daily-life-recall": {
      // Routine sequencing: accuracy 70% + steady sequencing 20%
      const accScore = clampedAcc * 0.70;
      const timeEfficiency = Math.max(
        20,
        Math.min(100, 100 - Math.max(0, completionTimeSeconds - 20) * 1.5)
      ) * 0.20;
      const mistakePenalty = Math.min(25, incorrectAttempts * 6);
      const hintPenalty = hintsUsed * 4;
      const hesitationPenalty = Math.min(15, hesitationCount * 2.5);

      baseScore = accScore + timeEfficiency - mistakePenalty - hintPenalty - hesitationPenalty;
      break;
    }

    case "pattern-path": {
      // Pattern recognition: accuracy 70% + speed 20%
      const accScore = clampedAcc * 0.70;
      const speedScore = Math.max(
        20,
        Math.min(100, 100 - Math.max(0, averageResponseTimeSeconds - 3) * 10)
      ) * 0.20;
      const mistakePenalty = Math.min(25, incorrectAttempts * 5);
      const hintPenalty = hintsUsed * 4;
      const hesitationPenalty = Math.min(15, hesitationCount * 2.5);

      baseScore = accScore + speedScore - mistakePenalty - hintPenalty - hesitationPenalty;
      break;
    }
  }

  // Bound deterministically between 5 and 100
  return Math.max(5, Math.min(100, Math.round(baseScore)));
}

/**
 * Common Adaptive Cognitive Engine
 * 
 * Reusable across all four games:
 * Evaluates performance metrics, determines normalized score (0-100),
 * and calculates the next difficulty (Level 1 to Level 5) using a stable threshold system.
 */
export function getNextDifficulty(
  currentDifficulty: DifficultyLevel,
  performanceMetrics: GamePerformanceMetrics,
  gameType: CognitiveGameType
): AdaptiveEngineOutput {
  const normalizedScore = calculateNormalizedScore(gameType, performanceMetrics);
  const { incorrectAttempts, accuracy, averageResponseTimeSeconds } = performanceMetrics;

  let nextDifficulty: DifficultyLevel = currentDifficulty;
  let levelChange: "increased" | "decreased" | "maintained" = "maintained";
  let feedbackMessage = "";
  let supportiveNote = "";

// Elder-friendly adaptive thresholds
// Score 50 or above → increase one level
const isStrong =
  normalizedScore >= 50;

// Score below 35 → decrease one level
const isChallenged =
  normalizedScore < 35;

if (isStrong) {
  if (currentDifficulty < 5) {
    nextDifficulty = (currentDifficulty + 1) as DifficultyLevel;
    levelChange = "increased";
    feedbackMessage = `Great work! Your next level is Level ${nextDifficulty}.`;
    supportiveNote =
      "Wonderful progress! You are ready for a gentle new challenge.";
  } else {
    nextDifficulty = 5;
    levelChange = "maintained";
    feedbackMessage = "Excellent work! You have reached Level 5.";
    supportiveNote =
      "Outstanding focus! You are continuing at the highest challenge level.";
  }
} else if (isChallenged) {
  if (currentDifficulty > 1) {
    nextDifficulty = (currentDifficulty - 1) as DifficultyLevel;
    levelChange = "decreased";
    feedbackMessage =
      `Let's make the next round a little easier at Level ${nextDifficulty}.`;
    supportiveNote =
      "Taking a gentler pace can make the activity more comfortable.";
  } else {
    nextDifficulty = 1;
    levelChange = "maintained";
    feedbackMessage =
      "Good effort! We'll continue with comfortable Level 1 practice.";
    supportiveNote =
      "Take your time and enjoy practicing at your own pace.";
  }
} else {
  nextDifficulty = currentDifficulty;
  levelChange = "maintained";
  feedbackMessage =
    `Nice steady work! Let's practice Level ${currentDifficulty} again.`;
  supportiveNote =
    "Building confidence through comfortable, steady practice.";
}

  return {
    nextDifficulty,
    levelChange,
    normalizedScore,
    feedbackMessage,
    supportiveNote,
  };
}

/**
 * Computes a unified cross-game cognitive profile from historical game records.
 * Provides separate metrics for:
 * - Memory (working memory)
 * - Attention (concentration)
 * - Routine Recall (short-term sequencing)
 * - Pattern Recognition (pattern recognition & visual reasoning)
 * 
 * Also generates "Today's Cognitive Journey" personalized recommendation.
 */
export function buildUnifiedCognitiveProfile(
  records: any[]
): UnifiedCognitiveProfile {
  const domainBuckets: Record<
    CognitiveGameType,
    {
      scores: number[];
      accuracies: number[];
      difficulties: number[];
      timestamps: number[];
    }
  > = {
    "memory-match": { scores: [], accuracies: [], difficulties: [], timestamps: [] },
    "focus-finder": { scores: [], accuracies: [], difficulties: [], timestamps: [] },
    "daily-life-recall": { scores: [], accuracies: [], difficulties: [], timestamps: [] },
    "pattern-path": { scores: [], accuracies: [], difficulties: [], timestamps: [] },
  };

  // Classify records by game
  records.forEach((r) => {
    const gName = String(r.gameName || "").toLowerCase();
    const gId = String(r.gameId || "").toLowerCase();

    let key: CognitiveGameType | null = null;
    if (gId === "memory-match" || gName.includes("memory match")) key = "memory-match";
    else if (gId === "focus-finder" || gName.includes("focus finder")) key = "focus-finder";
    else if (gId === "daily-life-recall" || gName.includes("daily life") || gName.includes("routine"))
      key = "daily-life-recall";
    else if (gId === "pattern-path" || gName.includes("pattern path") || gName.includes("pattern"))
      key = "pattern-path";
    else if (gName.includes("picture recall")) key = "daily-life-recall"; // Map legacy games gently
    else if (gName.includes("familiar place")) key = "memory-match";

    if (!key) return;

    const maxSc = r.maxScore || (key === "memory-match" ? 20 : 100);
    const rawScore = Number(r.score || 0);
    const normalized =
      maxSc <= 20
        ? Math.round((rawScore / maxSc) * 100)
        : Math.min(100, Math.max(0, rawScore));

    const accuracy =
      typeof r.accuracy === "number" ? r.accuracy : normalized;
    const diff = Number(r.difficultyLevel || 1);
    const ts = r.timestamp || (r.completedAt?.toDate?.() ? r.completedAt.toDate().getTime() : Date.now());

    domainBuckets[key].scores.push(normalized);
    domainBuckets[key].accuracies.push(accuracy);
    domainBuckets[key].difficulties.push(diff);
    domainBuckets[key].timestamps.push(ts);
  });

  const getDomainStat = (
    gameId: CognitiveGameType,
    domain: "Memory" | "Attention" | "Routine Recall" | "Pattern Recognition"
  ): CognitiveDomainPerformance => {
    const bucket = domainBuckets[gameId];
    const total = bucket.scores.length;

    if (total === 0) {
      return {
        domain,
        gameId,
        gameName: GAME_METADATA[gameId].name,
        score: 70, // Balanced baseline
        accuracy: 75,
        difficultyLevel: getDailyGameDifficulty(gameId),
        trend: "Stable",
        totalSessions: 0,
        lastPlayedTimestamp: null,
      };
    }

    const avgScore = Math.round(
      bucket.scores.reduce((a, b) => a + b, 0) / total
    );
    const avgAcc = Math.round(
      bucket.accuracies.reduce((a, b) => a + b, 0) / total
    );
    const latestDiff = (bucket.difficulties[bucket.difficulties.length - 1] || 1) as DifficultyLevel;
    const latestTs = bucket.timestamps[bucket.timestamps.length - 1];

    // Compute simple trend if at least 2 sessions
    let trend: "Improving" | "Stable" | "Practice Suggested" = "Stable";
    if (total >= 2) {
      const half = Math.floor(total / 2);
      const early = bucket.scores.slice(0, half);
      const recent = bucket.scores.slice(half);
      const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const delta = recentAvg - earlyAvg;
      if (delta >= 6) trend = "Improving";
      else if (delta <= -7) trend = "Practice Suggested";
      else trend = "Stable";
    }

    return {
      domain,
      gameId,
      gameName: GAME_METADATA[gameId].name,
      score: avgScore,
      accuracy: avgAcc,
      difficultyLevel: latestDiff,
      trend,
      totalSessions: total,
      lastPlayedTimestamp: latestTs,
    };
  };

  const memory = getDomainStat("memory-match", "Memory");
  const attention = getDomainStat("focus-finder", "Attention");
  const recall = getDomainStat("daily-life-recall", "Routine Recall");
  const pattern = getDomainStat("pattern-path", "Pattern Recognition");

  const overallScore = Math.round(
    memory.score * 0.30 +
    attention.score * 0.25 +
    recall.score * 0.25 +
    pattern.score * 0.20
  );

  // Generate "Today's Cognitive Journey"
  // Order activities adaptively:
  // 1. Identify which domain could use the gentlest practice or hasn't been played today
  // 2. Pair with a high-confidence domain
  // 3. Round out with a third refreshing activity
  const domainList = [
    { ...attention, priority: attention.score < 65 ? 10 : 5 },
    { ...memory, priority: memory.score < 65 ? 9 : 4 },
    { ...recall, priority: recall.score < 65 ? 8 : 3 },
    { ...pattern, priority: pattern.score < 65 ? 7 : 2 },
  ].sort((a, b) => b.priority - a.priority);

  const recommendedJourney = domainList.map((d) => ({
    gameId: d.gameId,
    gameName: d.gameName,
    domain: d.domain,
    icon: GAME_METADATA[d.gameId].icon,
    description: GAME_METADATA[d.gameId].shortDesc,
    reason:
      d.totalSessions === 0
        ? "Great session to start today's baseline."
        : d.trend === "Improving"
        ? "Strong momentum! Perfect for regular maintenance."
        : d.score < 70
        ? "Gentle practice to build confidence in this domain."
        : "Steady engagement to keep cognitive skills active.",
  }));

  let journeyHeadline = "Balanced 4-part cognitive journey ready for today.";
  if (attention.score < 65) {
    journeyHeadline = "Starting with Focus Finder for gentle attention exercise.";
  } else if (memory.trend === "Improving") {
    journeyHeadline = "Memory practice is progressing nicely; ready for today's quest.";
  }

  return {
    overallScore,
    domains: {
      memory,
      attention,
      recall,
      pattern,
    },
    recommendedJourney,
    journeyHeadline,
    totalCompletedActivities: records.length,
  };
}

// ─── Memory Match Adaptive Helpers ────────────────────────────────────────────

export type MemoryMatchLevel = DifficultyLevel;

export interface AdaptiveResult {
  nextLevel: MemoryMatchLevel;
  levelChange: "increased" | "decreased" | "maintained";
  normalizedScore: number;
  feedbackMessage: string;
  supportiveNote: string;
}

export const PAIRS_PER_LEVEL: Record<MemoryMatchLevel, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 7,
  5: 8,
};

/**
 * Gets today's adaptive Memory Match level.
 */
export function getDailyAdaptiveLevel(): MemoryMatchLevel {
  return getDailyGameDifficulty("memory-match");
}

/**
 * Saves today's adaptive Memory Match level.
 */
export function saveDailyAdaptiveLevel(
  level: MemoryMatchLevel
): void {
  saveDailyGameDifficulty("memory-match", level);
}

/**
 * Evaluates a completed Memory Match round and determines
 * the difficulty for the next round.
 */
export function evaluateMemoryMatchPerformance(input: {
  currentLevel: MemoryMatchLevel;
  moves: number;
  pairsCount: number;
  incorrectAttempts: number;
  accuracy: number;
  completionTimeSeconds: number;
  averageResponseTimeSeconds: number;
  hesitationCount: number;
}): AdaptiveResult {
  const evaluation = getNextDifficulty(
    input.currentLevel,
    {
      currentDifficulty: input.currentLevel,
      accuracy: input.accuracy,
      incorrectAttempts: input.incorrectAttempts,
      moves: input.moves,
      pairsCount: input.pairsCount,
      completionTimeSeconds: input.completionTimeSeconds,
      averageResponseTimeSeconds:
        input.averageResponseTimeSeconds,
      hintsUsed: 0,
      hesitationCount: input.hesitationCount,
    },
    "memory-match"
  );

  return {
    nextLevel: evaluation.nextDifficulty,
    levelChange: evaluation.levelChange,
    normalizedScore: evaluation.normalizedScore,
    feedbackMessage: evaluation.feedbackMessage,
    supportiveNote: evaluation.supportiveNote,
  };
}
export type GameTelemetryInput = Omit<GameTelemetryRecord, "patientId" | "timestamp"> & {
  patientId?: string;
  timestamp?: number;
};

/**
 * Offline-resilient game telemetry saving.
 * - Writes to Firestore if online.
 * - Uses clientSubmissionId as document ID for zero-duplicate idempotency.
 * - Queues to localStorage when offline and flushes upon network reconnection.
 */
export async function saveGameTelemetryWithSync(
  input: GameTelemetryInput
): Promise<boolean> {
  const patientId = input.patientId || auth.currentUser?.uid || "anonymous_patient";
  const timestamp = input.timestamp || Date.now();
  const domain =
    input.cognitiveDomain ||
    (input.gameId === "memory-match"
      ? "Memory"
      : input.gameId === "focus-finder"
      ? "Attention"
      : input.gameId === "daily-life-recall"
      ? "Routine Recall"
      : "Pattern Recognition");

  const record: GameTelemetryRecord = {
    ...input,
    patientId,
    timestamp,
    cognitiveDomain: domain,
    completionStatus: input.completionStatus || "completed",
  };

  // Update local daily difficulty cache immediately
  saveDailyGameDifficulty(record.gameId, record.nextDifficultyLevel);

  const submissionDoc = {
    ...record,
    completedAt: serverTimestamp(),
  };

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const docRef = doc(
        db,
        "patients",
        record.patientId,
        "gameResults",
        record.clientSubmissionId
      );
      await setDoc(docRef, submissionDoc);
      console.log(`[CognitiveEngine] Game saved to Firebase: ${record.clientSubmissionId}`);
      // Attempt to flush any previously queued offline records
      flushOfflineGameResults(record.patientId).catch(() => {});
      return true;
    } catch (err) {
      console.warn("[CognitiveEngine] Firebase write failed, queuing locally:", err);
    }
  }

  // Queue locally if offline or network write rejected
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: GameTelemetryRecord[] = raw ? JSON.parse(raw) : [];
    // Ensure no duplicates in queue
    if (!queue.some((item) => item.clientSubmissionId === record.clientSubmissionId)) {
      queue.push(record);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`[CognitiveEngine] Queued offline game record: ${record.clientSubmissionId}`);
    }
  } catch (queueErr) {
    console.error("[CognitiveEngine] Failed to write offline queue:", queueErr);
  }

  return false;
}

/**
 * Flushes pending offline records to Firebase without creating duplicates.
 */
export async function flushOfflineGameResults(patientId: string): Promise<number> {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return 0;

    const queue: GameTelemetryRecord[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return 0;

    const remaining: GameTelemetryRecord[] = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const docRef = doc(
          db,
          "patients",
          patientId || item.patientId,
          "gameResults",
          item.clientSubmissionId
        );
        await setDoc(docRef, {
          ...item,
          completedAt: serverTimestamp(),
        });
        syncedCount += 1;
      } catch (err) {
        remaining.push(item);
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    if (syncedCount > 0) {
      console.log(`[CognitiveEngine] Synced ${syncedCount} offline game records.`);
    }
    return syncedCount;
  } catch (err) {
    console.error("[CognitiveEngine] Error flushing offline queue:", err);
    return 0;
  }
}
