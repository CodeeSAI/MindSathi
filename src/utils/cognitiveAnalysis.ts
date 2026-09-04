/**
 * Cognitive Performance Analysis Utility (Caregiver Dashboard)
 * 
 * Computes deterministic, non-diagnostic gameplay performance indicators (0-100)
 * derived purely from the patient's Firebase gameResults collection.
 * 
 * NOTE: These indicators are strictly gameplay-performance reflections and do NOT
 * provide medical diagnosis or cognitive impairment clinical assessment.
 */

export interface RawGameRecord {
  id?: string;
  gameId?: string;
  gameName: string;
  score: number;
  maxScore?: number;
  starsEarned?: number;
  difficultyLevel?: number;
  moves?: number;
  pairsCount?: number;
  accuracy?: number;
  completionTimeSeconds?: number;
  averageResponseTimeSeconds?: number;
  incorrectAttempts?: number;
  hintsUsed?: number;
  hesitationCount?: number;
  completedAt?: any;
  timestamp?: number;
}

export interface GameDomainMetric {
  name: string;
  domain: string;
  score: number; // 0-100
  accuracy: number; // 0-100
  difficultyLevel: number;
  trend: "Improving" | "Stable" | "Practice Suggested";
  sessionsCount: number;
}

export interface CognitiveAnalysisResult {
  hasEnoughData: boolean;
  totalGamesAnalyzed: number;
  overallScore: number;          // 0-100
  memoryScore: number;           // 0-100
  attentionRecallScore: number;  // 0-100
  responseSpeedScore: number;    // 0-100
  recentTrend: "Improving" | "Stable" | "Needs Attention";
  trendDelta: number;
  recommendation: string;
  summaryNote: string;
  // Four Primary Cognitive Activities
  games: {
    memoryMatch: GameDomainMetric;
    focusFinder: GameDomainMetric;
    dailyLifeRecall: GameDomainMetric;
    patternPath: GameDomainMetric;
  };
}

const DEFAULT_GAMES_METRICS = {
  memoryMatch: {
    name: "Memory Match",
    domain: "Working Memory",
    score: 0,
    accuracy: 0,
    difficultyLevel: 1,
    trend: "Stable" as const,
    sessionsCount: 0,
  },
  focusFinder: {
    name: "Focus Finder",
    domain: "Attention & Focus",
    score: 0,
    accuracy: 0,
    difficultyLevel: 1,
    trend: "Stable" as const,
    sessionsCount: 0,
  },
  dailyLifeRecall: {
    name: "Daily Life Recall",
    domain: "Routine Recall",
    score: 0,
    accuracy: 0,
    difficultyLevel: 1,
    trend: "Stable" as const,
    sessionsCount: 0,
  },
  patternPath: {
    name: "Pattern Path",
    domain: "Pattern Recognition",
    score: 0,
    accuracy: 0,
    difficultyLevel: 1,
    trend: "Stable" as const,
    sessionsCount: 0,
  },
};

export function computeCognitiveInsights(games: RawGameRecord[]): CognitiveAnalysisResult {
  if (!games || games.length === 0) {
    return {
      hasEnoughData: false,
      totalGamesAnalyzed: 0,
      overallScore: 0,
      memoryScore: 0,
      attentionRecallScore: 0,
      responseSpeedScore: 0,
      recentTrend: "Stable",
      trendDelta: 0,
      recommendation: "Not enough gameplay data yet.",
      summaryNote: "Play cognitive games to begin generating non-diagnostic performance insights.",
      games: DEFAULT_GAMES_METRICS,
    };
  }

  // Normalize timestamps and sort chronologically (oldest -> newest)
  const normalized = games.map((g) => {
    let ts = 0;
    if (g.timestamp) {
      ts = g.timestamp;
    } else if (g.completedAt?.toMillis) {
      ts = g.completedAt.toMillis();
    } else if (g.completedAt?.toDate) {
      ts = g.completedAt.toDate().getTime();
    } else if (g.completedAt instanceof Date) {
      ts = g.completedAt.getTime();
    }

    const maxScore = g.maxScore || (g.gameName.includes("Memory Match") ? 20 : 5);
    const scoreFraction = maxScore > 0 ? Math.min(1, Math.max(0, g.score / maxScore)) : 0;
    const accuracy = typeof g.accuracy === "number" ? Math.min(100, Math.max(0, g.accuracy)) : Math.round(scoreFraction * 100);

    return {
      ...g,
      timestamp: ts,
      maxScore,
      scorePercentage: accuracy,
    };
  }).sort((a, b) => a.timestamp - b.timestamp);

  const totalCount = normalized.length;

  // 1. Memory Specific Score (Memory Match & Familiar Place)
  const memoryGames = normalized.filter(
    (g) => g.gameName.includes("Memory Match") || g.gameName.includes("Familiar Place")
  );
  let memoryScore = 0;
  if (memoryGames.length > 0) {
    const sum = memoryGames.reduce((acc, g) => acc + g.scorePercentage, 0);
    memoryScore = Math.round(sum / memoryGames.length);
  } else {
    // Fall back to average of all games
    memoryScore = Math.round(normalized.reduce((acc, g) => acc + g.scorePercentage, 0) / totalCount);
  }

  // 2. Attention & Recall Score (Picture Recall & Familiar Place)
  const recallGames = normalized.filter(
    (g) => g.gameName.includes("Picture Recall") || g.gameName.includes("Familiar Place")
  );
  let attentionRecallScore = 0;
  if (recallGames.length > 0) {
    const sum = recallGames.reduce((acc, g) => acc + g.scorePercentage, 0);
    attentionRecallScore = Math.round(sum / recallGames.length);
  } else {
    // Fall back to general score
    attentionRecallScore = Math.round(normalized.reduce((acc, g) => acc + g.scorePercentage, 0) / totalCount);
  }

  // 3. Response Speed & Efficiency Score (Moves per pair & response time)
  let speedScores: number[] = [];
  normalized.forEach((g) => {
    if (g.gameName.includes("Memory Match")) {
      const pairs = g.pairsCount || 4;
      const moves = g.moves || pairs * 2;
      // Ideal moves: ~1.5x pairs. Ratio of minimum possible moves to actual
      const efficiency = Math.max(30, Math.min(100, Math.round((pairs / Math.max(pairs, moves)) * 130)));
      speedScores.push(efficiency);
    } else if (g.completionTimeSeconds && g.completionTimeSeconds > 0) {
      // Faster completion maps to higher speed score (scaled between 20s and 120s)
      const timeScore = Math.max(30, Math.min(100, Math.round(100 - ((g.completionTimeSeconds - 20) / 100) * 50)));
      speedScores.push(timeScore);
    } else {
      // Use score percentage as proxy
      speedScores.push(Math.max(40, Math.min(95, g.scorePercentage)));
    }
  });
  const responseSpeedScore = Math.round(speedScores.reduce((a, b) => a + b, 0) / speedScores.length);

  // 4. Overall Cognitive Performance (Weighted combination)
  const overallScore = Math.min(100, Math.max(10, Math.round(
    memoryScore * 0.45 + attentionRecallScore * 0.35 + responseSpeedScore * 0.20
  )));

  // 5. Recent Trend Comparison (Split older vs recent half)
  let recentTrend: "Improving" | "Stable" | "Needs Attention" = "Stable";
  let trendDelta = 0;

  if (totalCount >= 2) {
    const mid = Math.floor(totalCount / 2);
    const olderGames = normalized.slice(0, mid);
    const recentGames = normalized.slice(mid);

    const olderAvg = olderGames.reduce((acc, g) => acc + g.scorePercentage, 0) / olderGames.length;
    const recentAvg = recentGames.reduce((acc, g) => acc + g.scorePercentage, 0) / recentGames.length;

    trendDelta = Math.round(recentAvg - olderAvg);

    if (trendDelta >= 5) {
      recentTrend = "Improving";
    } else if (trendDelta <= -6) {
      recentTrend = "Needs Attention";
    } else {
      recentTrend = "Stable";
    }
  }

  // 6. Generate Contextual, Non-Diagnostic Recommendations based purely on observed game data
  let recommendation = "Continue moderate memory exercises.";
  if (totalCount === 1) {
    recommendation = "Great start! Continue daily gameplay to establish an accurate performance baseline.";
  } else if (recentTrend === "Improving" && overallScore >= 75) {
    recommendation = "Performance is improving; difficulty can increase gradually.";
  } else if (recentTrend === "Needs Attention") {
    if (memoryScore < attentionRecallScore) {
      recommendation = "Consider gentle Memory Match practice with smaller card sets.";
    } else {
      recommendation = "Consider more Picture Recall practice at a relaxed pace.";
    }
  } else if (overallScore >= 80) {
    recommendation = "Excellent consistency across sessions. Maintain current daily routine.";
  } else if (attentionRecallScore < 65) {
    recommendation = "Consider more Picture Recall and Familiar Place visual exercises.";
  } else {
    recommendation = "Continue moderate memory exercises and daily Brain Quest routine.";
  }

  // 7. Individual Game Domain Telemetry Calculations
  const computeGameStats = (
    predicate: (g: (typeof normalized)[0]) => boolean,
    defaultName: string,
    defaultDomain: string
  ): GameDomainMetric => {
    const matching = normalized.filter(predicate);
    if (matching.length === 0) {
      return {
        name: defaultName,
        domain: defaultDomain,
        score: 0,
        accuracy: 0,
        difficultyLevel: 1,
        trend: "Stable",
        sessionsCount: 0,
      };
    }

    const latest = matching[matching.length - 1];
    const avgScore = Math.round(
      matching.reduce((acc, g) => acc + g.scorePercentage, 0) / matching.length
    );
    const accuracies = matching
      .map((g) => g.accuracy)
      .filter((a): a is number => typeof a === "number" && a > 0);
    const avgAccuracy =
      accuracies.length > 0
        ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
        : avgScore;

    let trend: "Improving" | "Stable" | "Practice Suggested" = "Stable";
    if (matching.length >= 2) {
      const firstScore = matching[0].scorePercentage;
      const lastScore = latest.scorePercentage;
      if (lastScore - firstScore >= 5) trend = "Improving";
      else if (firstScore - lastScore >= 8) trend = "Practice Suggested";
    }

    return {
      name: defaultName,
      domain: defaultDomain,
      score: avgScore,
      accuracy: avgAccuracy,
      difficultyLevel: latest.difficultyLevel || 1,
      trend,
      sessionsCount: matching.length,
    };
  };

  const gamesMetrics = {
    memoryMatch: computeGameStats(
      (g) => g.gameName.includes("Memory Match") || g.gameId === "memory-match",
      "Memory Match",
      "Working Memory"
    ),
    focusFinder: computeGameStats(
      (g) => g.gameName.includes("Focus Finder") || g.gameId === "focus-finder",
      "Focus Finder",
      "Attention & Focus"
    ),
    dailyLifeRecall: computeGameStats(
      (g) =>
        g.gameName.includes("Daily Life") ||
        g.gameName.includes("Picture Recall") ||
        g.gameId === "daily-life-recall",
      "Daily Life Recall",
      "Routine Recall"
    ),
    patternPath: computeGameStats(
      (g) => g.gameName.includes("Pattern Path") || g.gameId === "pattern-path",
      "Pattern Path",
      "Pattern Recognition"
    ),
  };

  return {
    hasEnoughData: true,
    totalGamesAnalyzed: totalCount,
    overallScore,
    memoryScore,
    attentionRecallScore,
    responseSpeedScore,
    recentTrend,
    trendDelta,
    recommendation,
    summaryNote: "Based on actual patient gameplay telemetry and score trends.",
    games: gamesMetrics,
  };
}
