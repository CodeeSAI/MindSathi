/**
 * Adaptive Cognitive Game Difficulty Engine
 *
 * Lightweight, deterministic intelligence engine for Memory Match.
 * Adapts difficulty safely within Levels 1 to 5 based on:
 * - Accuracy and incorrect attempts
 * - Completion time & response time
 * - Hesitation / idle pauses
 *
 * Safety & Medical Guardrails:
 * - Deterministic logic only (no external AI calls)
 * - Safe clamping: Level 1 (easiest, 4 pairs) to Level 5 (hardest, 8 pairs)
 * - Daily difficulty reset on each new day
 * - Supportive wording without medical diagnosis
 */

import {
  getNextDifficulty,
  CognitiveGameType,
  DifficultyLevel,
} from "../services/adaptiveCognitiveEngine";

export type MemoryMatchLevel = 1 | 2 | 3 | 4 | 5;

export const PAIRS_PER_LEVEL: Record<MemoryMatchLevel, number> = {
  1: 4, // 8 cards
  2: 5, // 10 cards
  3: 6, // 12 cards
  4: 7, // 14 cards
  5: 8, // 16 cards
};

export const DEFAULT_DAILY_LEVEL: MemoryMatchLevel = 1;

const STORAGE_KEY_PREFIX = "sahara_cognitive_level_memory-match";

export interface PerformanceMetrics {
  currentLevel: MemoryMatchLevel;
  moves: number;
  pairsCount: number;
  incorrectAttempts: number;
  accuracy: number; // 0 to 100
  completionTimeSeconds: number;
  averageResponseTimeSeconds: number;
  hesitationCount: number;
  hintsUsed?: number;
}

export interface AdaptiveResult {
  nextLevel: MemoryMatchLevel;
  levelChanged: "increased" | "decreased" | "maintained";
  uiFeedbackMessage: string;
  supportiveNote: string;
  normalizedScore?: number;
}

/**
 * Retrieves the patient's daily adaptive level.
 * Automatically resets to the default level on a new day.
 */
export function getDailyAdaptiveLevel(): MemoryMatchLevel {
  try {
    const todayKey = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}`);
    if (!raw) return DEFAULT_DAILY_LEVEL;

    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey) {
      // New day: perform daily difficulty reset
      saveDailyAdaptiveLevel(DEFAULT_DAILY_LEVEL);
      return DEFAULT_DAILY_LEVEL;
    }

    const lvl = Number(parsed.level);
    if (lvl >= 1 && lvl <= 5) {
      return lvl as MemoryMatchLevel;
    }
    return DEFAULT_DAILY_LEVEL;
  } catch {
    return DEFAULT_DAILY_LEVEL;
  }
}

/**
 * Saves the current adaptive level for today.
 */
export function saveDailyAdaptiveLevel(level: MemoryMatchLevel): void {
  try {
    const todayKey = new Date().toLocaleDateString("en-CA");
    const clampedLevel = Math.max(1, Math.min(5, level)) as MemoryMatchLevel;
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}`,
      JSON.stringify({ date: todayKey, level: clampedLevel })
    );
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Evaluates performance deterministically using the common Adaptive Cognitive Engine.
 */
export function evaluateMemoryMatchPerformance(
  metrics: PerformanceMetrics
): AdaptiveResult {
  const result = getNextDifficulty(
    metrics.currentLevel as DifficultyLevel,
    {
      currentDifficulty: metrics.currentLevel as DifficultyLevel,
      accuracy: metrics.accuracy,
      incorrectAttempts: metrics.incorrectAttempts,
      moves: metrics.moves,
      pairsCount: metrics.pairsCount,
      completionTimeSeconds: metrics.completionTimeSeconds,
      averageResponseTimeSeconds: metrics.averageResponseTimeSeconds,
      hintsUsed: metrics.hintsUsed || 0,
      hesitationCount: metrics.hesitationCount,
    },
    "memory-match"
  );

  return {
    nextLevel: result.nextDifficulty as MemoryMatchLevel,
    levelChanged: result.levelChange,
    uiFeedbackMessage: `AI adjusted your next level to ${result.nextDifficulty} because of your performance.`,
    supportiveNote: result.supportiveNote,
    normalizedScore: result.normalizedScore,
  };
}

