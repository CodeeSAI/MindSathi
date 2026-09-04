import React, { useEffect, useMemo, useState } from "react";
import {
  generateCognitiveAIReport,
  CognitiveAIReport,
} from "./services/aiCognitiveReport";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";

import {
  ActiveTab,
  PatientProfile,
  HealthMetrics,
  ReminderItem,
  AlertItem,
  CognitiveProgress,
  MoodType,
} from "./types";

import {
  INITIAL_PATIENT,
  INITIAL_HEALTH_METRICS,
  INITIAL_ALERTS,
  INITIAL_COGNITIVE_PROGRESS,
} from "./data/dementiaData";

import { HeaderBar } from "./components/HeaderBar";
import { MobileFrame } from "./components/MobileFrame";
import { MonitoringView } from "./components/MonitoringView";
import { RemindersView } from "./components/RemindersView";
import { MemoryProgressView } from "./components/MemoryProgressView";
import { AlertsSafetyView } from "./components/AlertsSafetyView";
import { LocationMonitoringView } from "./components/LocationMonitoringView";
import { PatientProfileView } from "./components/PatientProfileView";
import { FlutterCodeViewer } from "./components/FlutterCodeViewer";
import { SosModal } from "./components/SosModal";
import { AddReminderModal } from "./components/AddReminderModal";

import {
  Brain,
  ChevronRight,
  Clock,
  Pill,
  ShieldCheck,
  AlertTriangle,
  Trophy,
} from "lucide-react";

/* =========================================================
   CAREGIVER REMINDERS
   Only useful reminder information is kept here.
   Firebase stores the patient's completion state.
   ========================================================= */



/* =========================================================
   APP
   ========================================================= */

export function App() {
  const [viewMode, setViewMode] = useState<"app" | "code">("app");
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  const [patient, setPatient] =
    useState<PatientProfile>(INITIAL_PATIENT);

  const [metrics] =
    useState<HealthMetrics>(INITIAL_HEALTH_METRICS);

 const [reminders, setReminders] = useState<ReminderItem[]>([]);

  const [alerts, setAlerts] =
    useState<AlertItem[]>(INITIAL_ALERTS);

  const [cognitiveProgress, setCognitiveProgress] =
    useState<CognitiveProgress>(INITIAL_COGNITIVE_PROGRESS);
    const [aiReport, setAiReport] =
  useState<CognitiveAIReport | null>(null);

  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  const [isReminderModalOpen, setIsReminderModalOpen] =
    useState(false);

  const [editingReminder, setEditingReminder] =
    useState<ReminderItem | null>(null);

  /* =========================================================
     FIREBASE: LOAD RAVI + GAMES + REMINDER STATE
     ========================================================= */

  useEffect(() => {
  let unsubscribeGames: (() => void) | undefined;
  let unsubscribeReminders: (() => void) | undefined;

  const loadAssignedPatient = async () => {
    const caretaker = auth.currentUser;

    if (!caretaker) {
      console.error("No authenticated caretaker found.");
      return;
    }

    try {
      console.log("Caretaker UID:", caretaker.uid);

      // Find the patient assigned to this caretaker
      const q = query(
        collection(db, "users"),
        where("caretakerId", "==", caretaker.uid),
        where("role", "==", "patient")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.error("No patient linked to caretaker:", caretaker.uid);
        return;
      }

      const patientDoc = snapshot.docs[0];
      const patientData = patientDoc.data();
      const patientId = patientDoc.id;

      console.log("Linked patient:", patientId, patientData);

      // Show real patient name
      setPatient({
        ...INITIAL_PATIENT,
        fullName: patientData.name || "Ravi Kumar",
      });

      // =========================================================
      // REAL-TIME REMINDER SYNC
      // =========================================================
      const reminderRef = doc(
        db,
        "patients",
        patientId,
        "reminders",
        "today"
      );

      unsubscribeReminders = onSnapshot(
        reminderRef,
        (reminderSnapshot) => {
          if (!reminderSnapshot.exists()) {
            setReminders([]);
            return;
          }

          const reminderData = reminderSnapshot.data();

          const rawReminders = Array.isArray(reminderData.reminders)
            ? reminderData.reminders
            : [];

          const done = Array.isArray(reminderData.done)
            ? reminderData.done
            : [];

          const normalizedReminders = rawReminders.map(
            (r: any, index: number) => {
              const label = r.label ?? r.title ?? "Reminder";
              const lower = String(label).toLowerCase();

              return {
                id: r.id ?? `r-${index}`,
                title: label,
                category: (
  lower.includes("medication")
    ? "Medicine"
    : lower.includes("water") ||
      lower.includes("hydration")
    ? "Water"
    : "Appointment"
) as "Medicine" | "Water" | "Appointment",
                time: r.time ?? "",
                dosageOrDetail:
                  r.dosageOrDetail ?? label,
                repeat: r.repeat ?? "Daily",
                isCompleted: Boolean(
                  done[index] ?? r.done
                ),
              };
            }
          );

          setReminders(normalizedReminders);

          console.log(
            "Real-time reminders updated:",
            normalizedReminders
          );
        },
        (error) => {
          console.error(
            "Reminder listener failed:",
            error
          );
        }
      );

      // =========================================================
      // REAL-TIME GAME RESULT SYNC
      // =========================================================
      const gamesRef = collection(
        db,
        "patients",
        patientId,
        "gameResults"
      );

      unsubscribeGames = onSnapshot(
        gamesRef,
        (resultsSnapshot) => {
  const gameHistory = [...resultsSnapshot.docs]
  .sort((a, b) => {
    const timeA =
      a.data().completedAt?.toMillis?.() || 0;

    const timeB =
      b.data().completedAt?.toMillis?.() || 0;

    return timeB - timeA;
  })
  .map((docSnap) => {
    const data = docSnap.data();

    // All cognitive games now store their performance on a 0–100 scale.
    let score = 0;

if (data.normalizedScore !== undefined) {
  // New adaptive-game records
  score = Number(data.normalizedScore);
} else if (data.maxScore) {
  // Older records that stored score + maxScore
  score =
    (Number(data.score || 0) /
      Number(data.maxScore)) *
    100;
} else if (data.gameName === "Memory Match") {
  // Old Memory Match records were scored out of 20
  score =
    (Number(data.score || 0) / 20) * 100;
} else {
  // Older cognitive games were scored out of 5
  score =
    (Number(data.score || 0) / 5) * 100;
}

score = Math.max(
  0,
  Math.min(100, Math.round(score))
);

    const gameName = String(
      data.gameName ||
      data.gameType ||
      "Cognitive Game"
    );

    const domainMap: Record<string, string> = {
      "Memory Match": "Memory",
      "Focus Finder": "Attention",
      "Daily Life Recall": "Routine Recall",
      "Pattern Path": "Pattern Recognition",
      "Familiar Place": "Memory",
      "Picture Recall": "Memory",
    };

    return {
      id: docSnap.id,
      gameName,

      playedTime:
        data.completedAt?.toDate?.()
          ? data.completedAt.toDate().toLocaleString()
          : "Recently",

      score,
      maxScore: 100,

      duration:
        data.completionTimeSeconds
          ? `${Math.round(data.completionTimeSeconds)}s`
          : data.durationSeconds
          ? `${data.durationSeconds}s`
          : "Completed",

      difficulty:
        data.difficultyLevel
          ? `Level ${data.difficultyLevel}`
          : "Adaptive",

      cognitiveDomain:
        data.cognitiveDomain ||
        domainMap[gameName] ||
        "Cognitive",
    };
  });

  // =========================================================
// LATEST RESULT OF EACH GAME FOR AI ANALYSIS
// gameHistory is already newest → oldest
// =========================================================
const latestByGame = new Map<
  string,
  (typeof gameHistory)[number]
>();

gameHistory.forEach((game) => {
  if (!latestByGame.has(game.gameName)) {
    latestByGame.set(game.gameName, game);
  }
});

const latestGameHistory = Array.from(
  latestByGame.values()
);
  // Overall score is the average of each game's 0–100 performance.
  const overallScore =
    gameHistory.length > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              gameHistory.reduce(
                (total, game) =>
                  total + Number(game.score || 0),
                0
              ) / gameHistory.length
            )
          )
        )
      : 0;

  // =========================================================
  // GEMINI AI COGNITIVE REPORT
  // =========================================================
  generateCognitiveAIReport(gameHistory)
    .then((report) => {
      setAiReport(report);

      console.log(
        "GEMINI AI COGNITIVE REPORT:",
        report
      );
    })
    .catch((error) => {
      console.error(
        "AI cognitive report failed:",
        error
      );
    });

  setCognitiveProgress({
    overallScore,

    improvementPercentage: 0,

    statusDescription:
      overallScore >= 80
        ? "Strong cognitive performance"
        : overallScore >= 60
        ? "Steady cognitive performance"
        : "Continued practice recommended",

    weeklyTrend: gameHistory.map(
      (game, index) => ({
        day: `Game ${index + 1}`,
        score: Math.max(
          0,
          Math.min(100, Number(game.score || 0))
        ),
      })
    ),

    gameHistory,
  });

  console.log(
    "REAL-TIME GAME UPDATE:",
    gameHistory
  );
},
(error) => {
        
          console.error(
            "Game results listener failed:",
            error
          );
        }
      );
    } catch (error) {
      console.error(
        "FAILED TO LOAD CARETAKER DATA:",
        error
      );
    }
  };

  loadAssignedPatient();

  // Clean up Firestore listeners
  return () => {
    if (unsubscribeGames) {
      unsubscribeGames();
    }

    if (unsubscribeReminders) {
      unsubscribeReminders();
    }
  };
}, []);

  /* =========================================================
     DERIVED GAME DATA
     ========================================================= */

  const gameHistory =
    cognitiveProgress.gameHistory;

  const memoryScore = useMemo(() => {
    if (gameHistory.length === 0) {
      return 0;
    }

    return Math.round(
      gameHistory.reduce((total, game) => {
        if (!game.maxScore) {
          return total;
        }

        return (
          total +
          (game.score / game.maxScore) * 100
        );
      }, 0) / gameHistory.length
    );
  }, [gameHistory]);

  /* =========================================================
     HANDLERS
     ========================================================= */

  const handleUpdateMood = (mood: MoodType) => {
    console.log("Mood:", mood);
  };

  const handleToggleReminder = (id: string) => {
    setReminders((previous) =>
      previous.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              isCompleted:
                !reminder.isCompleted,
            }
          : reminder
      )
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((previous) =>
      previous.filter(
        (reminder) => reminder.id !== id
      )
    );
  };

  const handleSaveReminder = (
    reminder: ReminderItem
  ) => {
    if (editingReminder) {
      setReminders((previous) =>
        previous.map((item) =>
          item.id === reminder.id
            ? reminder
            : item
        )
      );
    } else {
      setReminders((previous) => [
        reminder,
        ...previous,
      ]);
    }

    setEditingReminder(null);
    setIsReminderModalOpen(false);
  };

  const handleOpenAddReminderModal = (
    reminder?: ReminderItem
  ) => {
    setEditingReminder(reminder || null);
    setIsReminderModalOpen(true);
  };

  const handleTriggerSos = () => {
    setPatient((previous) => ({
      ...previous,
      status: "Emergency",
    }));

    const newAlert: AlertItem = {
      id: `sos_${Date.now()}`,
      title: "Emergency SOS",
      description: `Emergency check triggered for ${patient.fullName}.`,
      type: "SOS",
      severity: "critical",
      timestamp: "Just now",
      isResolved: false,
      location: patient.lastKnownLocation,
    };

    setAlerts((previous) => [
      newAlert,
      ...previous,
    ]);

    setActiveTab("alerts");
    setIsSosModalOpen(false);
  };

  const handleResolveAlert = (id: string) => {
    setAlerts((previous) => {
      const updated = previous.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              isResolved: true,
            }
          : alert
      );

      const hasCritical =
        updated.some(
          (alert) =>
            alert.severity === "critical" &&
            !alert.isResolved
        );

      if (!hasCritical) {
        setPatient((previousPatient) => ({
          ...previousPatient,
          status: "Safe",
        }));
      }

      return updated;
    });
  };

  const handleUpdateNotes = (notes: string) => {
    setPatient((previous) => ({
      ...previous,
      caregiverNotes: notes,
    }));
  };

  const unresolvedAlertsCount =
    alerts.filter(
      (alert) => !alert.isResolved
    ).length;

  /* =========================================================
     CLEAN HOME SCREEN
     ========================================================= */

  const HomeScreen = () => {
    return (
      <div className="space-y-4 pb-20">

        {/* Patient */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                Patient
              </p>

              <h2 className="text-lg font-extrabold text-slate-900">
                {patient.fullName}
              </h2>

              <p className="text-xs text-slate-500">
                Cognitive care monitoring
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                patient.status === "Emergency"
                  ? "bg-rose-100 text-rose-700"
                  : patient.status ===
                    "Needs Attention"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {patient.status}
            </span>

          </div>
        </div>

        {/* Safety */}
        <div className="grid grid-cols-2 gap-3">

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mb-2" />

            <p className="text-[10px] uppercase font-bold text-emerald-600">
              Safety
            </p>

            <p className="text-sm font-black text-emerald-800">
              {patient.status === "Emergency"
                ? "Emergency"
                : "Patient Safe"}
            </p>
          </div>

          <button
            onClick={() =>
              setIsSosModalOpen(true)
            }
            className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />

            <p className="text-[10px] uppercase font-bold text-rose-600">
              Safety Control
            </p>

            <p className="text-sm font-black text-rose-700">
              SOS Alert
            </p>
          </button>

        </div>

        {/* Medication */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Medication
                </h3>

                <p className="text-[10px] text-slate-500">
                  Current caregiver schedule
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-700">
              {
                reminders.filter(
                  (item) =>
                    item.category ===
                      "Medicine" &&
                    item.isCompleted
                ).length
              }
              /
              {
                reminders.filter(
                  (item) =>
                    item.category ===
                    "Medicine"
                ).length
              }
            </span>

          </div>

          <button
            onClick={() =>
              setActiveTab("reminders")
            }
            className="w-full mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 text-left"
          >
            View reminders →
          </button>

        </div>

        {/* Cognitive Report */}
        <div
          onClick={() =>
            setActiveTab("memory_progress")
          }
          className="bg-gradient-to-br from-teal-800 to-emerald-700 rounded-2xl p-4 text-white cursor-pointer shadow-md"
        >

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>

              <div>

                <p className="text-[10px] uppercase tracking-wide font-semibold text-emerald-100">
                  Cognitive AI Report
                </p>

                <div className="flex items-baseline gap-2">

                  <span className="text-3xl font-black">
  {aiReport ? aiReport.overallScore : memoryScore}/100
</span>

                  <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded">
                    {gameHistory.length} games
                  </span>

                </div>

              </div>

            </div>

            <ChevronRight className="w-5 h-5 text-white/70" />

          </div>

          <p className="text-xs text-emerald-100 mt-2">
  {aiReport?.summary ||
    "AI analysis based on the latest results from each completed cognitive game."}
</p>

        </div>

        {/* Games */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">

          <div className="flex items-center justify-between mb-3">

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-violet-600" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Memory Games
                </h3>

                <p className="text-[10px] text-slate-500">
                  Latest patient results
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                setActiveTab("memory_progress")
              }
              className="text-xs font-bold text-emerald-600"
            >
              View All
            </button>

          </div>

          {gameHistory.length === 0 ? (

            <div className="text-center py-5">
              <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">
                No games recorded yet
              </p>
            </div>

          ) : (

            <div className="space-y-2.5">

              {gameHistory.map((game) => {

                const percentage =
                  game.maxScore > 0
                    ? Math.round(
                        (game.score /
                          game.maxScore) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={game.id}
                    className="rounded-xl border border-slate-200 p-3 bg-slate-50/60"
                  >

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-emerald-600" />
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {game.gameName}
                          </h4>

                          <span className="text-xs font-black text-emerald-700">
                            {game.score}/
                            {game.maxScore}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          <Clock className="w-3 h-3" />
                          {game.playedTime}
                        </div>

                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-emerald-700">
                          {percentage}%
                        </p>

                        <p className="text-[9px] font-semibold text-emerald-600">
                          Completed
                        </p>
                      </div>

                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 mt-2 overflow-hidden">

                      <div
                        className="h-1.5 bg-emerald-500 rounded-full"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">

          <div className="flex items-center justify-between mb-3">

            <h3 className="text-sm font-bold text-slate-900">
              Recent Alerts
            </h3>

            <button
              onClick={() =>
                setActiveTab("alerts")
              }
              className="text-xs font-bold text-emerald-600"
            >
              View All
            </button>

          </div>

          {alerts.length === 0 ? (

            <div className="text-center py-4">
              <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto" />
              <p className="text-xs text-slate-500 mt-1">
                No recent alerts
              </p>
            </div>

          ) : (

            <div className="space-y-2">

              {alerts.slice(0, 2).map((alert) => (

                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border ${
                    alert.severity === "critical"
                      ? "bg-rose-50 border-rose-200"
                      : alert.severity === "warning"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >

                  <div className="flex items-start gap-2">

                    {alert.severity ===
                    "critical" ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    )}

                    <div className="flex-1">

                      <p className="text-xs font-bold text-slate-900">
                        {alert.title}
                      </p>

                      <p className="text-[10px] text-slate-500 mt-1">
                        {alert.description}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>
    );
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <HeaderBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        patientStatus={patient.status}
        onTriggerSos={() =>
          setIsSosModalOpen(true)
        }
      />

      {viewMode === "app" ? (

        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6">

          <MobileFrame
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            alertCount={
              unresolvedAlertsCount
            }
          >

            {activeTab === "home" && (
              <HomeScreen />
            )}

            {activeTab === "monitoring" && (
              <MonitoringView
                patient={patient}
                metrics={metrics}
                onUpdateMood={handleUpdateMood}
              />
            )}

            {activeTab === "reminders" && (
              <RemindersView
                reminders={reminders}
                onToggleReminder={
                  handleToggleReminder
                }
                onDeleteReminder={
                  handleDeleteReminder
                }
                onOpenAddModal={
                  handleOpenAddReminderModal
                }
              />
            )}

            {activeTab === "alerts" && (
              <AlertsSafetyView
                patient={patient}
                alerts={alerts}
                onTriggerSos={() =>
                  setIsSosModalOpen(true)
                }
                onResolveAlert={
                  handleResolveAlert
                }
                onNavigateToLocation={() =>
                  setActiveTab("location")
                }
              />
            )}

            {activeTab === "profile" && (
  <PatientProfileView
    patient={patient}
    progress={cognitiveProgress}
    onUpdateNotes={handleUpdateNotes}
  />
)}

            {activeTab === "memory_progress" && (
              <MemoryProgressView
                progress={cognitiveProgress}
                onBack={() =>
                  setActiveTab("home")
                }
              />
            )}

            {activeTab === "location" && (
              <LocationMonitoringView
                patient={patient}
                onBack={() =>
                  setActiveTab("alerts")
                }
              />
            )}

          </MobileFrame>

        </div>

      ) : (

        <FlutterCodeViewer />

      )}

      {/* SOS */}
      <SosModal
        isOpen={isSosModalOpen}
        onClose={() =>
          setIsSosModalOpen(false)
        }
        onConfirm={handleTriggerSos}
        patientName={patient.fullName}
        location={patient.lastKnownLocation}
      />

      {/* Add Reminder */}
      <AddReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        existingReminder={
          editingReminder
        }
      />

      <button
        onClick={async () => {
          await signOut(auth);
          window.location.reload();
        }}
        className="w-full py-4 mt-4 bg-red-50 border-2 border-red-200 text-red-600 text-lg font-bold rounded-2xl"
      >
        🚪 Logout
      </button>

    </div>
);
}
 
export default App;