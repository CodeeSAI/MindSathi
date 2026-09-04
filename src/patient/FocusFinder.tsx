import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import {
  DifficultyLevel,
  getNextDifficulty,
  getDailyGameDifficulty,
  saveDailyGameDifficulty,
  saveGameTelemetryWithSync,
  AdaptiveEngineOutput,
} from "../services/adaptiveCognitiveEngine";

interface TargetDefinition {
  name: string;
  emoji: string;
  distractors: string[];
  theme: string;
}

const TARGET_POOL: TargetDefinition[] = [
  {
    name: "Red Apple",
    emoji: "🍎",
    distractors: ["🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🫐", "🍒", "🍓", "🥝"],
    theme: "Fresh Fruits",
  },
  {
    name: "Golden Sunflower",
    emoji: "🌻",
    distractors: ["🌹", "🌷", "🌺", "🌸", "🌼", "🌿", "🍀", "🍃", "🪴", "🌾"],
    theme: "Sunny Garden",
  },
  {
    name: "Warm Teacup",
    emoji: "☕",
    distractors: ["🫖", "🥛", "🧃", "🥣", "🍶", "🫗", "🍯", "🥤", "🧂", "🥢"],
    theme: "Morning Kitchen",
  },
  {
    name: "Brass Key",
    emoji: "🔑",
    distractors: ["🔒", "🔓", "🚪", "🛎️", "🔔", "⏰", "🪙", "🏷️", "🧷", "📎"],
    theme: "Cozy Home",
  },
  {
    name: "Blue Butterfly",
    emoji: "🦋",
    distractors: ["🐝", "🐞", "🐛", "🦗", "🕊️", "🌸", "🌿", "🍃", "🌻", "🌼"],
    theme: "Nature Park",
  },
  {
    name: "Grandfather Clock",
    emoji: "🕰️",
    distractors: ["⏰", "⏱️", "⌛", "⏳", "🕯️", "📻", "📺", "🖼️", "🏺", "🛋️"],
    theme: "Living Room",
  },
];

const OBJECTS_PER_LEVEL: Record<DifficultyLevel, number> = {
  1: 6,
  2: 9,
  3: 12,
  4: 16,
  5: 20,
};

const GRID_COLS_PER_LEVEL: Record<DifficultyLevel, string> = {
  1: "grid-cols-3",
  2: "grid-cols-3",
  3: "grid-cols-4",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export function FocusFinder({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState<DifficultyLevel>(() =>
    getDailyGameDifficulty("focus-finder")
  );

  const TOTAL_ROUNDS = 4;
  const [currentRound, setCurrentRound] = useState(0);

  // Round specific items
  const [currentTarget, setCurrentTarget] = useState<TargetDefinition>(TARGET_POOL[0]);
  const [gridItems, setGridItems] = useState<{ id: number; emoji: string; isTarget: boolean }[]>([]);
  const [eliminatedIds, setEliminatedIds] = useState<number[]>([]);
  const [highlightTarget, setHighlightTarget] = useState(false);

  // Round telemetry
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Timers & reaction measurements
  const roundStartTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(Date.now());
  const lastActionTimeRef = useRef<number>(Date.now());
  const responseTimesRef = useRef<number[]>([]);
  const resultSavedRef = useRef(false);

  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveEngineOutput | null>(null);

  // Build items for a specific round & level
  const setupRound = (roundIdx: number, lvl: DifficultyLevel) => {
    const target = TARGET_POOL[roundIdx % TARGET_POOL.length];
    setCurrentTarget(target);
    setEliminatedIds([]);
    setHighlightTarget(false);

    const totalSlots = OBJECTS_PER_LEVEL[lvl];
    const distractorPool = [...target.distractors];

    // Pick distractors
    const chosenDistractors: string[] = [];
    while (chosenDistractors.length < totalSlots - 1) {
      const idx = chosenDistractors.length % distractorPool.length;
      chosenDistractors.push(distractorPool[idx]);
    }

    // Insert target at random slot
    const all = [
      { id: 0, emoji: target.emoji, isTarget: true },
      ...chosenDistractors.map((d, i) => ({ id: i + 1, emoji: d, isTarget: false })),
    ].sort(() => Math.random() - 0.5);

    setGridItems(all);
    roundStartTimeRef.current = Date.now();
    lastActionTimeRef.current = Date.now();
  };

  // Start new game session
  useEffect(() => {
    gameStartTimeRef.current = Date.now();
    setupRound(0, level);
  }, []);

  // Check idle hesitation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isGameOver) return;
      if (Date.now() - lastActionTimeRef.current > 6000) {
        setHesitationCount((h) => h + 1);
        lastActionTimeRef.current = Date.now();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver]);

  const handleSelectObject = (item: { id: number; emoji: string; isTarget: boolean }) => {
    if (isGameOver || eliminatedIds.includes(item.id)) return;

    const now = Date.now();
    const rt = (now - roundStartTimeRef.current) / 1000;
    responseTimesRef.current.push(rt);
    lastActionTimeRef.current = now;

    if (item.isTarget) {
      setCorrectCount((c) => c + 1);

      if (currentRound + 1 >= TOTAL_ROUNDS) {
        // Complete Game
        finishGame(correctCount + 1, incorrectCount);
      } else {
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setupRound(nextRound, level);
      }
    } else {
      // Incorrect item tapped
      setIncorrectCount((inc) => inc + 1);
      setEliminatedIds((prev) => [...prev, item.id]);
    }
  };

  const handleUseHint = () => {
    if (isGameOver || highlightTarget) return;
    setHintsUsed((h) => h + 1);

    // Gently dim 2 non-target items
    const nonTargets = gridItems
      .filter((it) => !it.isTarget && !eliminatedIds.includes(it.id))
      .map((it) => it.id);

    if (nonTargets.length > 0) {
      const toEliminate = nonTargets.slice(0, 2);
      setEliminatedIds((prev) => [...prev, ...toEliminate]);
    }
    setHighlightTarget(true);
  };

  const finishGame = (finalCorrect: number, finalIncorrect: number) => {
    setIsGameOver(true);
    if (resultSavedRef.current) return;
    resultSavedRef.current = true;

    const totalSelections = finalCorrect + finalIncorrect;
    const rawAccuracy =
      totalSelections > 0
        ? Math.round((finalCorrect / totalSelections) * 100)
        : 100;
    const accuracy = Math.min(100, Math.max(10, rawAccuracy));

    const totalSeconds = Math.max(
      3,
      Math.round((Date.now() - gameStartTimeRef.current) / 1000)
    );
    const avgResponseTime =
      responseTimesRef.current.length > 0
        ? Number(
            (
              responseTimesRef.current.reduce((a, b) => a + b, 0) /
              responseTimesRef.current.length
            ).toFixed(1)
          )
        : 3.5;

    // Run shared Adaptive Engine
    const evalResult = getNextDifficulty(
      level,
      {
        currentDifficulty: level,
        accuracy,
        incorrectAttempts: finalIncorrect,
        completionTimeSeconds: totalSeconds,
        averageResponseTimeSeconds: avgResponseTime,
        hintsUsed,
        hesitationCount,
        totalRounds: TOTAL_ROUNDS,
        correctAnswers: finalCorrect,
      },
      "focus-finder"
    );

    setAdaptiveResult(evalResult);
    saveDailyGameDifficulty("focus-finder", evalResult.nextDifficulty);

    // Save with offline sync queue
    const user = auth.currentUser;
    const patientId = user ? user.uid : "demo_patient_ravi";

    saveGameTelemetryWithSync({
      patientId,
      gameId: "focus-finder",
      gameName: "Focus Finder",
      cognitiveDomain: "Attention",
      difficultyLevel: level,
      score: evalResult.normalizedScore,
      accuracy,
      completionTimeSeconds: totalSeconds,
      averageResponseTimeSeconds: avgResponseTime,
      incorrectAttempts: finalIncorrect,
      hintsUsed,
      hesitationCount,
      completionStatus: "completed",
      nextDifficultyLevel: evalResult.nextDifficulty,
      starsEarned: evalResult.normalizedScore >= 75 ? 20 : evalResult.normalizedScore >= 50 ? 15 : 10,
      clientSubmissionId: `${patientId}_ff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    });
  };

  const handlePlayNextRound = (targetLevel: DifficultyLevel) => {
    setLevel(targetLevel);
    setCurrentRound(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setHintsUsed(0);
    setHesitationCount(0);
    setIsGameOver(false);
    setAdaptiveResult(null);
    resultSavedRef.current = false;
    responseTimesRef.current = [];
    gameStartTimeRef.current = Date.now();
    setupRound(0, targetLevel);
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#2E7D73] to-[#1A5C54] text-white px-5 pt-4 pb-5 rounded-b-[28px] shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight">Focus Finder</h1>
            <p className="text-xs text-teal-100 font-semibold">
              Attention & Concentration • Level {level} of 5
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Dots */}
        {!isGameOver && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentRound
                    ? "w-7 bg-amber-300"
                    : idx < currentRound
                    ? "w-2 bg-white"
                    : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Game Screen */}
      <div className="flex-1 px-4 py-4 flex flex-col items-center justify-between overflow-y-auto">
        {!isGameOver ? (
          <>
            {/* Target Prompt Banner */}
            <div className="w-full max-w-sm bg-white border-2 border-teal-600/20 rounded-2xl p-4 shadow-sm text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                Round {currentRound + 1} of {TOTAL_ROUNDS}
              </span>
              <p className="text-sm text-slate-500 font-semibold mt-1">Tap the target symbol:</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-4xl animate-bounce-gentle">{currentTarget.emoji}</span>
                <span className="text-xl font-extrabold text-slate-800">
                  {currentTarget.name}
                </span>
              </div>
            </div>

            {/* Visual Object Grid */}
            <div
              className={`w-full max-w-sm my-auto grid ${GRID_COLS_PER_LEVEL[level]} gap-2.5 justify-items-center`}
            >
              {gridItems.map((item) => {
                const isEliminated = eliminatedIds.includes(item.id);
                const isTargetHighlighted = highlightTarget && item.isTarget;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectObject(item)}
                    disabled={isEliminated}
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
                      isEliminated
                        ? "opacity-20 bg-slate-100 border border-slate-200 cursor-not-allowed"
                        : isTargetHighlighted
                        ? "bg-amber-100 border-3 border-amber-500 shadow-md ring-4 ring-amber-300/50"
                        : "bg-white border-2 border-slate-200/80 shadow-sm hover:border-teal-500 hover:shadow"
                    }`}
                  >
                    <span className="text-3xl select-none">{item.emoji}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-sm flex items-center justify-between pt-2">
              <button
                onClick={handleUseHint}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold active:scale-95 transition-transform"
              >
                <span>💡</span>
                <span>Gentle Hint {hintsUsed > 0 ? `(${hintsUsed})` : ""}</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                Difficulty Level: {level}
              </span>
            </div>
          </>
        ) : (
          /* Completion / Adaptive Feedback View */
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-md text-center my-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-500 flex items-center justify-center mx-auto text-3xl shadow-sm">
              🎯
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Great Work!</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Focus Finder session complete
              </p>
            </div>

            {/* Adaptive Level Card */}
            <div className="bg-[#E6F4F1] border border-teal-200/80 rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Performance Evaluation
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white text-teal-900 shadow-xs">
                  {adaptiveResult?.normalizedScore ?? 80}/100 pts
                </span>
              </div>
              <p className="text-base font-extrabold text-teal-950 mt-1">
                {adaptiveResult?.feedbackMessage}
              </p>
              <p className="text-xs text-teal-800 mt-1.5 font-medium leading-relaxed">
                {adaptiveResult?.supportiveNote}
              </p>
            </div>

            {/* Telemetry Summary */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-bold text-slate-500">Attention Accuracy</span>
                <p className="text-lg font-black text-slate-900">
                  {correctCount + incorrectCount > 0
                    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
                    : 100}
                  %
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-bold text-slate-500">Next Difficulty</span>
                <p className="text-lg font-black text-teal-700">
                  Level {adaptiveResult?.nextDifficulty ?? level}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handlePlayNextRound(adaptiveResult?.nextDifficulty ?? level)}
                className="w-full py-4 rounded-2xl bg-[#2E7D73] text-white font-extrabold text-base shadow-sm hover:bg-[#1A5C54] active:scale-98 transition-all"
              >
                Play Next Round (Level {adaptiveResult?.nextDifficulty ?? level})
              </button>
              <button
                onClick={onBack}
                className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 active:scale-98 transition-all"
              >
                Return to Activities
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
