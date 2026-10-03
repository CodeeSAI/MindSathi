import React, { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { SosModal } from "../components/SosModal";
import {
  normalizeCognitiveGameResult,
  syncCanonicalCognitiveAIReport,
} from "../services/aiCognitiveReport";
import type { CognitiveAIReport } from "../services/aiCognitiveReport";
import { ACTIVE_SOS_ALERT_ID, createOrActivateSosAlert } from "../services/safetyAlertService";
import { getCachedWeather, setCachedWeather } from "../services/apiUsageGuard";
import { FocusFinder } from "./FocusFinder";
import { DailyLifeRecall } from "./DailyLifeRecall";
import { PatternPath } from "./PatternPath";
import { SaharaAiAssistant } from "./SaharaAiAssistant";
import {
  getDailyGameDifficulty,
  DifficultyLevel,
  getDailyAdaptiveLevel,
  saveDailyAdaptiveLevel,
  evaluateMemoryMatchPerformance,
  saveGameTelemetryWithSync,
  MemoryMatchLevel,
  AdaptiveResult,
  PAIRS_PER_LEVEL,
} from "../services/adaptiveCognitiveEngine";

import { Brain } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen =
  | "patient-home"
  | "brain-quest"
  | "games"
  | "memory-match"
  | "focus-finder"
  | "daily-life-recall"
  | "pattern-path"
  | "picture-recall"
  | "familiar-place"
  | "memory-garden"
  | "reminders"
  | "voice-assistant"
  | "patient-profile";

// ─── Shared Components ────────────────────────────────────────────────────────
function StatusBar() {
  return (
    <div className="flex items-center justify-end px-6 pt-3 pb-1 text-xs font-semibold text-[#37474F]">
      <div className="flex gap-1 items-center">
        <span>●●●</span>
        <span>WiFi</span>
        <span>🔋</span>
      </div>
    </div>
  );
}

function BottomNav({ active, onNav }: { active: string; onNav: (s: Screen) => void }) {
  const items = [
    { icon: "🏠", label: "Home", screen: "patient-home" as Screen, activeColor: "text-[#2F7D32]" },
    { icon: "🎮", label: "Games", screen: "games" as Screen, activeColor: "text-[#6956B6]" },
    { icon: "🌱", label: "Garden", screen: "memory-garden" as Screen, activeColor: "text-[#2F7D32]" },
    { icon: "⏰", label: "Reminders", screen: "reminders" as Screen, activeColor: "text-[#C58A17]" },
    { icon: "👤", label: "Profile", screen: "patient-profile" as Screen, activeColor: "text-[#3179A8]" },
  ];
  return (
    <div className="ms-bottom-nav flex pb-5 pt-2 px-2 z-30">
      {items.map(item => {
        const isActive = active === item.screen;
        return (
          <button
            key={item.screen}
            type="button"
            onClick={() => onNav(item.screen)}
            aria-label={item.label}
            className={`min-h-12 flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-2xl transition-all cursor-pointer ${
              isActive ? `${item.activeColor} ms-nav-active-pill font-bold` : "text-[#4F5A50] hover:text-[#182019]"
            }`}
          >
            <span className="text-2xl leading-none">{item.icon}</span>
            <span className={`text-[12px] leading-tight ${isActive ? "font-bold text-[#182019]" : "font-medium"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
function GamesLibrary({ onNav }: { onNav: (s: Screen) => void }) {
  const games = [
    {
      id: "memory-match" as Screen,
      title: "Memory Match",
      description: "Match cards and train your memory",
      icon: "🃏",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "focus-finder" as Screen,
      title: "Focus Finder",
      description: "Find the target and improve attention",
      icon: "🎯",
      color: "from-teal-500 to-cyan-600",
    },
    {
      id: "daily-life-recall" as Screen,
      title: "Daily Life Recall",
      description: "Remember everyday routine activities",
      icon: "🗓️",
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "pattern-path" as Screen,
      title: "Pattern Path",
      description: "Follow patterns and build reasoning",
      icon: "🧩",
      color: "from-sky-500 to-blue-600",
    },
    {
      id: "picture-recall" as Screen,
      title: "Picture Recall",
      description: "Remember familiar pictures and objects",
      icon: "🖼️",
      color: "from-pink-500 to-rose-600",
    },
    {
      id: "familiar-place" as Screen,
      title: "Familiar Place",
      description: "Recognize familiar places and memories",
      icon: "📍",
      color: "from-emerald-500 to-green-600",
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#FFFDF1] overflow-y-auto">
      
      {/* Header */}
      <div className="ms-patient-header px-5 pt-4 pb-6 rounded-b-[32px] shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNav("patient-home")}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xl transition active:scale-95 cursor-pointer"
          >
            ←
          </button>

          <div>
            <p className="text-[#EAF5E8] text-sm font-medium">
              Cognitive Training
            </p>

            <h1 className="text-2xl font-extrabold text-white">
              All Games 🧠
            </h1>
          </div>
        </div>

        <p className="text-[#EAF5E8]/90 text-sm mt-3">
          Choose an activity to exercise your memory, focus and thinking.
        </p>
      </div>

      {/* Games */}
      <div className="p-5 space-y-3 pb-8">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onNav(game.id)}
            className="ms-glass ms-game-card ms-glass--purple w-full text-left bg-white rounded-3xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl shadow-sm flex-shrink-0`}
              >
                {game.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-800">
                  {game.title}
                </h2>

                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  {game.description}
                </p>
              </div>

              <div className="text-gray-400 text-lg flex-shrink-0">
                →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BackButton({ onBack, light = false }: { onBack: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back"
      className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform ${
        light ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white hover:bg-gray-50 text-[#182019] shadow-sm border border-gray-100"
      }`}
    >
      <span className="text-xl leading-none">←</span>
    </button>
  );
}

function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMondayWeekId(date: Date): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return getLocalDateKey(monday);
}

function calculateWeeklyDashboardStats(gameDocs: any[], now: Date) {
  const periodId = getMondayWeekId(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = getLocalDateKey(today);
  const completedDates = new Set<string>();
  const todayGames = new Set<string>();
  let totalStars = 0;

  gameDocs.forEach((gameDoc) => {
    const data = gameDoc.data();
    const completedAt =
      data.completedAt?.toDate?.() ||
      (data.completedAt instanceof Date
        ? data.completedAt
        : typeof data.timestamp === "number"
        ? new Date(data.timestamp)
        : null);

    if (!(completedAt instanceof Date) || Number.isNaN(completedAt.getTime())) {
      return;
    }

    if (getMondayWeekId(completedAt) !== periodId) return;

    totalStars += Number(data.starsEarned || data.stars || 0);
    const completedDateKey = getLocalDateKey(completedAt);
    completedDates.add(completedDateKey);

    if (completedDateKey === todayKey) {
      todayGames.add(String(data.gameName || data.gameType || "Cognitive Game"));
    }
  });

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const startDate = completedDates.has(todayKey)
    ? today
    : completedDates.has(getLocalDateKey(yesterday))
    ? yesterday
    : null;

  let streak = 0;
  if (startDate) {
    const checkDate = new Date(startDate);
    while (completedDates.has(getLocalDateKey(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return {
    periodId,
    stars: totalStars,
    streak,
    badges: Math.min(todayGames.size + (streak >= 3 ? 1 : 0), 6),
    todayGames,
  };
}

// ─── Patient Home ─────────────────────────────────────────

function PatientHome({ onNav }: { onNav: (s: Screen) => void }) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";

  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState(0);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosAlertStatus, setSosAlertStatus] = useState<"active" | "resolved" | null>(null);
  const [todayCompletedGames, setTodayCompletedGames] =
    useState<Set<string>>(new Set());
    const [aiReport, setAiReport] = useState<CognitiveAIReport | null>(null);

  const [upcomingReminder, setUpcomingReminder] = useState<{
    title: string;
    time: string;
  } | null>(null);

  const memoryLevel =
    getDailyGameDifficulty("memory-match");

  const focusLevel =
    getDailyGameDifficulty("focus-finder");

  const recallLevel =
    getDailyGameDifficulty("daily-life-recall");

  const patternLevel =
    getDailyGameDifficulty("pattern-path");

  useEffect(() => {
    const patient = auth.currentUser;
    if (!patient) return;

    return onSnapshot(
      doc(db, "patients", patient.uid, "safetyAlerts", ACTIVE_SOS_ALERT_ID),
      (snapshot) => {
        const status = snapshot.data()?.status;
        setSosAlertStatus(status === "active" || status === "resolved" ? status : null);
      },
      (error) => console.error("Patient SOS listener failed:", error)
    );
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeReport: (() => void) | undefined;
    let unsubscribeGameResults: (() => void) | undefined;
    let mondayResetTimeout: number | undefined;
    let latestGameDocs: any[] = [];

    const loadDashboardData = async () => {
      const user = auth.currentUser;

      if (!user) return;

      const periodStorageKey = `patient-dashboard-weekly-period:${user.uid}`;
      const refreshWeeklyStats = (gameDocs: any[]) => {
        const stats = calculateWeeklyDashboardStats(gameDocs, new Date());

        try {
          const storedPeriod = window.localStorage.getItem(periodStorageKey);
          if (storedPeriod !== stats.periodId) {
            setStars(0);
            setStreak(0);
            setBadges(0);
            window.localStorage.setItem(periodStorageKey, stats.periodId);
          }
        } catch {
          // Firestore results still allow the weekly stats to be recalculated.
        }

        setStars(stats.stars);
        setStreak(stats.streak);
        setBadges(stats.badges);
        setTodayCompletedGames(stats.todayGames);
      };

      const scheduleMondayReset = () => {
        const now = new Date();
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextMonday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + daysUntilMonday
        );
        nextMonday.setHours(0, 0, 0, 0);

        mondayResetTimeout = window.setTimeout(() => {
          if (!isMounted) return;
          refreshWeeklyStats(latestGameDocs);
          scheduleMondayReset();
        }, nextMonday.getTime() - now.getTime());
      };

      refreshWeeklyStats([]);
      scheduleMondayReset();

      try {
        unsubscribeReport = onSnapshot(
          doc(db, "users", user.uid),
          (userSnapshot) => {
            if (isMounted) {
              setAiReport(userSnapshot.data()?.cognitiveReport ?? null);
            }
          },
          (error) => console.error("Patient cognitive report listener failed:", error)
        );

        unsubscribeGameResults = onSnapshot(
          collection(db, "patients", user.uid, "gameResults"),
          (gameSnapshot) => {
            if (!isMounted) return;
            latestGameDocs = gameSnapshot.docs;
            refreshWeeklyStats(latestGameDocs);
          },
          (error) => console.error("Patient game results listener failed:", error)
        );

        // ─── Reminder ──────────────────────────

        const reminderSnapshot = await getDoc(
          doc(
            db,
            "patients",
            user.uid,
            "reminders",
            "today"
          )
        );

        if (reminderSnapshot.exists()) {
          const reminderData =
            reminderSnapshot.data();

          const reminderList =
            Array.isArray(
              reminderData.reminders
            )
              ? reminderData.reminders
              : [];

          const doneList =
            Array.isArray(
              reminderData.done
            )
              ? reminderData.done
              : [];

          const pending = reminderList
            .map(
              (item: any, index: number) => ({
                title: String(
                  item.label ||
                    item.title ||
                    "Reminder"
                ),
                time: String(
                  item.time || ""
                ),
                done: Boolean(
                  doneList[index]
                ),
              })
            )
            .filter(
              (item) => !item.done
            );

          setUpcomingReminder(
            pending.length > 0
              ? {
                  title: pending[0].title,
                  time: pending[0].time,
                }
              : null
          );
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error
        );
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
      unsubscribeReport?.();
      unsubscribeGameResults?.();
      if (mondayResetTimeout !== undefined) {
        window.clearTimeout(mondayResetTimeout);
      }
    };
  }, []);

  // ─── Four Cognitive Activities ───────────────

  const fourGames = [
    {
      id: "memory-match" as Screen,
      title: "Memory Match",
      domain: "Working Memory",
      desc: "Card matching & visual pairs",
      icon: "🃏",
      level: memoryLevel,
      bg: "bg-violet-50/80",
      border: "border-violet-200/70",
      isCompleted:
        todayCompletedGames.has(
          "Memory Match"
        ),
    },
    {
      id: "focus-finder" as Screen,
      title: "Focus Finder",
      domain: "Attention Focus",
      desc: "Spot target symbols quickly",
      icon: "🎯",
      level: focusLevel,
      bg: "bg-sky-50/80",
      border: "border-sky-200/70",
      isCompleted:
        todayCompletedGames.has(
          "Focus Finder"
        ),
    },
    {
      id: "daily-life-recall" as Screen,
      title: "Daily Life Recall",
      domain: "Routine Recall",
      desc: "Order everyday routine steps",
      icon: "🗓️",
      level: recallLevel,
      bg: "bg-amber-50/80",
      border: "border-amber-200/70",
      isCompleted:
        todayCompletedGames.has(
          "Daily Life Recall"
        ),
    },
    {
      id: "pattern-path" as Screen,
      title: "Pattern Path",
      domain: "Pattern Logic",
      desc: "Visual sequence reasoning",
      icon: "🧩",
      level: patternLevel,
      bg: "bg-rose-50/80",
      border: "border-rose-200/70",
      isCompleted:
        todayCompletedGames.has(
          "Pattern Path"
        ),
    },
  ];

  const completedCount =
    fourGames.filter(
      (game) => game.isCompleted
    ).length;

  const progress =
    (completedCount / 4) * 100;

  const nextGame =
    fourGames.find(
      (game) => !game.isCompleted
    ) || fourGames[0];

  return (
    <div className="h-full flex flex-col bg-[#FFFDF1] overflow-y-auto">
      <StatusBar />

      {/* ─── Header ─────────────────────────────── */}

      <div className="ms-patient-header px-5 pt-3 pb-5 rounded-b-[32px] shadow-md">

        <div className="flex items-center justify-between mb-3">

          <div>
            <p className="text-[#EAF5E8] text-sm font-medium">
              {greeting},
            </p>

            <h1 className="text-3xl font-extrabold text-white leading-tight">
              Ravi! 👋
            </h1>

            <p className="text-[#EAF5E8]/90 text-sm mt-0.5">
              Ready for today's cognitive journey?
            </p>
          </div>

          <button
            onClick={() =>
              onNav("patient-profile")
            }
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer"
            aria-label="View Patient Profile"
          >
            <span className="text-3xl">
              👴
            </span>
          </button>

        </div>

        {/* Stats */}

        <div className="flex gap-2.5 mt-2">

          <div className="ms-stat-panel ms-stat-panel--stars flex-1 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <span className="ms-stat-icon ms-stat-icon--stars text-xl">
              ⭐
            </span>

            <div className="min-w-0">
              <p className="text-[#182019] font-black text-lg leading-tight">
                {stars}
              </p>

              <p className="text-[#4F5A50] text-xs font-semibold">
                Stars
              </p>
            </div>
          </div>

          <div className="ms-stat-panel ms-stat-panel--streak flex-1 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <span className="ms-stat-icon ms-stat-icon--streak text-xl">
              🔥
            </span>

            <div className="min-w-0">
              <p className="text-[#182019] font-black text-lg leading-tight">
                {streak} d
              </p>

              <p className="text-[#4F5A50] text-xs font-semibold">
                Streak
              </p>
            </div>
          </div>

          <div className="ms-stat-panel ms-stat-panel--badges flex-1 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <span className="ms-stat-icon ms-stat-icon--badges text-xl">
              🏅
            </span>

            <div className="min-w-0">
              <p className="text-[#182019] font-black text-lg leading-tight">
                {badges}
              </p>

              <p className="text-[#4F5A50] text-xs font-semibold">
                Badges
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Main Content ──────────────────────── */}

      <div className="ms-patient-content px-5 pt-4 pb-5 flex flex-col gap-4">

        {/* Today's Cognitive Journey */}

        <div
          className="ms-glass ms-card-lift w-full rounded-3xl p-5 shadow-sm border border-white/80"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 92% 12%, rgba(244, 124, 108, 0.08), transparent 45%), radial-gradient(ellipse at 8% 88%, rgba(155, 138, 251, 0.08), transparent 45%), linear-gradient(145deg, rgba(255, 255, 255, 0.90), rgba(255, 253, 241, 0.78))",
          }}
        >

          <div className="flex items-start justify-between">

            <div>
              <p className="text-[#2F7D32] text-xs font-bold uppercase tracking-wider">
                ✨ Today's Journey
              </p>

              <h2 className="text-2xl font-extrabold text-[#182019] mt-1">
                Today's Cognitive Journey
              </h2>

              <p className="text-[#4F5A50] text-sm mt-0.5">
                4 personalized activities
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 border border-rose-200/60 shadow-xs flex items-center justify-center text-4xl flex-shrink-0">
              🧠
            </div>

          </div>

          {/* Progress */}

          <div className="mt-5">

            <div className="flex justify-between text-[#4F5A50] text-sm mb-2 font-medium">
              <span>
                {completedCount} of 4 completed
              </span>

              <span className="font-bold text-[#182019]">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-2.5 bg-slate-200/70 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#2F7D32] rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>

          {/* Journey Steps */}

          <div className="grid grid-cols-4 gap-2 mt-5">

            {fourGames.map(
              (game) => {
                const isNext = game.id === nextGame.id;
                const iconColorStyle =
                  game.id === "memory-match"
                    ? "bg-[#FFE3DC] text-[#A84E31] border-[#F47C6C]/40"
                    : game.id === "focus-finder"
                    ? "bg-[#E6F2FF] text-[#3179A8] border-[#6EA8D9]/40"
                    : game.id === "daily-life-recall"
                    ? "bg-[#FFF0C7] text-[#94650D] border-[#F4B942]/40"
                    : "bg-[#EEE9FF] text-[#6956B6] border-[#9B8AFB]/40";

                return (
                  <button
                    key={game.id}
                    onClick={() =>
                      onNav(game.id)
                    }
                    className="flex flex-col items-center gap-1.5 flex-1 p-1 rounded-2xl hover:bg-white/40 transition active:scale-95 cursor-pointer"
                  >

                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border transition-all ${
                        game.isCompleted
                          ? "bg-[#2F7D32] text-white border-[#2F7D32] shadow-sm"
                          : isNext
                          ? `${iconColorStyle} ring-2 ring-[#2F7D32] ring-offset-2 shadow-sm`
                          : `${iconColorStyle} opacity-90`
                      }`}
                    >
                      {game.isCompleted
                        ? "✓"
                        : game.icon}
                    </div>

                    <span className="text-xs text-[#182019] text-center leading-tight font-semibold px-0.5">
                      {game.title.split(" ")[0]}
                    </span>

                  </button>
                );
              }
            )}

          </div>

          {/* Continue */}

          {completedCount < 4 && (
            <button
              onClick={() =>
                onNav(nextGame.id)
              }
              className="ms-btn-journey w-full min-h-12 mt-5 rounded-2xl py-3.5 px-6 font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue Journey</span>
              <span className="text-lg">→</span>
            </button>
          )}

          {completedCount === 4 && (
            <div className="ms-glass ms-glass--green mt-5 rounded-2xl p-4 text-center text-[#182019] border border-emerald-200">
              <span className="text-2xl">🎉</span>
              <p className="font-bold mt-1 text-[#2F7D32]">
                Amazing work today!
              </p>
            </div>
          )}

        </div>

        {/* Upcoming Reminder */}

        {upcomingReminder && (
          <button
            onClick={() =>
              onNav("reminders")
            }
            className="ms-glass ms-glass--amber ms-card-lift w-full border border-amber-200/80 rounded-3xl p-5 text-left flex items-center gap-4 cursor-pointer"
          >

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-sm flex-shrink-0 text-white">
              💊
            </div>

            <div className="flex-1 min-w-0">

              <p className="text-[#8A4B08] text-xs font-bold uppercase tracking-wider">
                Upcoming reminder
              </p>

              <h3 className="text-[#182019] text-lg font-bold truncate mt-0.5">
                {upcomingReminder.title}
              </h3>

              <p className="text-[#4F5A50] text-sm mt-0.5">
                Today • {upcomingReminder.time}
              </p>

            </div>

            <span className="text-amber-600 font-bold text-xl flex-shrink-0">
              →
            </span>

          </button>
        )}

        {/* AI Cognitive Report */}
        {aiReport && (
          <div
            onClick={() => onNav("games")}
            className="ms-glass ms-glass--purple ms-card-lift border border-purple-200/70 rounded-3xl p-5 text-[#182019] shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide font-bold text-violet-800">
                  Cognitive AI Report
                </p>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="ms-score-enter text-3xl font-black text-[#2F7D32]">
                    {aiReport.overallScore}/100
                  </span>

                  <span className="text-xs bg-violet-100/80 text-violet-800 px-2.5 py-1 rounded-full font-bold">
                    {aiReport.totalSessions ?? aiReport.sourceGameCount ?? "—"} sessions
                  </span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200/60 flex items-center justify-center text-violet-700 shadow-xs flex-shrink-0">
                <Brain className="w-7 h-7 text-violet-700" />
              </div>
            </div>

            <p className="text-sm text-[#4F5A50] mt-3 leading-relaxed">
              {aiReport.summary}
            </p>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/70"
              role="progressbar"
              aria-label="Overall cognitive game performance"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={aiReport.overallScore}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#2F7D32] transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, aiReport.overallScore))}%` }}
              />
            </div>

            {aiReport.strengths?.length > 0 && (
              <p className="text-xs text-[#4F5A50] mt-2.5">
                <span className="font-bold text-[#182019]">Strengths: </span>
                {aiReport.strengths.slice(0, 2).map((item: any) => typeof item === "string" ? item : item.observation).filter(Boolean).join(" ")}
              </p>
            )}
            {aiReport.areasToImprove?.length > 0 && (
              <p className="text-xs text-[#4F5A50] mt-1.5">
                <span className="font-bold text-[#182019]">Try next: </span>
                {aiReport.areasToImprove.slice(0, 2).map((item: any) => item.observation).join(" ")}
              </p>
            )}
            {aiReport.personalizedRecommendations?.length > 0 && (
              <p className="text-xs text-[#4F5A50] mt-1.5">
                {aiReport.personalizedRecommendations[0]}
              </p>
            )}
            {aiReport.trendExplanation && (
              <p className="text-xs text-[#4F5A50] mt-1.5">{aiReport.trendExplanation}</p>
            )}
            {aiReport.domainInsights?.slice(0, 2).map((insight) => (
              <p key={insight.domain} className="text-xs text-[#4F5A50] mt-1">
                <span className="font-semibold text-[#182019]">{insight.domain}:</span> {insight.observation}
              </p>
            ))}
            <p className="text-xs text-[#2F7D32] font-bold mt-3">{aiReport.encouragement}</p>
          </div>
        )}
        {!aiReport && (
          <p className="text-sm text-[#667066] italic">
            Your personalized report will be available after more activity.
          </p>
        )}

        {/* Cognitive Activities */}

        <div>

          <div className="flex items-center justify-between mb-3">

            <div>
              <h2 className="text-xl font-extrabold text-[#182019]">
                Cognitive Activities
              </h2>

              <p className="text-sm text-[#4F5A50]">
                AI-personalized for Ravi
              </p>
            </div>

            <button
              onClick={() =>
                onNav("games")
              }
              className="text-[#2F7D32] hover:text-[#245F2B] font-bold text-sm cursor-pointer"
            >
              See all →
            </button>

          </div>

          <div className="grid grid-cols-2 gap-3">

            {fourGames.map(
              (game) => (
                <button
                  key={game.id}
                  onClick={() =>
                    onNav(game.id)
                  }
                  className={`ms-game-card ms-glass ms-glass--${game.id === "memory-match" ? "purple" : game.id === "focus-finder" ? "blue" : game.id === "daily-life-recall" ? "peach" : "amber"} ${game.bg} ${game.border} border rounded-3xl p-4 text-left shadow-sm cursor-pointer`}
                >

                  <div className="flex items-start justify-between">

                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm border border-slate-100">
                      {game.icon}
                    </div>

                    {game.isCompleted && (
                      <span className="w-7 h-7 rounded-full bg-[#2F7D32] text-white flex items-center justify-center text-sm font-bold shadow-xs">
                        ✓
                      </span>
                    )}

                  </div>

                  <h3 className="font-bold text-[#182019] mt-3 leading-tight">
                    {game.title}
                  </h3>

                  <p className="text-[#4F5A50] text-xs mt-1 font-medium">
                    {game.domain}
                  </p>

                  <p className="text-[#667066] text-xs mt-2 leading-relaxed">
                    {game.desc}
                  </p>

                  <div className="flex items-center justify-between mt-3">

                    <span className="px-2.5 py-1 rounded-full bg-white text-[#182019] text-xs font-bold border border-slate-200/60 shadow-2xs">
                      Level {game.level}
                    </span>

                    <span className="text-[#4F5A50] font-bold">
                      →
                    </span>

                  </div>

                  {game.isCompleted && (
                    <p className="text-[#2F7D32] text-xs font-bold mt-2">
                      Completed today
                    </p>
                  )}

                </button>
              )
            )}

          </div>

        </div>

        {/* Memory Garden */}

        <button
          onClick={() =>
            onNav("memory-garden")
          }
          className="ms-glass ms-glass--green ms-card-lift w-full border border-emerald-200/80 rounded-3xl p-5 text-left cursor-pointer"
        >

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-2xl bg-emerald-100/90 border border-emerald-200/60 flex items-center justify-center text-3xl shadow-xs flex-shrink-0">
              🌱
            </div>

            <div className="flex-1 min-w-0">

              <h2 className="text-lg font-extrabold text-[#182019]">
                Memory Garden
              </h2>

              <p className="text-sm text-[#4F5A50] mt-0.5">
                Water your garden and watch your memories grow.
              </p>

            </div>

            <span className="text-emerald-700 font-bold text-xl flex-shrink-0">
              →
            </span>

          </div>

        </button>

        {/* Sahara.AI + SOS */}

        <div className="grid grid-cols-2 gap-3">

          <button
            onClick={() =>
              onNav("voice-assistant")
            }
            className="ms-glass ms-glass--purple ms-card-lift bg-violet-50/70 border border-violet-200/70 rounded-3xl p-5 text-left cursor-pointer"
          >

            <span className="text-3xl">
              🤖
            </span>

            <h3 className="font-extrabold text-[#182019] mt-3">
              Sahara.AI
            </h3>

            <p className="text-xs text-[#4F5A50] mt-1 leading-snug">
              Talk, ask questions and get help.
            </p>

          </button>

          <button
            onClick={() =>
              setIsSosModalOpen(true)}
            className="ms-glass ms-card-lift border border-rose-200/70 rounded-3xl p-5 text-left cursor-pointer"
            style={{"--ms-glass-tint":"rgb(232 64 64 / 6%)"} as React.CSSProperties}
          >

            <span className="text-3xl">
              🆘
            </span>

            <h3 className="font-extrabold text-rose-700 mt-3">
              {sosAlertStatus === "active" ? "SOS Active" : "SOS Help"}
            </h3>

            <p className="text-xs text-[#667066] mt-1 leading-snug">
              {sosAlertStatus === "active"
                ? "Your caregiver can see this active alert."
                : sosAlertStatus === "resolved"
                ? "Your caregiver resolved the last SOS alert."
                : "Create an alert for your linked caregiver."}
            </p>

          </button>

        </div>

      </div>
      <SosModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        onConfirm={async () => {
          const patient = auth.currentUser;
          if (!patient) throw new Error("No authenticated patient is available.");
          await createOrActivateSosAlert(patient.uid, "patient");
        }}
      />
    </div>
  );
}
// ─── Brain Quest ──────────────────────────────────────────────────────────────
function BrainQuest({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const questions = [
    { q: "What day is it today?", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], answer: new Date().toLocaleDateString("en-US",{weekday:"long"}).split(",")[0] },
    { q: "Who is this person?", options: ["Your daughter Priya", "A nurse", "A neighbor", "A friend"], answer: "Your daughter Priya" },
    { q: "What did you have for breakfast?", options: ["Idli & Sambar", "Bread & Butter", "Oats", "Poha"], answer: "Idli & Sambar" },
  ];
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (opt: string) => {
    setSelected(opt);
    setShowResult(true);
    setTimeout(() => {
      if (step < questions.length - 1) {
        setStep(s => s + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setDone(true);
      }
    }, 1200);
  };

  if (done) return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 animate-fade-in">
        <div className="text-8xl animate-bounce-gentle">🏆</div>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#37474F]">Wonderful!</h2>
          <p className="text-[#78909C] text-lg mt-2">You completed today's Brain Quest!</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1,2,3].map(s => <span key={s} className="text-4xl animate-grow">⭐</span>)}
          </div>
          <div className="bg-[#E8F5E9] rounded-2xl px-6 py-3 mt-4">
            <p className="text-[#43A047] font-bold text-lg">+30 Stars Earned!</p>
          </div>
        </div>
        <button onClick={onBack} className="w-full py-5 bg-[#2E7D73] text-white text-xl font-bold rounded-2xl shadow-md">Back to Home</button>
      </div>
    </div>
  );

  const q = questions[step];
  return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="bg-gradient-to-br from-[#7E57C2] to-[#512DA8] px-5 pt-2 pb-6 rounded-b-[32px]">
        <div className="flex items-center gap-3 mb-4">
          <BackButton onBack={onBack} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Daily Brain Quest</h2>
            <p className="text-purple-200 text-sm">Question {step+1} of {questions.length}</p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-2.5">
          <div className="bg-white rounded-full h-2.5 transition-all duration-500" style={{width: `${((step)/questions.length)*100}%`}} />
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 flex flex-col gap-5 animate-fade-in">
        {step === 1 && (
          <div className="w-28 h-28 rounded-3xl bg-[#D9F4F1] mx-auto flex items-center justify-center shadow-md">
            <span className="text-7xl">👧</span>
          </div>
        )}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <p className="text-[#37474F] text-2xl font-extrabold text-center leading-snug">{q.q}</p>
        </div>
        <div className="flex flex-col gap-3">
          {q.options.map(opt => (
            <button
              key={opt}
              onClick={() => !showResult && handleSelect(opt)}
              className={`w-full py-5 px-6 rounded-2xl text-lg font-bold transition-all text-left border-2 ${
                showResult && opt === q.answer ? "bg-[#E8F5E9] border-[#43A047] text-[#43A047]" :
                showResult && opt === selected && opt !== q.answer ? "bg-[#FFEBEE] border-[#E53935] text-[#E53935]" :
                "bg-white border-gray-100 text-[#37474F] active:scale-95"
              }`}
            >
              {showResult && opt === q.answer ? "✅ " : showResult && opt === selected ? "❌ " : ""}{opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Memory Match ─────────────────────────────────────────────────────────────

const ALL_MATCH_EMOJIS = [
  "🌸",
  "🦋",
  "🌈",
  "🐶",
  "🏡",
  "☕",
  "🎵",
  "🌻",
];

function MemoryMatch({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState<MemoryMatchLevel>(() =>
    getDailyAdaptiveLevel()
  );

  const numPairs = PAIRS_PER_LEVEL[level];

  const generateCards = (lvl: MemoryMatchLevel) => {
    const pairsCount = PAIRS_PER_LEVEL[lvl];

    const selectedEmojis = ALL_MATCH_EMOJIS.slice(
      0,
      pairsCount
    );

    const pairs = [
      ...selectedEmojis,
      ...selectedEmojis,
    ];

    return pairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false,
      }));
  };

  const [cards, setCards] = useState(() =>
    generateCards(level)
  );

  const [first, setFirst] =
    useState<number | null>(null);

  const [locked, setLocked] = useState(false);

  const [moves, setMoves] = useState(0);

  const [incorrectAttempts, setIncorrectAttempts] =
    useState(0);

  const [hesitationCount, setHesitationCount] =
    useState(0);

  const [adaptiveResult, setAdaptiveResult] =
    useState<AdaptiveResult | null>(null);

  const startTimeRef = useRef(Date.now());

  const hesitationStartRef =
    useRef<number | null>(null);

  const resultSaved = useRef(false);

  const matched = cards.filter(
    (card) => card.matched
  ).length;

  const allMatched =
    matched === cards.length;

  useEffect(() => {
    hesitationStartRef.current = Date.now();
  }, [level]);

  const flip = (id: number) => {
    if (
      locked ||
      cards[id].flipped ||
      cards[id].matched
    ) {
      return;
    }

    if (hesitationStartRef.current !== null) {
      const hesitationSeconds =
        (Date.now() -
          hesitationStartRef.current) /
        1000;

      if (hesitationSeconds >= 5) {
        setHesitationCount(
          (count) => count + 1
        );
      }
    }

    hesitationStartRef.current = Date.now();

    const next = cards.map((card, index) =>
      index === id
        ? {
            ...card,
            flipped: true,
          }
        : card
    );

    setCards(next);

    if (first === null) {
      setFirst(id);
      return;
    }

    setMoves(
      (moves) => moves + 1
    );

    setLocked(true);

    setTimeout(() => {
      setCards((previous) => {
        const isMatch =
          previous[first].emoji ===
          previous[id].emoji;

        if (!isMatch) {
          setIncorrectAttempts(
            (attempts) =>
              attempts + 1
          );
        }

        return previous.map(
          (card, index) =>
            index === first ||
            index === id
              ? {
                  ...card,
                  matched: isMatch,
                  flipped: isMatch,
                }
              : card
        );
      });

      setFirst(null);
      setLocked(false);

      hesitationStartRef.current =
        Date.now();
    }, 900);
  };

  // ─── Evaluate completed round ─────────────────────────────────────────────

  useEffect(() => {
    if (
      !allMatched ||
      resultSaved.current
    ) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      console.error(
        "No authenticated patient found."
      );
      return;
    }

    resultSaved.current = true;

    const now = Date.now();

    const completionTimeMs =
      startTimeRef.current > 0
        ? now - startTimeRef.current
        : 8000;

    const completionTimeSeconds =
      Math.max(
        1,
        Math.round(
          completionTimeMs / 1000
        )
      );

    const averageResponseTime =
      moves > 0
        ? Number(
            (
              completionTimeSeconds /
              moves
            ).toFixed(1)
          )
        : 2.0;

    const accuracy = Math.min(
      100,
      Math.max(
        10,
        Math.round(
          (numPairs /
            Math.max(moves, 1)) *
            100
        )
      )
    );

    const evaluation =
      evaluateMemoryMatchPerformance({
        currentLevel: level,
        moves,
        pairsCount: numPairs,
        incorrectAttempts,
        accuracy,
        completionTimeSeconds,
        averageResponseTimeSeconds:
          averageResponseTime,
        hesitationCount,
      });

    setAdaptiveResult(
      evaluation
    );

    saveDailyAdaptiveLevel(
      evaluation.nextLevel
    );

    saveGameTelemetryWithSync({
      gameId: "memory-match",
      gameName: "Memory Match",
      cognitiveDomain: "Memory",

      difficultyLevel: level,

      score: 20,
      maxScore: 20,
      starsEarned: 20,

      moves,
      pairsCount: numPairs,

      accuracy,
      incorrectAttempts,

      hintsUsed: 0,
      hesitationCount,

      completionTimeSeconds,
      averageResponseTimeSeconds:
        averageResponseTime,

      nextDifficultyLevel:
        evaluation.nextLevel,

      completionStatus: "completed",

      clientSubmissionId:
        `mm_${user.uid}_${now}`,
    }).catch((error) => {
      console.error(
        "Failed to save adaptive Memory Match telemetry:",
        error
      );
    });
  }, [
    allMatched,
    moves,
    level,
    numPairs,
    incorrectAttempts,
    hesitationCount,
  ]);

  // ─── Start next adaptive round ────────────────────────────────────────────

  const startNextRound = () => {
    const nextLevel =
      adaptiveResult?.nextLevel ??
      level;

    setLevel(nextLevel);

    setCards(
      generateCards(nextLevel)
    );

    setFirst(null);
    setLocked(false);
    setMoves(0);
    setIncorrectAttempts(0);
    setHesitationCount(0);

    setAdaptiveResult(null);

    resultSaved.current = false;

    startTimeRef.current =
      Date.now();

    hesitationStartRef.current =
      Date.now();
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />

      <div className="bg-gradient-to-br from-[#7E57C2] to-[#512DA8] px-5 pt-2 pb-5 rounded-b-[32px]">
        <div className="flex items-center gap-3 mb-3">
          <BackButton
            onBack={onBack}
            light
          />

          <div className="flex-1">
            <h2 className="text-white text-xl font-extrabold">
              Memory Match
            </h2>

            <p className="text-purple-100 text-xs mt-1">
              Difficulty Level: {level}
            </p>
          </div>

          <div className="bg-white/20 px-3 py-2 rounded-xl">
            <p className="text-white text-xs font-bold">
              Level {level}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white/20 rounded-2xl py-3 text-center">
            <p className="text-purple-100 text-xs">
              Difficulty
            </p>

            <p className="text-white text-2xl font-extrabold">
              {level}
            </p>
          </div>

          <div className="flex-1 bg-white/20 rounded-2xl py-3 text-center">
            <p className="text-purple-100 text-xs">
              Pairs Found
            </p>

            <p className="text-white text-2xl font-extrabold">
              {matched / 2}/{numPairs}
            </p>
          </div>

          <div className="flex-1 bg-white/20 rounded-2xl py-3 text-center">
            <p className="text-purple-100 text-xs">
              Moves
            </p>

            <p className="text-white text-2xl font-extrabold">
              {moves}
            </p>
          </div>
        </div>
      </div>

      {allMatched ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 overflow-y-auto">
          <span className="text-7xl animate-bounce-gentle">
            🎉
          </span>

          <h2 className="text-3xl font-extrabold text-[#37474F]">
            Great job!
          </h2>

          <p className="text-[#78909C] text-lg text-center">
            You matched all {numPairs} pairs
            in {moves} moves!
          </p>

          <div className="bg-[#E8F5E9] rounded-2xl px-6 py-3">
            <p className="text-[#43A047] font-bold text-lg">
              +20 Stars Earned! ⭐
            </p>
          </div>

          {adaptiveResult && (
            <div className="w-full bg-[#EDE7F6] rounded-2xl p-5 text-center">
              <p className="text-[#512DA8] font-extrabold text-lg">
                {adaptiveResult.feedbackMessage}
              </p>

              <p className="text-[#78909C] text-sm mt-2">
                {adaptiveResult.supportiveNote}
              </p>

              <div className="mt-3">
                <span className="text-[#512DA8] font-bold">
                  Performance Score:{" "}
                  {adaptiveResult.normalizedScore}/100
                </span>
              </div>
            </div>
          )}

          <button
            onClick={startNextRound}
            className="w-full py-5 bg-[#7E57C2] text-white text-xl font-bold rounded-2xl"
          >
            Play Next Round
          </button>

          <button
            onClick={onBack}
            className="w-full py-4 bg-white border-2 border-[#D9F4F1] text-[#512DA8] text-lg font-bold rounded-2xl"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <div className="flex-1 px-4 pt-5 grid grid-cols-4 gap-3 content-start overflow-y-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() =>
                flip(card.id)
              }
              className={`aspect-square rounded-2xl flex items-center justify-center text-3xl font-bold transition-all duration-300 shadow-sm ${
                card.flipped ||
                card.matched
                  ? card.matched
                    ? "bg-[#E8F5E9] scale-95"
                    : "bg-[#EDE7F6]"
                  : "bg-white border-2 border-[#D9F4F1] active:scale-95"
              }`}
            >
              {card.flipped ||
              card.matched ? (
                card.emoji
              ) : (
                <span className="text-[#D9F4F1] text-2xl">
                  ?
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// ─── Memory Garden ────────────────────────────────────────────────────────────
const PLANTS = [
  { emoji: "🌸", name: "Cherry Blossom", memory: "Your favorite childhood tree", stage: 3 },
  { emoji: "🌺", name: "Hibiscus", memory: "From your grandmother's garden", stage: 2 },
  { emoji: "🌻", name: "Sunflower", memory: "Your daughter Priya loves these", stage: 3 },
  { emoji: "🌿", name: "Tulsi", memory: "From your home in Pune", stage: 1 },
  { emoji: "🪷", name: "Lotus", memory: "Festival memories", stage: 2 },
];

function MemoryGarden({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<typeof PLANTS[0]|null>(null);
  const [plants, setPlants] = useState(PLANTS);
  useEffect(() => {
  const loadGarden = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const gardenDoc = await getDoc(
        doc(db, "patients", user.uid, "garden", "plants")
      );

      if (gardenDoc.exists()) {
  const gardenData = gardenDoc.data();
  const todayKey = new Date().toLocaleDateString("en-CA");

  if (gardenData.dateKey === todayKey) {
    const savedPlants = gardenData.plants;

    if (Array.isArray(savedPlants)) {
      setPlants(savedPlants);
    }
  } else {
    setPlants(PLANTS);

    await setDoc(
      doc(db, "patients", user.uid, "garden", "plants"),
      {
        plants: PLANTS,
        dateKey: todayKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
} else {
  const todayKey = new Date().toLocaleDateString("en-CA");

  setPlants(PLANTS);

  await setDoc(
    doc(db, "patients", user.uid, "garden", "plants"),
    {
      plants: PLANTS,
      dateKey: todayKey,
      updatedAt: serverTimestamp(),
    }
  );
}
       } catch (error) {
      console.error("Failed to load garden:", error);
    }
  };

  loadGarden();
}, []);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="bg-gradient-to-br from-[#43A047] to-[#1B5E20] px-5 pt-2 pb-6 rounded-b-[32px]">
        <div className="flex items-center gap-3 mb-3">
          <BackButton onBack={onBack} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Memory Garden</h2>
            <p className="text-green-100 text-sm">Each plant holds a memory 🌱</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/20 rounded-2xl py-3 text-center">
            <p className="text-green-100 text-xs">Plants</p>
            <p className="text-white text-2xl font-extrabold">5</p>
          </div>
          <div className="flex-1 bg-white/20 rounded-2xl py-3 text-center">
            <p className="text-green-100 text-xs">Memories</p>
            <p className="text-white text-2xl font-extrabold">12</p>
          </div>
          <div className="flex-1 bg-white/20 rounded-2xl py-3 text-center">
            <p className="text-green-100 text-xs">Water</p>
            <p className="text-white text-2xl font-extrabold">💧×3</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pt-5 overflow-y-auto">
        {selected ? (
          <div className="animate-fade-in">
            <button onClick={() => setSelected(null)} className="text-[#2E7D73] font-semibold mb-4 flex items-center gap-2">← Back to Garden</button>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-8xl mb-3">{selected.emoji}</div>
              <h3 className="text-2xl font-extrabold text-[#37474F]">{selected.name}</h3>
              <div className="flex justify-center gap-1 my-3">
                {[1,2,3].map(s => (
                  <div key={s} className={`w-4 h-4 rounded-full ${s <= selected.stage ? "bg-[#43A047]" : "bg-gray-100"}`} />
                ))}
              </div>
              <div className="bg-[#F0FDF4] rounded-2xl p-4 mt-3">
                <p className="text-sm text-[#78909C] font-semibold mb-1">Memory attached:</p>
                <p className="text-[#37474F] text-lg font-medium italic">"{selected.memory}"</p>
              </div>
              <button
onClick={async () => {
  if (!selected) return;

  const updatedPlant = {
    ...selected,
    stage: Math.min(selected.stage + 1, 3),
  };

  const updatedPlants = plants.map((plant) =>
    plant.name === selected.name ? updatedPlant : plant
  );

  setPlants(updatedPlants);
  setSelected(updatedPlant);

  const user = auth.currentUser;
  if (!user) return;

  try {
    await setDoc(
      doc(db, "patients", user.uid, "garden", "plants"),
      {
  plants: updatedPlants,
  dateKey: new Date().toLocaleDateString("en-CA"),
  updatedAt: serverTimestamp(),
},
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to save garden:", error);
  }
}}
  className="w-full mt-4 py-4 bg-[#43A047] text-white font-bold text-lg rounded-2xl"
>
  💧 Water Plant
</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-6">
            {plants.map((plant, i) => (
              <button
                key={i}
                onClick={() => setSelected(plant)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className={`text-5xl ${i===0 || i===2 ? "animate-bounce-gentle" : ""}`}>{plant.emoji}</div>
                <p className="text-[#37474F] font-bold text-sm text-center">{plant.name}</p>
                <div className="flex gap-1">
                  {[1,2,3].map(s => (
                    <div key={s} className={`w-3 h-3 rounded-full ${s <= plant.stage ? "bg-[#43A047]" : "bg-gray-100"}`} />
                  ))}
                </div>
              </button>
            ))}
            <button className="bg-[#F0FDF4] border-2 border-dashed border-[#43A047]/40 rounded-3xl p-5 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                <span className="text-3xl text-[#43A047]">+</span>
              </div>
              <p className="text-[#43A047] font-bold text-sm text-center">Add Plant</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reminders ────────────────────────────────────────────────────────────────
const REMINDERS = [
  { time: "8:00 AM", label: "Morning Walk", icon: "🚶", done: true, color: "#43A047" },
  { time: "9:00 AM", label: "Take Medication", icon: "💊", done: true, color: "#F59E0B" },
  { time: "11:00 AM", label: "Call Priya", icon: "📞", done: false, color: "#2E7D73" },
  { time: "1:00 PM", label: "Lunch", icon: "🍱", done: false, color: "#7E57C2" },
  { time: "4:00 PM", label: "Evening Snack", icon: "🍎", done: false, color: "#F59E0B" },
  { time: "8:00 PM", label: "Night Medication", icon: "💊", done: false, color: "#F59E0B" },
];

function Reminders({ onBack }: { onBack: () => void }) {
  const [done, setDone] = useState<boolean[]>(REMINDERS.map(r => r.done));
  useEffect(() => {
 const loadReminders = async () => {
  const user = auth.currentUser;

  if (!user) return;

  try {
    const todayDoc = await getDoc(
      doc(db, "patients", user.uid, "reminders", "today")
    );

    const todayKey = new Date().toLocaleDateString("en-CA");

    if (todayDoc.exists()) {
      const data = todayDoc.data();

      // If the saved reminder state is from today, keep it
      if (data.dateKey === todayKey) {
        const savedDone = Array.isArray(data.done)
          ? data.done
          : REMINDERS.map(() => false);

        setDone(savedDone);
      } else {
        // New day → reset all reminders
        const freshDone = REMINDERS.map(() => false);

        setDone(freshDone);

        await setDoc(
          doc(db, "patients", user.uid, "reminders", "today"),
          {
            reminders: REMINDERS,
            done: freshDone,
            dateKey: todayKey,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } else {
      // First time → create today's reminder state
      const freshDone = REMINDERS.map(() => false);

      setDone(freshDone);

      await setDoc(
        doc(db, "patients", user.uid, "reminders", "today"),
        {
          reminders: REMINDERS,
          done: freshDone,
          dateKey: todayKey,
          updatedAt: serverTimestamp(),
        }
      );
    }
  } catch (error) {
    console.error("Failed to load reminders:", error);
  }
};

  loadReminders();
}, []);

  return (
    <div className="h-full flex flex-col bg-[#FFFDF1]">
      <StatusBar />
      <div className="ms-patient-header px-5 pt-3 pb-5 rounded-b-[32px] shadow-md">
        <div className="flex items-center gap-3">
          <BackButton onBack={onBack} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Reminders</h2>
            <p className="text-[#EAF5E8] text-sm">Today's schedule</p>
          </div>
        </div>
      </div>
      <div className="flex-1 px-5 pt-5 overflow-y-auto flex flex-col gap-3 pb-6">
        {REMINDERS.map((r, i) => (
          <div key={i} className={`bg-white rounded-3xl px-5 py-4 shadow-sm border-2 flex items-center gap-4 transition-all ${done[i] ? "opacity-60 border-gray-100" : "border-[#FEF3C7]"}`}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{background: done[i] ? "#F5F5F5" : r.color + "22"}}>
              <span className="text-2xl">{r.icon}</span>
            </div>
            <div className="flex-1">
              <p className={`font-bold text-base ${done[i] ? "line-through text-[#667066]" : "text-[#182019]"}`}>{r.label}</p>
              <p className="text-[#4F5A50] text-sm">{r.time}</p>
            </div>
            <button
              onClick={async () => {
  const newDone = done.map((v, j) => (j === i ? !v : v));
  setDone(newDone);
  const user = auth.currentUser;
  if (!user) return;
  try {
   await setDoc(
  doc(db, "patients", user.uid, "reminders", "today"),
  {
    reminders: REMINDERS.map((reminder, index) => ({
      ...reminder,
      isCompleted: Boolean(newDone[index]),
    })),
    done: newDone,
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

console.log("REMINDERS SAVED SUCCESSFULLY");
  } catch (error) {
    console.error("Failed to save reminder state:", error);
  }
}}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${done[i] ? "bg-[#2F7D32] border-[#2F7D32]" : "border-gray-200 bg-white"}`}
            >
              {done[i] && <span className="text-white text-lg">✓</span>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Voice Assistant ──────────────────────────────────────────────────────────
function VoiceAssistant({ onBack }: { onBack: () => void }) {
const [listening, setListening] = useState(false);
const [response, setResponse] = useState<string | null>(null);
const [transcript, setTranscript] = useState("");
const [thinking, setThinking] = useState(false);
const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};

const getWeather = async (city: string) => {
  const cached = getCachedWeather(city);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { signal: controller.signal }
    );

    const geoData = await geoResponse.json();

    if (!geoData.results?.length) {
      return `I couldn't find weather information for ${city}.`;
    }

    const location = geoData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`,
      { signal: controller.signal }
    );

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    const weatherSummary = `The current weather in ${location.name} is ${current.temperature_2m}°C. It feels like ${current.apparent_temperature}°C, with ${current.relative_humidity_2m}% humidity and wind speed of ${current.wind_speed_10m} km/h.`;
    setCachedWeather(city, weatherSummary);
    return weatherSummary;
  } catch {
    return `Unable to fetch current weather for ${city}. Please try again later.`;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const startVoice = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setResponse("Voice recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    setListening(true);
    setResponse(null);
    setTranscript("");
  };

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;

    setTranscript(text);
    setListening(false);

    setResponse("Your voice was heard. AI assistance will be connected later.");
  };

  recognition.onerror = (event: any) => {
    console.error("Speech error:", event.error);
    setListening(false);
    setResponse("I couldn't hear you. Please try again.");
  };

  recognition.onend = () => {
    setListening(false);
  };

  recognition.start();
};

const toggleListen = () => {
  if (listening) return;
  startVoice();
};

  const suggestions = ["What time is it?", "What's next?", "Call Priya", "What day is it?"];

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="bg-gradient-to-br from-[#2E7D73] to-[#1A5C54] px-5 pt-2 pb-5 rounded-b-[32px]">
        <div className="flex items-center gap-3">
          <BackButton onBack={onBack} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Voice Helper</h2>
            <p className="text-[#D9F4F1] text-sm">Ask me anything, Ravi!</p>
          </div>
        </div>
      </div>
      <div className="flex-1 px-5 pt-8 flex flex-col items-center gap-6 overflow-y-auto pb-6">
        <div className="relative flex items-center justify-center mt-4">
          {listening && <div className="absolute w-40 h-40 rounded-full bg-[#2E7D73]/20 animate-ping" />}
          {listening && <div className="absolute w-52 h-52 rounded-full bg-[#2E7D73]/10 animate-ping" style={{animationDelay:"0.3s"}} />}
          <button
            onClick={toggleListen}
            className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all z-10 ${listening ? "bg-[#E53935] scale-110" : "bg-[#2E7D73]"}`}
          >
            <span className="text-6xl">{listening ? "🔴" : "🎤"}</span>
          </button>
        </div>
        <p className="text-[#37474F] text-xl font-bold text-center">
          {listening ? "Listening... speak now!" : "Tap to speak"}
        </p>
        {response && (
          <div className="w-full bg-[#D9F4F1] border border-[#2E7D73]/20 rounded-3xl p-5 animate-fade-in">
            <p className="text-[#78909C] text-xs font-semibold mb-2">MemoryNest says:</p>
            <p className="text-[#37474F] text-lg font-medium leading-relaxed">"{response}"</p>
          </div>
        )}
        {response && (
  <button
    type="button"
    onClick={stopSpeaking}
    className="w-full rounded-2xl bg-[#E53935] px-5 py-3 text-white font-bold shadow-sm"
  >
    🔇 Stop Speaking
  </button>
)}
        <div className="w-full">
          <p className="text-[#4F5A50] text-sm font-semibold mb-3">Try asking:</p>
          <div className="flex flex-col gap-2">
            {suggestions.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => {
                  setTranscript(s);
                  setResponse("AI assistance will be connected later.");
                }}
                className="bg-white rounded-2xl px-5 py-4 text-[#182019] font-semibold text-base text-left shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
              >
                💬 {s}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="w-full py-5 bg-[#E53935] text-white text-xl font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-3 cursor-pointer active:scale-95 transition-transform"
        >
          <span className="text-2xl">🆘</span> Emergency SOS
        </button>
      </div>
    </div>
  );
}

// ─── Patient Profile ──────────────────────────────────────────────────────────
function PatientProfile({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [voiceReminders, setVoiceReminders] = useState(false);

  const Toggle = ({
    value,
    onChange,
    label,
  }: {
    value: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={`Toggle ${label}`}
      onClick={onChange}
      className="min-w-[44px] min-h-[44px] p-1 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
    >
      <div
        className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
          value ? "bg-[#2F7D32]" : "bg-slate-300"
        }`}
      >
        <div
          className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            value ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-[#FFFDF1] overflow-y-auto">
      <StatusBar />

      {/* Profile Header */}
      <div className="ms-patient-header ms-patient-header--profile px-5 pt-3 pb-5 rounded-b-[28px] shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton onBack={onBack} light />
          <h2 className="text-white text-[21px] font-bold tracking-tight leading-none">
            My Profile
          </h2>
        </div>

        <div className="flex flex-col items-center mt-3">
          <div className="w-16 h-16 rounded-full bg-white/20 border border-white/35 flex items-center justify-center shadow-sm">
            <span className="text-3xl">👴</span>
          </div>

          <h3 className="text-white text-[26px] font-bold mt-2 tracking-tight leading-tight">
            Ravi Kumar
          </h3>

          <p className="text-[#EAF5E8]/90 text-[15px] font-medium mt-0.5">
            Age 72
          </p>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3.5 pb-6">

        {/* Settings */}
        <div className="ms-glass rounded-2xl p-4 shadow-sm border border-slate-200/70">
          <h4 className="text-[#182019] text-[19px] font-semibold mb-1.5 flex items-center gap-2">
            <span>⚙️</span>
            <span>Settings</span>
          </h4>

          <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
            <span className="text-[#182019] text-[15px] font-medium leading-relaxed">
              Notifications
            </span>
            <Toggle
              label="Notifications"
              value={notifications}
              onChange={() => setNotifications(v => !v)}
            />
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[#182019] text-[15px] font-medium leading-relaxed">
              Voice Reminders
            </span>
            <Toggle
              label="Voice Reminders"
              value={voiceReminders}
              onChange={() => setVoiceReminders(v => !v)}
            />
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={async () => {
            await signOut(auth);
            window.location.reload();
          }}
          className="w-full min-h-[48px] py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[15px] font-bold rounded-2xl hover:bg-rose-100 transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>

        <p className="text-center text-[#667066] text-[13px] font-medium tracking-wide mt-0.5">
          MindSathi
        </p>

      </div>
    </div>
  );
}

// ─── Picture Recall ──────────────────────────────────────────────────────────
const PR_QUESTIONS = [
  { q: "Was there a bird in the picture?",    type: "yesno" as const, answer: "YES" },
  { q: "Was there a bench in the picture?",   type: "yesno" as const, answer: "YES" },
  { q: "Was there a watering can?",           type: "yesno" as const, answer: "YES" },
  { q: "What color was the ball?",            type: "choice" as const, answer: "Red",   choices: ["Red","Blue","Yellow","Green"] },
  { q: "Was there a flower?",                 type: "yesno" as const, answer: "YES" },
];

function GardenIllustration() {
  return (
    <svg viewBox="0 0 320 240" className="w-full" aria-label="Garden scene with a tree, flower, bench, bird, watering can, and red ball">
      {/* Sky */}
      <rect width="320" height="240" rx="20" fill="#E8F5E9" />
      {/* Sun */}
      <circle cx="270" cy="40" r="22" fill="#FDD835" opacity="0.9" />
      <circle cx="270" cy="40" r="16" fill="#FFEE58" />
      {/* Ground */}
      <ellipse cx="160" cy="220" rx="155" ry="28" fill="#A5D6A7" />
      <rect x="5" y="208" width="310" height="32" rx="0" fill="#A5D6A7" />

      {/* Tree trunk */}
      <rect x="60" y="130" width="18" height="70" rx="6" fill="#8D6E63" />
      {/* Tree canopy */}
      <ellipse cx="69" cy="110" rx="38" ry="42" fill="#43A047" />
      <ellipse cx="69" cy="100" rx="30" ry="34" fill="#66BB6A" />
      <ellipse cx="55" cy="118" rx="22" ry="20" fill="#388E3C" />
      <ellipse cx="83" cy="112" rx="20" ry="18" fill="#388E3C" />

      {/* Bench */}
      {/* legs */}
      <rect x="168" y="178" width="8" height="30" rx="3" fill="#795548" />
      <rect x="208" y="178" width="8" height="30" rx="3" fill="#795548" />
      {/* seat */}
      <rect x="160" y="170" width="64" height="12" rx="4" fill="#A1887F" />
      {/* back slats */}
      <rect x="162" y="148" width="60" height="8" rx="3" fill="#A1887F" />
      <rect x="162" y="158" width="60" height="8" rx="3" fill="#A1887F" />
      {/* back supports */}
      <rect x="165" y="148" width="7" height="28" rx="3" fill="#795548" />
      <rect x="211" y="148" width="7" height="28" rx="3" fill="#795548" />

      {/* Flower — stem + leaves + bloom */}
      <rect x="128" y="170" width="5" height="36" rx="2" fill="#388E3C" />
      <ellipse cx="122" cy="182" rx="9" ry="5" fill="#66BB6A" transform="rotate(-30 122 182)" />
      <ellipse cx="141" cy="178" rx="9" ry="5" fill="#66BB6A" transform="rotate(25 141 178)" />
      {/* petals */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <ellipse key={i}
          cx={130 + 10 * Math.cos((deg * Math.PI) / 180)}
          cy={162 + 10 * Math.sin((deg * Math.PI) / 180)}
          rx="6" ry="4"
          fill="#F06292"
          transform={`rotate(${deg} ${130 + 10 * Math.cos((deg * Math.PI) / 180)} ${162 + 10 * Math.sin((deg * Math.PI) / 180)})`}
        />
      ))}
      <circle cx="130" cy="162" r="7" fill="#FDD835" />

      {/* Watering can */}
      <rect x="248" y="178" width="36" height="26" rx="6" fill="#42A5F5" />
      {/* spout */}
      <rect x="282" y="183" width="22" height="5" rx="2" fill="#1E88E5" transform="rotate(-15 282 183)" />
      <rect x="298" y="175" width="8" height="8" rx="2" fill="#1565C0" />
      {/* handle */}
      <path d="M248 185 Q238 175 248 168" stroke="#1565C0" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Red ball */}
      <circle cx="240" cy="212" r="14" fill="#EF5350" />
      <ellipse cx="237" cy="206" rx="5" ry="3" fill="#EF9A9A" opacity="0.7" />

      {/* Bird */}
      <ellipse cx="105" cy="82" rx="12" ry="8" fill="#FFA726" />
      <ellipse cx="115" cy="80" rx="7" ry="5" fill="#FFB74D" />
      <polygon points="122,80 128,78 122,82" fill="#FF7043" />
      <circle cx="117" cy="78" r="1.8" fill="#37474F" />
      {/* wings */}
      <path d="M98 82 Q90 72 100 76" fill="#FB8C00" />
      <path d="M112 82 Q118 70 108 78" fill="#FB8C00" />
    </svg>
  );
}

function PictureRecall({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro"|"remember"|"recall"|"result">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const resultSaved = useRef(false);
  useEffect(() => {
  if (phase !== "result" || resultSaved.current) return;

  const user = auth.currentUser;

  if (!user) {
    console.error("No authenticated patient found.");
    return;
  }

  resultSaved.current = true;

  addDoc(
    collection(db, "patients", user.uid, "gameResults"),
    {
      gameName: "Picture Recall",
      score,
      starsEarned: score === 5 ? 20 : score >= 3 ? 10 : 5,
      completedAt: serverTimestamp(),
    }
  ).catch((error) => {
    console.error("Failed to save Picture Recall result:", error);
    resultSaved.current = false;
  });
}, [phase, score]);
  const [selected, setSelected] = useState<string|null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timerPct, setTimerPct] = useState(100);

  // 10-second countdown on remember screen
  const startTimer = () => {
    let pct = 100;
    const interval = setInterval(() => {
      pct -= 10;
      setTimerPct(pct);
      if (pct <= 0) clearInterval(interval);
    }, 1000);
  };

  const handleReady = () => setPhase("recall");

  const handleAnswer = (ans: string) => {
    if (showFeedback) return;
    setSelected(ans);
    setShowFeedback(true);
    const correct = ans === PR_QUESTIONS[qIndex].answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setShowFeedback(false);
      setSelected(null);
      if (qIndex < PR_QUESTIONS.length - 1) {
        setQIndex(i => i + 1);
      } else {
        setPhase("result");
      }
    }, 900);
  };

  const restart = () => {
    resultSaved.current = false;
    setPhase("intro");
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setShowFeedback(false);
    setTimerPct(100);
  };

  const q = PR_QUESTIONS[qIndex];

  // ── Intro ──
  if (phase === "intro") return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="bg-gradient-to-br from-[#F57C00] to-[#E65100] px-5 pt-2 pb-5 rounded-b-[32px]">
        <div className="flex items-center gap-3">
          <BackButton onBack={onBack} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Picture Recall</h2>
            <p className="text-orange-100 text-sm">Look, remember, and recall</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-7 animate-fade-in">
        <div className="w-full bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <GardenIllustration />
        </div>
        <div className="text-center">
          <p className="text-[#37474F] text-xl font-bold leading-snug">Look carefully and</p>
          <p className="text-[#37474F] text-xl font-bold leading-snug">remember the picture.</p>
          <p className="text-[#78909C] text-base mt-2">You will be asked questions about it.</p>
        </div>
        <button
          onClick={() => { setPhase("remember"); startTimer(); }}
          className="w-full py-5 bg-gradient-to-r from-[#F57C00] to-[#E65100] text-white text-xl font-extrabold rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          Start Game 🎯
        </button>
      </div>
    </div>
  );

  // ── Remember ──
  if (phase === "remember") return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="bg-gradient-to-br from-[#F57C00] to-[#E65100] px-5 pt-2 pb-5 rounded-b-[32px]">
        <div className="flex items-center gap-3 mb-3">
          <BackButton onBack={onBack} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Picture Recall</h2>
            <p className="text-orange-100 text-sm">Remember time</p>
          </div>
        </div>
        <div className="bg-white/25 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-white transition-all duration-1000"
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <p className="text-orange-100 text-xs mt-1.5 text-center">Take your time — no rush!</p>
      </div>
      <div className="flex-1 flex flex-col px-5 pt-5 gap-5 animate-fade-in overflow-y-auto pb-6">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <GardenIllustration />
        </div>
        <div className="bg-[#FFF3E0] border border-[#F57C00]/20 rounded-3xl px-5 py-4 text-center">
          <p className="text-[#37474F] text-lg font-bold leading-snug">Look carefully and remember</p>
          <p className="text-[#37474F] text-lg font-bold leading-snug">what you see.</p>
        </div>
        <button
          onClick={handleReady}
          className="w-full py-5 bg-gradient-to-r from-[#F57C00] to-[#E65100] text-white text-xl font-extrabold rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          I'm Ready ✅
        </button>
      </div>
    </div>
  );

  // ── Recall ──
  if (phase === "recall") return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="bg-gradient-to-br from-[#F57C00] to-[#E65100] px-5 pt-2 pb-5 rounded-b-[32px]">
        <div className="flex items-center gap-3 mb-3">
          <BackButton onBack={() => { restart(); onBack(); }} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Picture Recall</h2>
            <p className="text-orange-100 text-sm">Question {qIndex + 1} of {PR_QUESTIONS.length}</p>
          </div>
        </div>
        <div className="bg-white/25 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full bg-white transition-all duration-300"
            style={{ width: `${((qIndex) / PR_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col px-5 pt-6 gap-5 animate-fade-in">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl mb-1">🖼️</span>
          <p className="text-[#37474F] text-2xl font-extrabold text-center leading-snug">{q.q}</p>
        </div>
        <div className={`flex ${q.type === "choice" ? "flex-col" : "flex-row"} gap-3 pb-6`}>
          {q.type === "yesno" ? (
            <>
              {["YES","NO"].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className={`flex-1 py-6 rounded-2xl text-2xl font-extrabold transition-all border-2 ${
                    showFeedback && opt === q.answer
                      ? "bg-[#E8F5E9] border-[#43A047] text-[#43A047]"
                      : showFeedback && opt === selected && opt !== q.answer
                      ? "bg-[#FFEBEE] border-[#E53935] text-[#E53935]"
                      : opt === "YES"
                      ? "bg-[#E8F5E9] border-[#43A047]/30 text-[#43A047] active:scale-95"
                      : "bg-[#FFEBEE] border-[#E53935]/30 text-[#E53935] active:scale-95"
                  }`}
                >
                  {showFeedback && opt === q.answer ? "✅ " : showFeedback && opt === selected ? "❌ " : ""}
                  {opt === "YES" ? "👍 YES" : "👎 NO"}
                </button>
              ))}
            </>
          ) : (
            (q as typeof PR_QUESTIONS[3]).choices!.map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={`w-full py-5 rounded-2xl text-xl font-extrabold transition-all border-2 text-left px-6 ${
                  showFeedback && opt === q.answer
                    ? "bg-[#E8F5E9] border-[#43A047] text-[#43A047]"
                    : showFeedback && opt === selected && opt !== q.answer
                    ? "bg-[#FFEBEE] border-[#E53935] text-[#E53935]"
                    : "bg-white border-gray-100 text-[#37474F] active:scale-95"
                }`}
              >
                {showFeedback && opt === q.answer ? "✅ " : showFeedback && opt === selected ? "❌ " : ""}{opt}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ── Result ──
  return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 animate-fade-in">
        <div className="text-8xl animate-bounce-gentle">🌟</div>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#37474F]">Well Done!</h2>
          <div className="mt-4 bg-white rounded-3xl px-8 py-5 shadow-sm border border-gray-100 inline-block">
            <p className="text-6xl font-extrabold text-[#F57C00]">{score} / {PR_QUESTIONS.length}</p>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {PR_QUESTIONS.map((_, i) => (
              <span key={i} className={`text-3xl ${i < score ? "text-[#F59E0B]" : "text-gray-200"}`}>⭐</span>
            ))}
          </div>
          <p className="text-[#78909C] text-lg mt-4 leading-snug">
            {score >= 4 ? "Great job! Keep practicing your memory." : score >= 2 ? "Good effort! Try once more!" : "Let's try again — you can do it!"}
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={restart}
            className="w-full py-5 bg-gradient-to-r from-[#F57C00] to-[#E65100] text-white text-xl font-extrabold rounded-2xl shadow-md active:scale-95 transition-transform"
          >
            🔄 Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full py-5 bg-white border-2 border-gray-100 text-[#37474F] text-xl font-bold rounded-2xl shadow-sm active:scale-95 transition-transform"
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Familiar Place ───────────────────────────────────────────────────────────
const FP_ROUNDS: Array<{ place: string; options: string[] }> = [
  { place: "Living Room", options: ["Living Room","Bedroom","Kitchen","Bathroom"] },
  { place: "Kitchen",     options: ["Bedroom","Garden","Kitchen","Living Room"]   },
  { place: "Bedroom",     options: ["Kitchen","Bathroom","Bedroom","Garden"]      },
  { place: "Garden",      options: ["Garden","Living Room","Kitchen","Bedroom"]   },
  { place: "Bathroom",    options: ["Kitchen","Bedroom","Bathroom","Living Room"] },
];

function IllustrationLivingRoom() {
  return (
    <svg viewBox="0 0 320 210" className="w-full" aria-label="Living room">
      <rect width="320" height="210" rx="16" fill="#FFF8F0" />
      <rect x="0" y="0" width="320" height="136" fill="#FDEBD0" />
      <rect x="0" y="134" width="320" height="76" fill="#F0D9B5" />
      <rect x="0" y="133" width="320" height="3" fill="#D7B896" />
      {/* Window */}
      <rect x="14" y="18" width="68" height="80" rx="5" fill="#AED6F1" />
      <rect x="14" y="18" width="68" height="80" rx="5" fill="none" stroke="#7FB3D3" strokeWidth="3.5" />
      <rect x="47" y="18" width="3" height="80" fill="#7FB3D3" />
      <rect x="14" y="57" width="68" height="3" fill="#7FB3D3" />
      <path d="M10 14 Q20 54 14 98" stroke="#E8A87C" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M86 14 Q76 54 82 98" stroke="#E8A87C" strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* Wall clock */}
      <circle cx="164" cy="46" r="24" fill="white" stroke="#B0BEC5" strokeWidth="3" />
      <circle cx="164" cy="46" r="20" fill="#FAFAFA" />
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const r1 = i % 3 === 0 ? 14 : 17; const r2 = 18;
        const rad = (deg - 90) * Math.PI / 180;
        return <line key={i} x1={164+r1*Math.cos(rad)} y1={46+r1*Math.sin(rad)} x2={164+r2*Math.cos(rad)} y2={46+r2*Math.sin(rad)} stroke="#78909C" strokeWidth={i%3===0?2:1} />;
      })}
      <line x1="164" y1="46" x2="164" y2="32" stroke="#37474F" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="164" y1="46" x2="175" y2="48" stroke="#37474F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="164" cy="46" r="2.5" fill="#37474F" />
      {/* TV */}
      <rect x="214" y="18" width="90" height="58" rx="6" fill="#37474F" />
      <rect x="218" y="22" width="82" height="46" rx="4" fill="#1565C0" />
      <rect x="220" y="24" width="22" height="9" rx="3" fill="white" opacity="0.12" />
      <rect x="250" y="76" width="22" height="5" rx="2" fill="#546E7A" />
      <rect x="244" y="81" width="34" height="4" rx="2" fill="#455A64" />
      {/* Floor lamp */}
      <polygon points="288,32 302,32 296,62" fill="#F9E4B7" stroke="#D4A843" strokeWidth="1.5" />
      <rect x="294" y="62" width="4" height="44" rx="2" fill="#A1887F" />
      <ellipse cx="296" cy="108" rx="11" ry="4" fill="#8D6E63" />
      {/* Blue sofa */}
      <rect x="24" y="130" width="200" height="46" rx="13" fill="#5B7FBF" />
      <rect x="28" y="154" width="192" height="28" rx="9" fill="#4A6FA5" />
      <rect x="34" y="136" width="84" height="42" rx="9" fill="#6B91CC" />
      <rect x="128" y="136" width="84" height="42" rx="9" fill="#6B91CC" />
      <rect x="32" y="182" width="11" height="14" rx="3" fill="#37474F" />
      <rect x="202" y="182" width="11" height="14" rx="3" fill="#37474F" />
      <rect x="18" y="146" width="20" height="34" rx="7" fill="#5B7FBF" />
      <rect x="206" y="146" width="20" height="34" rx="7" fill="#5B7FBF" />
      {/* Side table + vase */}
      <rect x="244" y="150" width="64" height="9" rx="4" fill="#A1887F" />
      <rect x="250" y="159" width="7" height="28" rx="3" fill="#8D6E63" />
      <rect x="293" y="159" width="7" height="28" rx="3" fill="#8D6E63" />
      <rect x="264" y="126" width="14" height="26" rx="5" fill="#42A5F5" />
      <ellipse cx="271" cy="126" rx="9" ry="3.5" fill="#1E88E5" />
      <circle cx="266" cy="118" r="6" fill="#EF5350" /><circle cx="271" cy="114" r="6" fill="#FFA726" /><circle cx="276" cy="118" r="6" fill="#AB47BC" />
      <circle cx="266" cy="118" r="3.5" fill="#FDD835" /><circle cx="271" cy="114" r="3.5" fill="#FDD835" /><circle cx="276" cy="118" r="3.5" fill="#FDD835" />
      <line x1="266" y1="122" x2="268" y2="130" stroke="#388E3C" strokeWidth="2" />
      <line x1="271" y1="119" x2="271" y2="130" stroke="#388E3C" strokeWidth="2" />
      <line x1="276" y1="122" x2="274" y2="130" stroke="#388E3C" strokeWidth="2" />
    </svg>
  );
}

function IllustrationKitchen() {
  return (
    <svg viewBox="0 0 320 210" className="w-full" aria-label="Kitchen">
      <rect width="320" height="210" rx="16" fill="#FFFDE7" />
      {/* Wall */}
      <rect x="0" y="0" width="320" height="130" fill="#FFF9C4" />
      {/* Tile pattern on backsplash */}
      {[0,1,2,3,4,5,6,7].map(c => [0,1,2,3].map(r => (
        <rect key={`${c}-${r}`} x={c*40} y={r*26} width="38" height="24" rx="1" fill="none" stroke="#F9A825" strokeWidth="0.8" opacity="0.4" />
      )))}
      {/* Counter */}
      <rect x="0" y="128" width="320" height="14" rx="0" fill="#8D6E63" />
      <rect x="0" y="140" width="320" height="70" fill="#795548" />
      {/* Cabinet doors below counter */}
      <rect x="6" y="146" width="92" height="56" rx="5" fill="#8D6E63" /><rect x="10" y="150" width="84" height="48" rx="3" fill="#9E7B6A" />
      <circle cx="52" cy="174" r="5" fill="#D7CCC8" />
      <rect x="108" y="146" width="92" height="56" rx="5" fill="#8D6E63" /><rect x="112" y="150" width="84" height="48" rx="3" fill="#9E7B6A" />
      <circle cx="154" cy="174" r="5" fill="#D7CCC8" />
      <rect x="210" y="146" width="104" height="56" rx="5" fill="#8D6E63" /><rect x="214" y="150" width="96" height="48" rx="3" fill="#9E7B6A" />
      <circle cx="262" cy="174" r="5" fill="#D7CCC8" />
      {/* Upper cabinets */}
      <rect x="0" y="8" width="80" height="64" rx="5" fill="#A1887F" />
      <rect x="4" y="12" width="72" height="56" rx="3" fill="#BCAAA4" />
      <circle cx="40" cy="40" r="4" fill="#D7CCC8" />
      <rect x="90" y="8" width="80" height="64" rx="5" fill="#A1887F" />
      <rect x="94" y="12" width="72" height="56" rx="3" fill="#BCAAA4" />
      <circle cx="130" cy="40" r="4" fill="#D7CCC8" />
      {/* Sink */}
      <rect x="185" y="100" width="90" height="32" rx="6" fill="#90A4AE" />
      <rect x="190" y="105" width="80" height="22" rx="4" fill="#78909C" />
      {/* faucet */}
      <rect x="226" y="82" width="6" height="22" rx="3" fill="#B0BEC5" />
      <rect x="218" y="80" width="22" height="6" rx="3" fill="#B0BEC5" />
      <circle cx="240" cy="83" r="4" fill="#90A4AE" />
      {/* Stove / hob */}
      <rect x="14" y="100" width="150" height="32" rx="6" fill="#546E7A" />
      {/* burners */}
      <circle cx="44" cy="116" r="12" fill="#37474F" /><circle cx="44" cy="116" r="8" fill="#455A64" /><circle cx="44" cy="116" r="4" fill="#546E7A" />
      <circle cx="90" cy="116" r="12" fill="#37474F" /><circle cx="90" cy="116" r="8" fill="#455A64" /><circle cx="90" cy="116" r="4" fill="#546E7A" />
      <circle cx="136" cy="116" r="10" fill="#37474F" /><circle cx="136" cy="116" r="6" fill="#455A64" /><circle cx="136" cy="116" r="3" fill="#546E7A" />
      {/* Window above sink */}
      <rect x="195" y="14" width="68" height="62" rx="5" fill="#AED6F1" />
      <rect x="195" y="14" width="68" height="62" rx="5" fill="none" stroke="#7FB3D3" strokeWidth="3" />
      <rect x="228" y="14" width="3" height="62" fill="#7FB3D3" />
      <rect x="195" y="44" width="68" height="3" fill="#7FB3D3" />
    </svg>
  );
}

function IllustrationBedroom() {
  return (
    <svg viewBox="0 0 320 210" className="w-full" aria-label="Bedroom">
      <rect width="320" height="210" rx="16" fill="#F3E5F5" />
      {/* Wall */}
      <rect x="0" y="0" width="320" height="130" fill="#EDE7F6" />
      {/* Floor */}
      <rect x="0" y="128" width="320" height="82" fill="#D7CCC8" />
      <rect x="0" y="126" width="320" height="4" fill="#BCAAA4" />
      {/* Window with curtains */}
      <rect x="100" y="14" width="72" height="82" rx="5" fill="#B3E5FC" />
      <rect x="100" y="14" width="72" height="82" rx="5" fill="none" stroke="#81D4FA" strokeWidth="3" />
      <rect x="134" y="14" width="3" height="82" fill="#81D4FA" />
      <rect x="100" y="54" width="72" height="3" fill="#81D4FA" />
      <path d="M95 10 Q108 52 100 96" stroke="#CE93D8" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M177 10 Q164 52 172 96" stroke="#CE93D8" strokeWidth="11" fill="none" strokeLinecap="round" />
      {/* Wardrobe */}
      <rect x="240" y="18" width="72" height="112" rx="6" fill="#A1887F" />
      <rect x="244" y="22" width="30" height="104" rx="3" fill="#BCAAA4" />
      <rect x="278" y="22" width="30" height="104" rx="3" fill="#BCAAA4" />
      <circle cx="261" cy="74" r="4" fill="#8D6E63" />
      <circle cx="295" cy="74" r="4" fill="#8D6E63" />
      <rect x="241" y="64" width="74" height="2" fill="#8D6E63" opacity="0.5" />
      {/* Bed frame */}
      <rect x="8" y="124" width="220" height="82" rx="10" fill="#CE93D8" />
      {/* Headboard */}
      <rect x="8" y="108" width="220" height="30" rx="10" fill="#BA68C8" />
      {/* Mattress */}
      <rect x="16" y="130" width="204" height="70" rx="7" fill="#F8BBD0" />
      {/* Blanket / duvet */}
      <rect x="16" y="158" width="204" height="44" rx="7" fill="#CE93D8" />
      {/* Blanket stripes */}
      <rect x="16" y="168" width="204" height="6" rx="0" fill="#BA68C8" opacity="0.5" />
      <rect x="16" y="182" width="204" height="6" rx="0" fill="#BA68C8" opacity="0.5" />
      {/* Pillows */}
      <rect x="24" y="130" width="80" height="34" rx="8" fill="white" />
      <rect x="116" y="130" width="80" height="34" rx="8" fill="white" />
      {/* Bedside table */}
      <rect x="8" y="172" width="0" height="0" />
      {/* Nightstand right of bed */}
      <rect x="236" y="158" width="54" height="44" rx="6" fill="#8D6E63" />
      <rect x="240" y="168" width="46" height="28" rx="4" fill="#A1887F" />
      <circle cx="263" cy="182" r="3.5" fill="#D7CCC8" />
      {/* Lamp on nightstand */}
      <rect x="258" y="138" width="4" height="22" rx="2" fill="#A1887F" />
      <ellipse cx="260" cy="136" rx="18" ry="10" fill="#FFF9C4" stroke="#F9A825" strokeWidth="1.5" />
      <ellipse cx="260" cy="158" rx="10" ry="3" fill="#8D6E63" />
    </svg>
  );
}

function IllustrationGarden() {
  return (
    <svg viewBox="0 0 320 210" className="w-full" aria-label="Garden">
      {/* Sky */}
      <rect width="320" height="210" rx="16" fill="#E1F5FE" />
      <rect x="0" y="0" width="320" height="130" fill="#B3E5FC" />
      {/* Sun */}
      <circle cx="268" cy="38" r="26" fill="#FDD835" opacity="0.9" />
      <circle cx="268" cy="38" r="20" fill="#FFEE58" />
      {/* Clouds */}
      <ellipse cx="60" cy="28" rx="32" ry="16" fill="white" opacity="0.9" />
      <ellipse cx="80" cy="24" rx="24" ry="14" fill="white" opacity="0.9" />
      <ellipse cx="40" cy="30" rx="20" ry="12" fill="white" opacity="0.85" />
      <ellipse cx="180" cy="42" rx="28" ry="14" fill="white" opacity="0.8" />
      <ellipse cx="200" cy="38" rx="20" ry="12" fill="white" opacity="0.8" />
      {/* Fence */}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={i} x={i*34+6} y={88} width="12" height="36" rx="2" fill="#BCAAA4" />
      ))}
      <rect x="4" y="96" width="314" height="6" rx="2" fill="#A1887F" />
      <rect x="4" y="108" width="314" height="6" rx="2" fill="#A1887F" />
      {/* Grass */}
      <rect x="0" y="124" width="320" height="86" rx="0" fill="#66BB6A" />
      <rect x="0" y="122" width="320" height="8" fill="#43A047" />
      {/* Wavy grass top */}
      <ellipse cx="40" cy="124" rx="40" ry="8" fill="#43A047" />
      <ellipse cx="120" cy="122" rx="40" ry="7" fill="#388E3C" />
      <ellipse cx="200" cy="124" rx="38" ry="8" fill="#43A047" />
      <ellipse cx="280" cy="122" rx="40" ry="7" fill="#388E3C" />
      {/* Path */}
      <ellipse cx="160" cy="190" rx="30" ry="12" fill="#D7CCC8" />
      {[0,1,2,3,4].map(i => (
        <ellipse key={i} cx={160} cy={128+i*14} rx={16-i*1.5} ry={5} fill="#BCAAA4" opacity="0.7" />
      ))}
      {/* Left tree */}
      <rect x="46" y="80" width="16" height="56" rx="5" fill="#6D4C41" />
      <ellipse cx="54" cy="70" rx="34" ry="38" fill="#43A047" />
      <ellipse cx="54" cy="58" rx="26" ry="30" fill="#66BB6A" />
      <ellipse cx="40" cy="76" rx="20" ry="18" fill="#388E3C" />
      <ellipse cx="68" cy="72" rx="18" ry="16" fill="#388E3C" />
      {/* Right tree */}
      <rect x="248" y="82" width="14" height="54" rx="5" fill="#6D4C41" />
      <ellipse cx="255" cy="72" rx="30" ry="34" fill="#43A047" />
      <ellipse cx="255" cy="62" rx="22" ry="26" fill="#66BB6A" />
      {/* Flower bed */}
      <rect x="100" y="128" width="120" height="18" rx="6" fill="#388E3C" />
      {[["#EF5350",108],["#FFA726",122],["#EC407A",136],["#AB47BC",150],["#FDD835",164],["#42A5F5",178],["#EF5350",192]].map(([c,x], i) => (
        <g key={i}>
          <rect x={+x} y={116} width="4" height="14" rx="1" fill="#388E3C" />
          <circle cx={+x+2} cy={112} r="8" fill={c as string} />
          <circle cx={+x+2} cy={112} r="4" fill="#FDD835" />
        </g>
      ))}
      {/* Bench */}
      <rect x="190" y="148" width="80" height="10" rx="4" fill="#8D6E63" />
      <rect x="190" y="136" width="80" height="8" rx="3" fill="#A1887F" />
      <rect x="190" y="144" width="80" height="5" rx="2" fill="#A1887F" />
      <rect x="196" y="158" width="8" height="18" rx="3" fill="#6D4C41" />
      <rect x="258" y="158" width="8" height="18" rx="3" fill="#6D4C41" />
      <rect x="192" y="136" width="6" height="20" rx="2" fill="#6D4C41" />
      <rect x="260" y="136" width="6" height="20" rx="2" fill="#6D4C41" />
    </svg>
  );
}

function IllustrationBathroom() {
  return (
    <svg viewBox="0 0 320 210" className="w-full" aria-label="Bathroom">
      <rect width="320" height="210" rx="16" fill="#E0F7FA" />
      {/* Wall tiles */}
      <rect x="0" y="0" width="320" height="140" fill="#E0F7FA" />
      {[0,1,2,3,4,5,6,7].map(c => [0,1,2,3,4].map(r => (
        <rect key={`${c}-${r}`} x={c*40} y={r*28} width="38" height="26" rx="1" fill="none" stroke="#80DEEA" strokeWidth="1" />
      )))}
      {/* Floor */}
      <rect x="0" y="138" width="320" height="72" fill="#B2EBF2" />
      <rect x="0" y="136" width="320" height="4" fill="#80DEEA" />
      {[0,1,2,3,4,5,6,7].map(c => [0,1].map(r => (
        <rect key={`${c}-${r}`} x={c*40} y={140+r*36} width="38" height="34" rx="1" fill="none" stroke="#80DEEA" strokeWidth="0.8" />
      )))}
      {/* Bathtub */}
      <rect x="10" y="130" width="140" height="68" rx="10" fill="#B2EBF2" stroke="#80DEEA" strokeWidth="2" />
      <rect x="18" y="138" width="124" height="52" rx="7" fill="#E0F7FA" />
      {/* tub faucet */}
      <rect x="66" y="122" width="8" height="18" rx="3" fill="#B0BEC5" />
      <rect x="56" y="120" width="28" height="6" rx="3" fill="#B0BEC5" />
      <circle cx="84" cy="123" r="4" fill="#90A4AE" />
      <circle cx="56" cy="123" r="4" fill="#90A4AE" />
      {/* tub drain */}
      <circle cx="80" cy="178" r="6" fill="#80DEEA" />
      <circle cx="80" cy="178" r="3" fill="#4DD0E1" />
      {/* Towel rail + towel */}
      <rect x="162" y="108" width="6" height="50" rx="3" fill="#B0BEC5" />
      <rect x="158" y="104" width="14" height="5" rx="2" fill="#90A4AE" />
      <rect x="158" y="156" width="14" height="5" rx="2" fill="#90A4AE" />
      <rect x="166" y="112" width="20" height="40" rx="4" fill="#4FC3F7" />
      {/* Toilet */}
      <ellipse cx="248" cy="182" rx="42" ry="22" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="2" />
      <ellipse cx="248" cy="176" rx="36" ry="18" fill="#B2EBF2" />
      <rect x="214" y="150" width="68" height="28" rx="7" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="2" />
      <rect x="218" y="138" width="60" height="16" rx="5" fill="#B2EBF2" stroke="#80DEEA" strokeWidth="1.5" />
      <circle cx="248" cy="144" r="3" fill="#80DEEA" />
      {/* Sink with mirror */}
      <rect x="192" y="90" width="56" height="40" rx="6" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="2" />
      <ellipse cx="220" cy="106" rx="20" ry="14" fill="#B2EBF2" />
      <rect x="214" y="80" width="12" height="14" rx="3" fill="#B0BEC5" />
      <rect x="206" y="78" width="28" height="5" rx="2" fill="#B0BEC5" />
      <rect x="214" y="128" width="12" height="16" rx="3" fill="#B0BEC5" />
      <rect x="212" y="142" width="16" height="4" rx="2" fill="#90A4AE" />
      {/* Mirror */}
      <rect x="194" y="14" width="112" height="66" rx="7" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="3" />
      <rect x="198" y="18" width="104" height="58" rx="5" fill="#B2EBF2" opacity="0.7" />
      <rect x="200" y="20" width="28" height="14" rx="4" fill="white" opacity="0.35" />
    </svg>
  );
}

const FP_ILLUSTRATIONS: Record<string, () => React.ReactElement> = {
  "Living Room": IllustrationLivingRoom,
  "Kitchen":     IllustrationKitchen,
  "Bedroom":     IllustrationBedroom,
  "Garden":      IllustrationGarden,
  "Bathroom":    IllustrationBathroom,
};

function FamiliarPlace({ onBack }: { onBack: () => void }) {
  const accentBg  = "bg-gradient-to-br from-[#1565C0] to-[#0D47A1]";
  const accentSub = "text-blue-100";

  const [phase, setPhase] = useState<"intro"|"play"|"result">("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const resultSaved = useRef(false);
  useEffect(() => {
  if (phase !== "result" || resultSaved.current) return;

  const user = auth.currentUser;

  if (!user) {
    console.error("No authenticated patient found.");
    return;
  }

  resultSaved.current = true;

  addDoc(
    collection(db, "patients", user.uid, "gameResults"),
    {
      gameName: "Familiar Place",
      score,
      starsEarned: score === 5 ? 20 : score >= 3 ? 10 : 5,
      completedAt: serverTimestamp(),
    }
  ).catch((error) => {
    console.error("Failed to save Familiar Place result:", error);
    resultSaved.current = false;
  });
}, [phase, score]);
  const [selected, setSelected] = useState<string|null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const restart = () => {
    resultSaved.current = false;
    setPhase("intro");
    setRoundIdx(0);
    setScore(0);
    setSelected(null);
    setShowFeedback(false);
  };

  const handleAnswer = (ans: string) => {
    if (showFeedback) return;
    const correct = ans === FP_ROUNDS[roundIdx].place;
    setSelected(ans);
    setShowFeedback(true);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setShowFeedback(false);
      setSelected(null);
      if (roundIdx < FP_ROUNDS.length - 1) setRoundIdx(i => i + 1);
      else setPhase("result");
    }, 900);
  };

  const round = FP_ROUNDS[roundIdx];
  const Illustration = FP_ILLUSTRATIONS[round.place];

  // ── Intro ──
  if (phase === "intro") return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className={`${accentBg} px-5 pt-2 pb-5 rounded-b-[32px]`}>
        <div className="flex items-center gap-3">
          <BackButton onBack={onBack} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Familiar Place</h2>
            <p className={`${accentSub} text-sm`}>Remember familiar places</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-7 animate-fade-in">
        <div className="w-full bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <IllustrationLivingRoom />
        </div>
        <div className="text-center">
          <p className="text-[#37474F] text-xl font-bold leading-snug">Look at each picture and</p>
          <p className="text-[#37474F] text-xl font-bold leading-snug">choose the correct place!</p>
          <p className="text-[#78909C] text-base mt-2">5 rounds • Take your time</p>
        </div>
        <button
          onClick={() => setPhase("play")}
          className={`w-full py-5 ${accentBg} text-white text-xl font-extrabold rounded-2xl shadow-md active:scale-95 transition-transform`}
        >
          Start Game 🏡
        </button>
      </div>
    </div>
  );

  // ── Play ──
  if (phase === "play") return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className={`${accentBg} px-5 pt-2 pb-4 rounded-b-[32px]`}>
        <div className="flex items-center gap-3 mb-3">
          <BackButton onBack={() => { restart(); onBack(); }} light />
          <div>
            <h2 className="text-white text-xl font-extrabold">Familiar Place</h2>
            <p className={`${accentSub} text-sm`}>Round {roundIdx + 1} of {FP_ROUNDS.length}</p>
          </div>
        </div>
        <div className="bg-white/25 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full bg-white transition-all duration-300"
            style={{ width: `${(roundIdx / FP_ROUNDS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 flex flex-col gap-4 animate-fade-in">
        {/* Picture — stays visible during answer selection */}
        <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100">
          <Illustration />
        </div>

        {/* Question */}
        <p className="text-[#37474F] text-xl font-extrabold text-center">
          Which place is this?
        </p>

        {/* 2×2 answer grid */}
        <div className="grid grid-cols-2 gap-3">
          {round.options.map(opt => {
            const isCorrect = opt === round.place;
            const isSelected = opt === selected;
            let cls = "bg-white border-gray-100 text-[#37474F] active:scale-95";
            if (showFeedback && isCorrect)
              cls = "bg-[#E8F5E9] border-[#43A047] text-[#43A047]";
            else if (showFeedback && isSelected && !isCorrect)
              cls = "bg-[#FFEBEE] border-[#E53935] text-[#E53935]";
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={`py-5 rounded-2xl text-lg font-extrabold transition-all border-2 text-center leading-tight px-3 ${cls}`}
              >
                {showFeedback && isCorrect ? "✅ " : showFeedback && isSelected ? "❌ " : ""}
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Result ──
  return (
    <div className="h-full flex flex-col bg-[#F8FAFB]">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 animate-fade-in">
        <div className="text-8xl animate-bounce-gentle">🌟</div>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#37474F]">Wonderful!</h2>
          <div className="mt-4 bg-white rounded-3xl px-8 py-5 shadow-sm border border-gray-100 inline-block">
            <p className="text-6xl font-extrabold text-[#1565C0]">{score} / {FP_ROUNDS.length}</p>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {FP_ROUNDS.map((_, i) => (
              <span key={i} className={`text-3xl ${i < score ? "text-[#F59E0B]" : "text-gray-200"}`}>⭐</span>
            ))}
          </div>
          <p className="text-[#78909C] text-lg mt-4 leading-snug">
            {score >= 4
              ? "You remembered the places very well!"
              : score >= 2
              ? "Good effort! Try once more!"
              : "Let's try again — you can do it!"}
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={restart}
            className={`w-full py-5 ${accentBg} text-white text-xl font-extrabold rounded-2xl shadow-md active:scale-95 transition-transform`}
          >
            🔄 Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full py-5 bg-white border-2 border-gray-100 text-[#37474F] text-xl font-bold rounded-2xl shadow-sm active:scale-95 transition-transform"
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("patient-home");

  useEffect(() => {
    const patient = auth.currentUser;
    if (!patient) return;

    return onSnapshot(
      collection(db, "patients", patient.uid, "gameResults"),
      (gameSnapshot) => {
        if (gameSnapshot.metadata.hasPendingWrites) return;
        const gameHistory = gameSnapshot.docs.map((gameDoc) =>
          normalizeCognitiveGameResult(gameDoc.id, gameDoc.data())
        );
        void syncCanonicalCognitiveAIReport(patient.uid, gameHistory).catch(
          (error) => console.error("Patient cognitive report sync failed:", error)
        );
      },
      (error) => console.error("Patient game report listener failed:", error)
    );
  }, []);

  const nav = (s: Screen) => setScreen(s);

  const renderScreen = () => {
    switch(screen) {
      case "patient-home": return <PatientHome onNav={nav} />;
      case "brain-quest":     return <BrainQuest onBack={() => nav("patient-home")} />;
      case "games":
  return <GamesLibrary onNav={nav} />;
      case "memory-match":
  return <MemoryMatch onBack={() => nav("patient-home")} />;

case "focus-finder":
  return <FocusFinder onBack={() => nav("patient-home")} />;

case "daily-life-recall":
  return <DailyLifeRecall onBack={() => nav("patient-home")} />;

case "pattern-path":
  return <PatternPath onBack={() => nav("patient-home")} />;

case "picture-recall":
  return <PictureRecall onBack={() => nav("patient-home")} />;

case "familiar-place":
  return <FamiliarPlace onBack={() => nav("patient-home")} />;
      case "memory-garden":   return <MemoryGarden onBack={() => nav("patient-home")} />;
      case "reminders":       return <Reminders onBack={() => nav("patient-home")} />;
      case "voice-assistant":
  return (
    <SaharaAiAssistant
      onNav={nav}
      onBack={() => nav("patient-home")}
    />
  );
      case "patient-profile": return <PatientProfile onBack={() => nav("patient-home")} />;
    }
  };

  return (
    <div className="ms-app-shell ms-patient-shell flex items-center justify-center min-h-screen overflow-x-hidden bg-[#B0BEC5]/20">
      <div
        className="ms-patient-device relative w-[390px] h-[844px] bg-[#FFFDF1] rounded-[44px] shadow-2xl overflow-hidden flex flex-col border border-gray-200"
        style={{boxShadow:"0 32px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5) inset"}}
      >
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderScreen()}
        </div>
        <BottomNav active={screen} onNav={nav} />
      </div>
    </div>
  );
}
