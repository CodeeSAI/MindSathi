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

interface RoutineStep {
  stepNumber: number;
  emoji: string;
  title: string;
  description: string;
}

interface RoutineDefinition {
  id: string;
  name: string;
  category: string;
  minLevel: DifficultyLevel;
  steps: RoutineStep[];
}

const ROUTINE_DATABASE: RoutineDefinition[] = [
  // Level 1: 3-step familiar routines
  {
    id: "morning-sunrise",
    name: "Morning Wakeup Routine",
    category: "Morning Routine",
    minLevel: 1,
    steps: [
      { stepNumber: 1, emoji: "☀️", title: "Wake Up", description: "Open curtains to morning sun" },
      { stepNumber: 2, emoji: "🪥", title: "Brush Teeth", description: "Freshen up for the day" },
      { stepNumber: 3, emoji: "🥞", title: "Eat Breakfast", description: "Enjoy a warm morning meal" },
    ],
  },
  // Level 2: 4-step routines
  {
    id: "brewing-tea",
    name: "Making Afternoon Tea",
    category: "Kitchen & Refreshment",
    minLevel: 2,
    steps: [
      { stepNumber: 1, emoji: "🫖", title: "Boil Water", description: "Heat fresh kettle water" },
      { stepNumber: 2, emoji: "🍃", title: "Add Tea Leaves", description: "Steep the fragrant leaves" },
      { stepNumber: 3, emoji: "🥛", title: "Pour Warm Milk", description: "Add a splash of fresh milk" },
      { stepNumber: 4, emoji: "☕", title: "Sip Hot Tea", description: "Relax and enjoy your cup" },
    ],
  },
  // Level 3: 5-step routines
  {
    id: "park-walk",
    name: "Morning Garden Walk",
    category: "Healthy Movement",
    minLevel: 3,
    steps: [
      { stepNumber: 1, emoji: "👟", title: "Put On Walking Shoes", description: "Lace comfortable footwear" },
      { stepNumber: 2, emoji: "🚪", title: "Step Outside Door", description: "Breathe the fresh morning air" },
      { stepNumber: 3, emoji: "🌳", title: "Stroll Down Tree Path", description: "Walk gently along the park" },
      { stepNumber: 4, emoji: "👋", title: "Greet a Friendly Neighbor", description: "Share a warm hello" },
      { stepNumber: 5, emoji: "🏡", title: "Return Home Safely", description: "Sit back and rest your feet" },
    ],
  },
  // Level 4: 6-step routines
  {
    id: "gardening-care",
    name: "Tending to the Plants",
    category: "Gardening Care",
    minLevel: 4,
    steps: [
      { stepNumber: 1, emoji: "👒", title: "Wear Sun Hat", description: "Protect yourself from bright sun" },
      { stepNumber: 2, emoji: "🚿", title: "Fill Watering Can", description: "Get cool fresh water" },
      { stepNumber: 3, emoji: "🪴", title: "Water Potted Plants", description: "Give thirsty roots a drink" },
      { stepNumber: 4, emoji: "🌸", title: "Snip Fresh Blossoms", description: "Collect pleasant blooms" },
      { stepNumber: 5, emoji: "🌱", title: "Clear Dry Leaves", description: "Tidy up the flowerbed" },
      { stepNumber: 6, emoji: "🧼", title: "Wash Hands Clean", description: "Rinse with warm soap and water" },
    ],
  },
  // Level 5: 6-step detailed routine
  {
    id: "evening-peace",
    name: "Cozy Evening Routine",
    category: "Evening Rest",
    minLevel: 5,
    steps: [
      { stepNumber: 1, emoji: "🍲", title: "Enjoy Evening Soup", description: "Eat a light nutritious supper" },
      { stepNumber: 2, emoji: "🍽️", title: "Clear Dining Table", description: "Put plates neatly in the sink" },
      { stepNumber: 3, emoji: "💊", title: "Take Evening Medicine", description: "Drink with a glass of water" },
      { stepNumber: 4, emoji: "📞", title: "Call a Family Member", description: "Chat and share daily smiles" },
      { stepNumber: 5, emoji: "📖", title: "Read a Relaxing Book", description: "Wind down quietly in chair" },
      { stepNumber: 6, emoji: "🛏️", title: "Rest in Warm Bed", description: "Turn off lamp for peaceful sleep" },
    ],
  },
];

export function DailyLifeRecall({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState<DifficultyLevel>(() =>
    getDailyGameDifficulty("daily-life-recall")
  );

  // Active routine based on difficulty level
  const [activeRoutine, setActiveRoutine] = useState<RoutineDefinition>(() => {
    return ROUTINE_DATABASE.find((r) => r.minLevel === level) || ROUTINE_DATABASE[0];
  });

  // Phases: "study" (memorize sequence) -> "reconstruct" (place cards in order) -> "completed"
  const [phase, setPhase] = useState<"study" | "reconstruct" | "completed">("study");

  // Reconstruct phase state
  const [shuffledPool, setShuffledPool] = useState<RoutineStep[]>([]);
  const [placedSteps, setPlacedSteps] = useState<RoutineStep[]>([]);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [highlightedNextStep, setHighlightedNextStep] = useState<number | null>(null);
  const [shakeCardId, setShakeCardId] = useState<number | null>(null);

  // Telemetry references
  const studyStartTimeRef = useRef<number>(Date.now());
  const reconstructStartTimeRef = useRef<number>(0);
  const lastActionTimeRef = useRef<number>(Date.now());
  const resultSavedRef = useRef(false);

  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveEngineOutput | null>(null);

  // Setup current level
  const initRoutineForLevel = (lvl: DifficultyLevel) => {
    const routine = ROUTINE_DATABASE.find((r) => r.minLevel === lvl) || ROUTINE_DATABASE[0];
    setActiveRoutine(routine);
    setPhase("study");
    setPlacedSteps([]);
    setIncorrectAttempts(0);
    setHintsUsed(0);
    setHesitationCount(0);
    setHighlightedNextStep(null);
    setAdaptiveResult(null);
    resultSavedRef.current = false;
    studyStartTimeRef.current = Date.now();
    lastActionTimeRef.current = Date.now();
  };

  useEffect(() => {
    initRoutineForLevel(level);
  }, []);

  // Monitor idle pauses
  useEffect(() => {
    const timer = setInterval(() => {
      if (phase !== "reconstruct") return;
      if (Date.now() - lastActionTimeRef.current > 7000) {
        setHesitationCount((h) => h + 1);
        lastActionTimeRef.current = Date.now();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Transition from Study to Reconstruct
  const handleReadyToOrder = () => {
    setPhase("reconstruct");
    reconstructStartTimeRef.current = Date.now();
    lastActionTimeRef.current = Date.now();
    // Shuffle steps for patient to put back in order
    const shuffled = [...activeRoutine.steps].sort(() => Math.random() - 0.5);
    setShuffledPool(shuffled);
  };

  // User taps a step from the pool
  const handleSelectStep = (step: RoutineStep) => {
    if (phase !== "reconstruct") return;

    lastActionTimeRef.current = Date.now();
    setHighlightedNextStep(null);

    const expectedStepNumber = placedSteps.length + 1;

    if (step.stepNumber === expectedStepNumber) {
      // Correct step tapped in order
      const newPlaced = [...placedSteps, step];
      setPlacedSteps(newPlaced);
      setShuffledPool((prev) => prev.filter((s) => s.stepNumber !== step.stepNumber));

      if (newPlaced.length === activeRoutine.steps.length) {
        // Routine fully assembled!
        finishGame(newPlaced.length, incorrectAttempts);
      }
    } else {
      // Misplaced step
      setIncorrectAttempts((cnt) => cnt + 1);
      setShakeCardId(step.stepNumber);
      setTimeout(() => setShakeCardId(null), 700);
    }
  };

  const handleUseHint = () => {
    if (phase !== "reconstruct" || shuffledPool.length === 0) return;
    setHintsUsed((h) => h + 1);
    const expectedStepNumber = placedSteps.length + 1;
    setHighlightedNextStep(expectedStepNumber);
  };

  const finishGame = (totalCorrectSteps: number, finalMistakes: number) => {
    setPhase("completed");
    if (resultSavedRef.current) return;
    resultSavedRef.current = true;

    const reconstructSeconds = Math.max(
      4,
      Math.round((Date.now() - reconstructStartTimeRef.current) / 1000)
    );
    const avgResponseTime = Number((reconstructSeconds / totalCorrectSteps).toFixed(1));

    const totalActions = totalCorrectSteps + finalMistakes;
    const accuracy = Math.min(
      100,
      Math.max(10, Math.round((totalCorrectSteps / Math.max(1, totalActions)) * 100))
    );

    // Evaluate via shared Adaptive Engine
    const evalResult = getNextDifficulty(
      level,
      {
        currentDifficulty: level,
        accuracy,
        incorrectAttempts: finalMistakes,
        completionTimeSeconds: reconstructSeconds,
        averageResponseTimeSeconds: avgResponseTime,
        hintsUsed,
        hesitationCount,
        totalRounds: 1,
        correctAnswers: totalCorrectSteps,
      },
      "daily-life-recall"
    );

    setAdaptiveResult(evalResult);
    saveDailyGameDifficulty("daily-life-recall", evalResult.nextDifficulty);

    // Save with offline sync queue
    const user = auth.currentUser;
    const patientId = user ? user.uid : "demo_patient_ravi";

    saveGameTelemetryWithSync({
      patientId,
      gameId: "daily-life-recall",
      gameName: "Daily Life Recall",
      cognitiveDomain: "Routine Recall",
      difficultyLevel: level,
      score: evalResult.normalizedScore,
      accuracy,
      completionTimeSeconds: reconstructSeconds,
      averageResponseTimeSeconds: avgResponseTime,
      incorrectAttempts: finalMistakes,
      hintsUsed,
      hesitationCount,
      completionStatus: "completed",
      nextDifficultyLevel: evalResult.nextDifficulty,
      starsEarned: evalResult.normalizedScore >= 75 ? 20 : evalResult.normalizedScore >= 50 ? 15 : 10,
      clientSubmissionId: `${patientId}_dlr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    });
  };

  const handlePlayNextLevel = (targetLevel: DifficultyLevel) => {
    setLevel(targetLevel);
    initRoutineForLevel(targetLevel);
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
            <h1 className="text-lg font-black tracking-tight">Daily Life Recall</h1>
            <p className="text-xs text-teal-100 font-semibold">
              Daily Routine Sequencing • Level {level} of 5
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 px-4 py-4 flex flex-col overflow-y-auto">
        {phase === "study" && (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full space-y-4">
            {/* Instruction banner */}
            <div className="bg-white border border-teal-600/20 rounded-2xl p-4 shadow-sm text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                Step 1: Study the Routine
              </span>
              <h3 className="text-lg font-extrabold text-slate-800 mt-1.5">
                {activeRoutine.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Take your time to look at the steps in natural order.
              </p>
            </div>

            {/* Visual Steps List */}
            <div className="space-y-2.5 my-auto">
              {activeRoutine.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="bg-white border-2 border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-900 font-black text-sm shrink-0">
                    {step.stepNumber}
                  </div>
                  <span className="text-3xl shrink-0">{step.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800">{step.title}</p>
                    <p className="text-xs text-slate-500 font-medium">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ready Button */}
            <div className="pt-2">
              <button
                onClick={handleReadyToOrder}
                className="w-full py-4 rounded-2xl bg-[#2E7D73] text-white font-extrabold text-base shadow-sm hover:bg-[#1A5C54] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Ready to Order the Steps</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {phase === "reconstruct" && (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full space-y-3">
            {/* Step placement slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-700">
                  Placed Steps ({placedSteps.length} of {activeRoutine.steps.length})
                </span>
                <span className="text-[11px] font-bold text-teal-700">
                  Tap step {placedSteps.length + 1} below
                </span>
              </div>

              <div className="space-y-1.5">
                {activeRoutine.steps.map((_, idx) => {
                  const placed = placedSteps[idx];
                  const isCurrentTarget = idx === placedSteps.length;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl p-2.5 flex items-center gap-3 transition-all ${
                        placed
                          ? "bg-emerald-50 border border-emerald-300 shadow-xs"
                          : isCurrentTarget
                          ? "bg-amber-50 border-2 border-dashed border-amber-400"
                          : "bg-slate-100 border border-slate-200 opacity-60"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          placed
                            ? "bg-emerald-600 text-white"
                            : isCurrentTarget
                            ? "bg-amber-400 text-amber-950 animate-pulse"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {placed ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xl">{placed.emoji}</span>
                          <span className="text-xs font-bold text-emerald-950">
                            {placed.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">
                          {isCurrentTarget ? "Select next step from below" : `Step ${idx + 1}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unplaced Steps Pool */}
            <div className="my-auto pt-2">
              <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                Available Steps (tap in correct order):
              </p>
              <div className="grid grid-cols-1 gap-2">
                {shuffledPool.map((step) => {
                  const isHighlighted = highlightedNextStep === step.stepNumber;
                  const isShaking = shakeCardId === step.stepNumber;

                  return (
                    <button
                      key={step.stepNumber}
                      onClick={() => handleSelectStep(step)}
                      className={`w-full p-3.5 rounded-2xl bg-white border-2 text-left flex items-center gap-3 transition-all shadow-xs active:scale-95 ${
                        isShaking
                          ? "border-rose-500 bg-rose-50 animate-bounce"
                          : isHighlighted
                          ? "border-amber-500 bg-amber-50 ring-4 ring-amber-300/40"
                          : "border-slate-200/80 hover:border-teal-500"
                      }`}
                    >
                      <span className="text-2xl">{step.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-slate-800">{step.title}</p>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {step.description}
                        </p>
                      </div>
                      <span className="text-slate-300 font-bold text-sm">Tap</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Hint */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleUseHint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold active:scale-95 transition-transform"
              >
                <span>💡</span>
                <span>Reveal Next Step {hintsUsed > 0 ? `(${hintsUsed})` : ""}</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                Difficulty Level: {level}
              </span>
            </div>
          </div>
        )}

        {phase === "completed" && (
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-md text-center my-auto mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-500 flex items-center justify-center mx-auto text-3xl shadow-sm">
              🗓️
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Routine Completed!</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {activeRoutine.name} successfully recalled
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
                <span className="text-[11px] font-bold text-slate-500">Sequencing Accuracy</span>
                <p className="text-lg font-black text-slate-900">
                  {Math.round(
                    (activeRoutine.steps.length /
                      (activeRoutine.steps.length + incorrectAttempts)) *
                      100
                  )}
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
                onClick={() => handlePlayNextLevel(adaptiveResult?.nextDifficulty ?? level)}
                className="w-full py-4 rounded-2xl bg-[#2E7D73] text-white font-extrabold text-base shadow-sm hover:bg-[#1A5C54] active:scale-98 transition-all"
              >
                Play Next Routine (Level {adaptiveResult?.nextDifficulty ?? level})
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
