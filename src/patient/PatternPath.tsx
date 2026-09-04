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

interface PatternPuzzle {
  id: string;
  patternType: "AB" | "ABC" | "AABB" | "MISSING_MIDDLE" | "PROGRESSIVE";
  sequence: { emoji: string; label: string }[];
  missingIndex: number; // usually at end (sequence.length - 1) or middle
  correctAnswer: { emoji: string; label: string };
  options: { emoji: string; label: string }[];
  explanation: string;
}

const PUZZLES_BY_LEVEL: Record<DifficultyLevel, PatternPuzzle[]> = {
  // Level 1: Simple AB patterns, large objects, obvious alternation
  1: [
    {
      id: "lvl1-p1",
      patternType: "AB",
      sequence: [
        { emoji: "🍎", label: "Apple" },
        { emoji: "🍊", label: "Orange" },
        { emoji: "🍎", label: "Apple" },
        { emoji: "🍊", label: "Orange" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 4,
      correctAnswer: { emoji: "🍎", label: "Apple" },
      options: [
        { emoji: "🍎", label: "Apple" },
        { emoji: "🍇", label: "Grapes" },
        { emoji: "🥑", label: "Avocado" },
      ],
      explanation: "Apple, Orange, Apple, Orange... so Apple comes next!",
    },
    {
      id: "lvl1-p2",
      patternType: "AB",
      sequence: [
        { emoji: "☀️", label: "Sun" },
        { emoji: "🌙", label: "Moon" },
        { emoji: "☀️", label: "Sun" },
        { emoji: "🌙", label: "Moon" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 4,
      correctAnswer: { emoji: "☀️", label: "Sun" },
      options: [
        { emoji: "☀️", label: "Sun" },
        { emoji: "⭐", label: "Star" },
        { emoji: "☁️", label: "Cloud" },
      ],
      explanation: "Sun, Moon, Sun, Moon... Sun is next!",
    },
    {
      id: "lvl1-p3",
      patternType: "AB",
      sequence: [
        { emoji: "🌸", label: "Flower" },
        { emoji: "🌿", label: "Leaf" },
        { emoji: "🌸", label: "Flower" },
        { emoji: "🌿", label: "Leaf" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 4,
      correctAnswer: { emoji: "🌸", label: "Flower" },
      options: [
        { emoji: "🌸", label: "Flower" },
        { emoji: "🍄", label: "Mushroom" },
        { emoji: "🍂", label: "Dry Leaf" },
      ],
      explanation: "Flower and Leaf alternate nicely!",
    },
    {
      id: "lvl1-p4",
      patternType: "AB",
      sequence: [
        { emoji: "☕", label: "Tea" },
        { emoji: "🥞", label: "Pancake" },
        { emoji: "☕", label: "Tea" },
        { emoji: "🥞", label: "Pancake" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 4,
      correctAnswer: { emoji: "☕", label: "Tea" },
      options: [
        { emoji: "☕", label: "Tea" },
        { emoji: "🥛", label: "Milk" },
        { emoji: "🥣", label: "Soup" },
      ],
      explanation: "Tea, Pancake, Tea, Pancake... Next is Tea!",
    },
  ],

  // Level 2: ABC patterns
  2: [
    {
      id: "lvl2-p1",
      patternType: "ABC",
      sequence: [
        { emoji: "🔴", label: "Red" },
        { emoji: "🟢", label: "Green" },
        { emoji: "🔵", label: "Blue" },
        { emoji: "🔴", label: "Red" },
        { emoji: "🟢", label: "Green" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🔵", label: "Blue" },
      options: [
        { emoji: "🔵", label: "Blue" },
        { emoji: "🟡", label: "Yellow" },
        { emoji: "🟣", label: "Purple" },
      ],
      explanation: "Red, Green, Blue in repeating order!",
    },
    {
      id: "lvl2-p2",
      patternType: "ABC",
      sequence: [
        { emoji: "🐶", label: "Dog" },
        { emoji: "🐱", label: "Cat" },
        { emoji: "🐦", label: "Bird" },
        { emoji: "🐶", label: "Dog" },
        { emoji: "🐱", label: "Cat" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🐦", label: "Bird" },
      options: [
        { emoji: "🐦", label: "Bird" },
        { emoji: "🐠", label: "Fish" },
        { emoji: "🐰", label: "Rabbit" },
      ],
      explanation: "Dog, Cat, Bird repeat smoothly!",
    },
    {
      id: "lvl2-p3",
      patternType: "ABC",
      sequence: [
        { emoji: "🍎", label: "Apple" },
        { emoji: "🍌", label: "Banana" },
        { emoji: "🍇", label: "Grapes" },
        { emoji: "🍎", label: "Apple" },
        { emoji: "🍌", label: "Banana" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🍇", label: "Grapes" },
      options: [
        { emoji: "🍇", label: "Grapes" },
        { emoji: "🍉", label: "Melon" },
        { emoji: "🥝", label: "Kiwi" },
      ],
      explanation: "Apple, Banana, then Grapes complete the trio.",
    },
    {
      id: "lvl2-p4",
      patternType: "ABC",
      sequence: [
        { emoji: "🌻", label: "Sunflower" },
        { emoji: "🌹", label: "Rose" },
        { emoji: "🌷", label: "Tulip" },
        { emoji: "🌻", label: "Sunflower" },
        { emoji: "🌹", label: "Rose" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🌷", label: "Tulip" },
      options: [
        { emoji: "🌷", label: "Tulip" },
        { emoji: "🌼", label: "Daisy" },
        { emoji: "🌸", label: "Blossom" },
      ],
      explanation: "Sunflower, Rose, Tulip repeats!",
    },
  ],

  // Level 3: AABB and longer repeated sequences
  3: [
    {
      id: "lvl3-p1",
      patternType: "AABB",
      sequence: [
        { emoji: "⭐", label: "Star" },
        { emoji: "⭐", label: "Star" },
        { emoji: "🌙", label: "Moon" },
        { emoji: "🌙", label: "Moon" },
        { emoji: "⭐", label: "Star" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "⭐", label: "Star" },
      options: [
        { emoji: "⭐", label: "Star" },
        { emoji: "🌙", label: "Moon" },
        { emoji: "☀️", label: "Sun" },
      ],
      explanation: "Pairs of Stars and Moons: Two stars, two moons, now a second star!",
    },
    {
      id: "lvl3-p2",
      patternType: "AABB",
      sequence: [
        { emoji: "🔷", label: "Blue Diamond" },
        { emoji: "🔷", label: "Blue Diamond" },
        { emoji: "🔶", label: "Orange Diamond" },
        { emoji: "🔶", label: "Orange Diamond" },
        { emoji: "🔷", label: "Blue Diamond" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🔷", label: "Blue Diamond" },
      options: [
        { emoji: "🔷", label: "Blue Diamond" },
        { emoji: "🔶", label: "Orange Diamond" },
        { emoji: "🟢", label: "Green Circle" },
      ],
      explanation: "Double blue, double orange, now double blue!",
    },
    {
      id: "lvl3-p3",
      patternType: "AABB",
      sequence: [
        { emoji: "🌺", label: "Hibiscus" },
        { emoji: "🌺", label: "Hibiscus" },
        { emoji: "🌻", label: "Sunflower" },
        { emoji: "🌻", label: "Sunflower" },
        { emoji: "🌺", label: "Hibiscus" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🌺", label: "Hibiscus" },
      options: [
        { emoji: "🌺", label: "Hibiscus" },
        { emoji: "🌻", label: "Sunflower" },
        { emoji: "🌹", label: "Rose" },
      ],
      explanation: "Two hibiscuses follow two sunflowers.",
    },
    {
      id: "lvl3-p4",
      patternType: "AABB",
      sequence: [
        { emoji: "🚗", label: "Car" },
        { emoji: "🚗", label: "Car" },
        { emoji: "🚲", label: "Bike" },
        { emoji: "🚲", label: "Bike" },
        { emoji: "🚗", label: "Car" },
        { emoji: "❓", label: "What is next?" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🚗", label: "Car" },
      options: [
        { emoji: "🚗", label: "Car" },
        { emoji: "🚲", label: "Bike" },
        { emoji: "🚌", label: "Bus" },
      ],
      explanation: "Two cars, two bikes, two cars!",
    },
  ],

  // Level 4: Missing element in middle or end, with similar distractors
  4: [
    {
      id: "lvl4-p1",
      patternType: "MISSING_MIDDLE",
      sequence: [
        { emoji: "🍇", label: "Grapes" },
        { emoji: "🍉", label: "Watermelon" },
        { emoji: "❓", label: "Missing item" },
        { emoji: "🍉", label: "Watermelon" },
        { emoji: "🍇", label: "Grapes" },
        { emoji: "🍉", label: "Watermelon" },
      ],
      missingIndex: 2,
      correctAnswer: { emoji: "🍇", label: "Grapes" },
      options: [
        { emoji: "🍇", label: "Grapes" },
        { emoji: "🍓", label: "Strawberry" },
        { emoji: "🫐", label: "Blueberries" },
        { emoji: "🍒", label: "Cherries" },
      ],
      explanation: "Grapes and Watermelon alternate; Grapes fills the middle gap!",
    },
    {
      id: "lvl4-p2",
      patternType: "MISSING_MIDDLE",
      sequence: [
        { emoji: "🔔", label: "Bell" },
        { emoji: "⏰", label: "Alarm" },
        { emoji: "🔔", label: "Bell" },
        { emoji: "❓", label: "Missing item" },
        { emoji: "🔔", label: "Bell" },
        { emoji: "⏰", label: "Alarm" },
      ],
      missingIndex: 3,
      correctAnswer: { emoji: "⏰", label: "Alarm" },
      options: [
        { emoji: "⏰", label: "Alarm" },
        { emoji: "⏳", label: "Hourglass" },
        { emoji: "🕯️", label: "Candle" },
        { emoji: "📻", label: "Radio" },
      ],
      explanation: "The alarm clock completes the rhythmic chime sequence.",
    },
    {
      id: "lvl4-p3",
      patternType: "MISSING_MIDDLE",
      sequence: [
        { emoji: "☕", label: "Teacup" },
        { emoji: "🫖", label: "Teapot" },
        { emoji: "☕", label: "Teacup" },
        { emoji: "❓", label: "Missing item" },
        { emoji: "☕", label: "Teacup" },
        { emoji: "🫖", label: "Teapot" },
      ],
      missingIndex: 3,
      correctAnswer: { emoji: "🫖", label: "Teapot" },
      options: [
        { emoji: "🫖", label: "Teapot" },
        { emoji: "🥛", label: "Milk" },
        { emoji: "🍯", label: "Honey" },
        { emoji: "🥣", label: "Bowl" },
      ],
      explanation: "Teacup, Teapot alternating.",
    },
    {
      id: "lvl4-p4",
      patternType: "MISSING_MIDDLE",
      sequence: [
        { emoji: "👟", label: "Shoe" },
        { emoji: "👒", label: "Hat" },
        { emoji: "🧣", label: "Scarf" },
        { emoji: "👟", label: "Shoe" },
        { emoji: "❓", label: "Missing item" },
        { emoji: "🧣", label: "Scarf" },
      ],
      missingIndex: 4,
      correctAnswer: { emoji: "👒", label: "Hat" },
      options: [
        { emoji: "👒", label: "Hat" },
        { emoji: "🧤", label: "Gloves" },
        { emoji: "🕶️", label: "Glasses" },
        { emoji: "🧦", label: "Socks" },
      ],
      explanation: "Shoe, Hat, Scarf in sequence.",
    },
  ],

  // Level 5: Progressive / growth / logic sequence
  5: [
    {
      id: "lvl5-p1",
      patternType: "PROGRESSIVE",
      sequence: [
        { emoji: "🌱", label: "Seedling" },
        { emoji: "🌿", label: "Branch" },
        { emoji: "🌳", label: "Full Tree" },
        { emoji: "🌱", label: "Seedling" },
        { emoji: "🌿", label: "Branch" },
        { emoji: "❓", label: "Next growth" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🌳", label: "Full Tree" },
      options: [
        { emoji: "🌳", label: "Full Tree" },
        { emoji: "🪵", label: "Wood" },
        { emoji: "🍂", label: "Fallen Leaf" },
        { emoji: "🍄", label: "Mushroom" },
      ],
      explanation: "The growth cycle repeats: Sprout, Leaf, Tree!",
    },
    {
      id: "lvl5-p2",
      patternType: "PROGRESSIVE",
      sequence: [
        { emoji: "🌑", label: "New Moon" },
        { emoji: "🌓", label: "Half Moon" },
        { emoji: "🌕", label: "Full Moon" },
        { emoji: "🌑", label: "New Moon" },
        { emoji: "🌓", label: "Half Moon" },
        { emoji: "❓", label: "Next moon" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🌕", label: "Full Moon" },
      options: [
        { emoji: "🌕", label: "Full Moon" },
        { emoji: "☀️", label: "Sun" },
        { emoji: "⭐", label: "Star" },
        { emoji: "☁️", label: "Cloud" },
      ],
      explanation: "Moon phases growing from dark to full bright light!",
    },
    {
      id: "lvl5-p3",
      patternType: "PROGRESSIVE",
      sequence: [
        { emoji: "1️⃣", label: "One" },
        { emoji: "2️⃣", label: "Two" },
        { emoji: "3️⃣", label: "Three" },
        { emoji: "1️⃣", label: "One" },
        { emoji: "2️⃣", label: "Two" },
        { emoji: "❓", label: "Next number" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "3️⃣", label: "Three" },
      options: [
        { emoji: "3️⃣", label: "Three" },
        { emoji: "4️⃣", label: "Four" },
        { emoji: "5️⃣", label: "Five" },
        { emoji: "0️⃣", label: "Zero" },
      ],
      explanation: "Counting sequence 1, 2, 3 repeats.",
    },
    {
      id: "lvl5-p4",
      patternType: "PROGRESSIVE",
      sequence: [
        { emoji: "🔴", label: "Red Circle" },
        { emoji: "🔺", label: "Red Triangle" },
        { emoji: "🟥", label: "Red Square" },
        { emoji: "🔴", label: "Red Circle" },
        { emoji: "🔺", label: "Red Triangle" },
        { emoji: "❓", label: "Next shape" },
      ],
      missingIndex: 5,
      correctAnswer: { emoji: "🟥", label: "Red Square" },
      options: [
        { emoji: "🟥", label: "Red Square" },
        { emoji: "🔷", label: "Blue Diamond" },
        { emoji: "⭐", label: "Star" },
        { emoji: "🟢", label: "Green Circle" },
      ],
      explanation: "Circle, Triangle, Square repeats with red shapes.",
    },
  ],
};

export function PatternPath({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState<DifficultyLevel>(() =>
    getDailyGameDifficulty("pattern-path")
  );

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzles = PUZZLES_BY_LEVEL[level] || PUZZLES_BY_LEVEL[1];
  const currentPuzzle = currentPuzzles[puzzleIndex % currentPuzzles.length];

  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [wrongShakeOption, setWrongShakeOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Telemetry metrics
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Timers
  const puzzleStartTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(Date.now());
  const lastActionTimeRef = useRef<number>(Date.now());
  const responseTimesRef = useRef<number[]>([]);
  const resultSavedRef = useRef(false);

  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveEngineOutput | null>(null);

  useEffect(() => {
    sessionStartTimeRef.current = Date.now();
    puzzleStartTimeRef.current = Date.now();
    lastActionTimeRef.current = Date.now();
  }, []);

  // Idle hesitation tracker
  useEffect(() => {
    const timer = setInterval(() => {
      if (isGameOver) return;
      if (Date.now() - lastActionTimeRef.current > 7000) {
        setHesitationCount((h) => h + 1);
        lastActionTimeRef.current = Date.now();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver]);

  const handleSelectOption = (opt: { emoji: string; label: string }) => {
    if (isGameOver || eliminatedOptions.includes(opt.emoji)) return;

    const now = Date.now();
    const rt = (now - puzzleStartTimeRef.current) / 1000;
    responseTimesRef.current.push(rt);
    lastActionTimeRef.current = now;

    if (opt.emoji === currentPuzzle.correctAnswer.emoji) {
      // Correct!
      setCorrectCount((c) => c + 1);
      setShowExplanation(true);

      setTimeout(() => {
        setShowExplanation(false);
        setEliminatedOptions([]);
        setWrongShakeOption(null);

        if (puzzleIndex + 1 >= currentPuzzles.length) {
          // Completed all 4 puzzles in session
          finishGame(correctCount + 1, incorrectAttempts);
        } else {
          setPuzzleIndex((prev) => prev + 1);
          puzzleStartTimeRef.current = Date.now();
        }
      }, 1000);
    } else {
      // Wrong option selected
      setIncorrectAttempts((i) => i + 1);
      setWrongShakeOption(opt.emoji);
      setTimeout(() => setWrongShakeOption(null), 600);
      setEliminatedOptions((prev) => [...prev, opt.emoji]);
    }
  };

  const handleUseHint = () => {
    if (isGameOver) return;
    setHintsUsed((h) => h + 1);

    // Eliminate 1 wrong option
    const wrongOnes = currentPuzzle.options.filter(
      (o) =>
        o.emoji !== currentPuzzle.correctAnswer.emoji &&
        !eliminatedOptions.includes(o.emoji)
    );

    if (wrongOnes.length > 0) {
      setEliminatedOptions((prev) => [...prev, wrongOnes[0].emoji]);
    }
  };

  const finishGame = (finalCorrect: number, finalMistakes: number) => {
    setIsGameOver(true);
    if (resultSavedRef.current) return;
    resultSavedRef.current = true;

    const totalSeconds = Math.max(
      4,
      Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
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

    const totalActions = finalCorrect + finalMistakes;
    const accuracy = Math.min(
      100,
      Math.max(10, Math.round((finalCorrect / Math.max(1, totalActions)) * 100))
    );

    // Evaluate with common Adaptive Engine
    const evalResult = getNextDifficulty(
      level,
      {
        currentDifficulty: level,
        accuracy,
        incorrectAttempts: finalMistakes,
        completionTimeSeconds: totalSeconds,
        averageResponseTimeSeconds: avgResponseTime,
        hintsUsed,
        hesitationCount,
        totalRounds: currentPuzzles.length,
        correctAnswers: finalCorrect,
      },
      "pattern-path"
    );

    setAdaptiveResult(evalResult);
    saveDailyGameDifficulty("pattern-path", evalResult.nextDifficulty);

    // Save with offline sync queue
    const user = auth.currentUser;
    const patientId = user ? user.uid : "demo_patient_ravi";

    saveGameTelemetryWithSync({
      patientId,
      gameId: "pattern-path",
      gameName: "Pattern Path",
      cognitiveDomain: "Pattern Recognition",
      difficultyLevel: level,
      score: evalResult.normalizedScore,
      accuracy,
      completionTimeSeconds: totalSeconds,
      averageResponseTimeSeconds: avgResponseTime,
      incorrectAttempts: finalMistakes,
      hintsUsed,
      hesitationCount,
      completionStatus: "completed",
      nextDifficultyLevel: evalResult.nextDifficulty,
      starsEarned: evalResult.normalizedScore >= 75 ? 20 : evalResult.normalizedScore >= 50 ? 15 : 10,
      clientSubmissionId: `${patientId}_pp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    });
  };

  const handlePlayNextLevel = (targetLevel: DifficultyLevel) => {
    setLevel(targetLevel);
    setPuzzleIndex(0);
    setCorrectCount(0);
    setIncorrectAttempts(0);
    setHintsUsed(0);
    setHesitationCount(0);
    setEliminatedOptions([]);
    setIsGameOver(false);
    setAdaptiveResult(null);
    resultSavedRef.current = false;
    responseTimesRef.current = [];
    sessionStartTimeRef.current = Date.now();
    puzzleStartTimeRef.current = Date.now();
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
            <h1 className="text-lg font-black tracking-tight">Pattern Path</h1>
            <p className="text-xs text-teal-100 font-semibold">
              Pattern Recognition • Level {level} of 5
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Puzzle Dots */}
        {!isGameOver && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {currentPuzzles.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === puzzleIndex
                    ? "w-7 bg-amber-300"
                    : idx < puzzleIndex
                    ? "w-2 bg-white"
                    : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 px-4 py-4 flex flex-col items-center justify-between overflow-y-auto">
        {!isGameOver ? (
          <div className="w-full max-w-sm flex-1 flex flex-col justify-between my-auto space-y-4">
            {/* Prompt Card */}
            <div className="bg-white border-2 border-teal-600/20 rounded-2xl p-4 shadow-sm text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                Puzzle {puzzleIndex + 1} of {currentPuzzles.length}
              </span>
              <h3 className="text-sm font-bold text-slate-700 mt-1">
                What completes the pattern?
              </h3>
            </div>

            {/* Visual Sequence Row */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {currentPuzzle.sequence.map((item, idx) => {
                  const isQuestion = idx === currentPuzzle.missingIndex;

                  return (
                    <div
                      key={idx}
                      className={`w-13 h-15 sm:w-15 sm:h-17 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        isQuestion
                          ? showExplanation
                            ? "bg-emerald-100 border-2 border-emerald-500 text-emerald-950 scale-105"
                            : "bg-amber-50 border-2 border-dashed border-amber-400 text-amber-800 animate-pulse"
                          : "bg-slate-50 border border-slate-200 text-slate-800"
                      }`}
                    >
                      <span className="text-3xl">
                        {isQuestion && showExplanation
                          ? currentPuzzle.correctAnswer.emoji
                          : item.emoji}
                      </span>
                    </div>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center animate-fade-in">
                  <p className="text-xs font-extrabold text-emerald-900">
                    {currentPuzzle.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div>
              <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 text-center">
                Tap the matching item:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {currentPuzzle.options.map((opt) => {
                  const isEliminated = eliminatedOptions.includes(opt.emoji);
                  const isShaking = wrongShakeOption === opt.emoji;

                  return (
                    <button
                      key={opt.emoji}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isEliminated}
                      className={`py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
                        isEliminated
                          ? "opacity-20 bg-slate-100 border border-slate-200 cursor-not-allowed"
                          : isShaking
                          ? "bg-rose-100 border-2 border-rose-500 animate-bounce"
                          : "bg-white border-2 border-slate-200/80 hover:border-teal-500 shadow-sm"
                      }`}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-[11px] font-bold text-slate-700">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleUseHint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold active:scale-95 transition-transform"
              >
                <span>💡</span>
                <span>Gentle Hint {hintsUsed > 0 ? `(${hintsUsed})` : ""}</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                Difficulty Level: {level}
              </span>
            </div>
          </div>
        ) : (
          /* Completion Feedback */
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-md text-center my-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-500 flex items-center justify-center mx-auto text-3xl shadow-sm">
              🧩
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Pattern Completed!</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Pattern Path session finished
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
                <span className="text-[11px] font-bold text-slate-500">Pattern Accuracy</span>
                <p className="text-lg font-black text-slate-900">
                  {correctCount + incorrectAttempts > 0
                    ? Math.round(
                        (correctCount / (correctCount + incorrectAttempts)) * 100
                      )
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
                onClick={() => handlePlayNextLevel(adaptiveResult?.nextDifficulty ?? level)}
                className="w-full py-4 rounded-2xl bg-[#2E7D73] text-white font-extrabold text-base shadow-sm hover:bg-[#1A5C54] active:scale-98 transition-all"
              >
                Play Next Pattern (Level {adaptiveResult?.nextDifficulty ?? level})
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
