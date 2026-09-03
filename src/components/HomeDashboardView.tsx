import React from 'react';
import {
  PatientProfile,
  HealthMetrics,
  ReminderItem,
  AlertItem,
  ActiveTab,
  CognitiveGameItem,
} from '../types';

import {
  Heart,
  Moon,
  Droplet,
  Footprints,
  Pill,
  Brain,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Activity,
  Bell,
  Sun,
  Trophy,
  Clock,
} from 'lucide-react';

interface HomeDashboardViewProps {
  patient: PatientProfile;
  metrics: HealthMetrics;
  reminders: ReminderItem[];
  alerts: AlertItem[];
  gameHistory: CognitiveGameItem[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenSosModal: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  patient,
  metrics,
  reminders,
  alerts,
  gameHistory,
  onNavigate,
  onOpenSosModal,
}) => {
  /* ---------------- MEDICINE ---------------- */

  const medicineReminders = reminders.filter(
    (r) => r.category === 'Medicine'
  );

  const completedMeds = medicineReminders.filter(
    (r) => r.isCompleted
  ).length;

  const totalMeds = medicineReminders.length;

  const medProgress =
    totalMeds > 0 ? (completedMeds / totalMeds) * 100 : 0;

  /* ---------------- HEALTH ---------------- */

  const waterProgress =
    metrics.waterTargetMl > 0
      ? Math.min(
          100,
          Math.round(
            (metrics.waterIntakeMl / metrics.waterTargetMl) * 100
          )
        )
      : 0;

  const stepsProgress =
    metrics.stepsTarget > 0
      ? Math.min(
          100,
          Math.round(
            (metrics.todaySteps / metrics.stepsTarget) * 100
          )
        )
      : 0;

  /* ---------------- GAME DATA ---------------- */

  const memoryScore =
  gameHistory.length > 0
    ? Math.round(
        (gameHistory[0].score /
          gameHistory[0].maxScore) *
          100
      )
    : 0;
  /*
   * Show one most recent session for each game.
   * This prevents repeated testing of the same game
   * from filling the caregiver dashboard.
   */
  const uniqueGames = Array.from(
    gameHistory.reduce((map, game) => {
      map.set(game.gameName, game);
      return map;
    }, new Map<string, CognitiveGameItem>())
  ).map(([, game]) => game);

  const displayedGames = uniqueGames.slice(-3).reverse();

  /* ---------------- GAME ICON ---------------- */

  const getGameIcon = (gameName: string) => {
    const name = gameName.toLowerCase();

    if (name.includes('picture')) {
      return '🖼️';
    }

    if (name.includes('familiar')) {
      return '🏠';
    }

    if (name.includes('memory')) {
      return '🧩';
    }

    return '🧠';
  };

  /* ---------------- GAME SCORE ---------------- */

  const getGamePercentage = (game: CognitiveGameItem) => {
    if (!game.maxScore) return 0;

    return Math.round(
      (game.score / game.maxScore) * 100
    );
  };

  return (
    <div className="space-y-4 pb-20">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex items-center justify-between pt-1">

        <div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
            <Sun className="w-3.5 h-3.5" />
            <span>Caregiver Dashboard</span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Good Morning
          </h2>

          <p className="text-xs text-slate-500 font-medium">
            Monitoring {patient.fullName}
          </p>
        </div>

        <button
          onClick={() => onNavigate('alerts')}
          className="relative p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50"
          title="Caregiver Alerts"
        >
          <Bell className="w-4 h-4" />

          {alerts.some((a) => !a.isResolved) && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </button>
      </div>


      {/* ===================================================== */}
      {/* PATIENT PROFILE */}
      {/* ===================================================== */}

      <div
        onClick={() => onNavigate('profile')}
        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-300 transition-all"
      >
        <div className="flex items-center gap-3">

          <div className="relative shrink-0">

            <img
              src={patient.photoUrl}
              alt={patient.fullName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/20"
            />

            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white ${
                patient.status === 'Emergency'
                  ? 'bg-rose-500'
                  : patient.status === 'Needs Attention'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            >
              ✓
            </span>
          </div>

          <div className="flex-1 min-w-0">

            <div className="flex items-center justify-between gap-2">

              <h3 className="text-base font-bold text-slate-900 truncate">
                {patient.fullName}
              </h3>

              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                  patient.status === 'Emergency'
                    ? 'bg-rose-100 text-rose-700'
                    : patient.status === 'Needs Attention'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {patient.status}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Age {patient.age} yrs • Blood {patient.bloodGroup}
            </p>

            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-semibold">
              {patient.dementiaStage}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>


      {/* ===================================================== */}
      {/* SOS / SAFETY */}
      {/* ===================================================== */}

      <div className="grid grid-cols-2 gap-2.5">

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />

            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">
                Safety Status
              </p>

              <p className="text-sm font-black text-emerald-800">
                {patient.status === 'Emergency'
                  ? 'EMERGENCY'
                  : patient.status === 'Needs Attention'
                  ? 'ATTENTION'
                  : 'PATIENT SAFE'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenSosModal}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-left hover:bg-rose-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />

            <div>
              <p className="text-[10px] uppercase font-bold text-rose-600">
                Safety Control
              </p>

              <p className="text-sm font-black text-rose-700">
                SOS ALERT
              </p>
            </div>
          </div>
        </button>

      </div>


      {/* ===================================================== */}
      {/* HEALTH SUMMARY */}
      {/* ===================================================== */}

      <div>

        <div className="flex items-center justify-between mb-2.5">

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Health Summary
          </h3>

          <button
            onClick={() => onNavigate('monitoring')}
            className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"
          >
            View
            <ChevronRight className="w-3 h-3" />
          </button>

        </div>


       

         
      {/* ===================================================== */}
      {/* MEDICINE */}
      {/* ===================================================== */}

    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2">

            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Medicine Completion
              </h4>

              <p className="text-[10px] text-slate-500">
                Today's scheduled doses
              </p>
            </div>

          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
            {completedMeds} / {totalMeds}
          </span>

        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all"
            style={{ width: `${medProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">

          <span className="text-xs text-slate-500">
            {totalMeds > completedMeds
              ? 'Pending medication available'
              : 'All scheduled medicines completed'}
          </span>

          <button
            onClick={() => onNavigate('reminders')}
            className="text-xs font-bold text-emerald-600"
          >
            View
          </button>

        </div>
      </div>


      {/* ===================================================== */}
      {/* MEMORY SCORE */}
      {/* ===================================================== */}

      <div
        onClick={() => onNavigate('memory_progress')}
        className="rounded-2xl p-4 bg-gradient-to-br from-teal-800 to-emerald-700 text-white shadow-md cursor-pointer"
      >

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>

            <div>

              <span className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wide">
                Today's Memory Game Score
              </span>

              <div className="flex items-baseline gap-2">

                <span className="text-3xl font-black">
                  {memoryScore}/100
                </span>

                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                  {gameHistory.length}{' '}
                  {gameHistory.length === 1
                    ? 'Game'
                    : 'Games'}
                </span>

              </div>

            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-white/70" />

        </div>

        <p className="text-xs text-emerald-100 mt-2">
          {gameHistory.length > 0
            ? `Based on ${gameHistory.length} recorded cognitive ${
                gameHistory.length === 1 ? 'session' : 'sessions'
              }.`
            : 'No cognitive game sessions recorded yet.'}
        </p>

      </div>


      {/* ===================================================== */}
      {/* TODAY'S MEMORY GAMES */}
      {/* ===================================================== */}

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">

        <div className="flex items-center justify-between mb-3">

          <div className="flex items-center gap-2">

            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Today's Memory Games
              </h3>

              <p className="text-[10px] text-slate-500">
                Patient game performance
              </p>
            </div>

          </div>

          <button
            onClick={() => onNavigate('memory_progress')}
            className="text-xs font-bold text-emerald-600"
          >
            View All ({uniqueGames.length})
          </button>

        </div>


        {displayedGames.length === 0 ? (

          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">

            <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2" />

            <p className="text-xs font-semibold text-slate-500">
              No games completed yet
            </p>

            <p className="text-[10px] text-slate-400 mt-1">
              Completed patient games will appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-2.5">

            {displayedGames.map((game) => {

              const percentage = getGamePercentage(game);

              return (
                <div
                  key={game.id}
                  className="rounded-xl border border-slate-200 p-3 bg-slate-50/60"
                >

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg">
                      {getGameIcon(game.gameName)}
                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center justify-between gap-2">

                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {game.gameName}
                        </h4>

                        <span className="text-xs font-black text-emerald-700">
                          {game.score}/{game.maxScore}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 mt-1">

                        <span className="text-[10px] font-semibold text-slate-500">
                          {game.cognitiveDomain}
                        </span>

                        <span className="text-slate-300">
                          •
                        </span>

                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          {game.playedTime}
                        </span>

                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1 mt-2 overflow-hidden">

                        <div
                          className="bg-emerald-500 h-1 rounded-full"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                    <div className="text-right shrink-0">

                      <div className="text-sm font-black text-emerald-700">
                        {percentage}%
                      </div>

                      <div className="text-[9px] font-semibold text-emerald-600">
                        Completed
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>


     
      {/* ===================================================== */}
      {/* RECENT ALERTS */}
      {/* ===================================================== */}

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">

        <div className="flex items-center justify-between mb-3">

          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">

            <AlertTriangle className="w-4 h-4 text-amber-500" />

            Recent Caregiver Alerts

          </h4>

          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs font-bold text-emerald-600"
          >
            View All ({alerts.length})
          </button>

        </div>


        {alerts.length === 0 ? (

          <div className="py-4 text-center">

            <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto mb-1" />

            <p className="text-xs font-semibold text-slate-600">
              No recent alerts
            </p>

          </div>

        ) : (

          <div className="space-y-2">

            {alerts.slice(0, 2).map((alert) => (

              <div
                key={alert.id}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50 border-rose-200'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >

                <div className="shrink-0 mt-0.5">

                  {alert.severity === 'critical' ? (

                    <AlertTriangle className="w-4 h-4 text-rose-600" />

                  ) : alert.severity === 'warning' ? (

                    <AlertTriangle className="w-4 h-4 text-amber-600" />

                  ) : (

                    <ShieldCheck className="w-4 h-4 text-emerald-600" />

                  )}

                </div>

                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between gap-2">

                    <strong className="font-bold text-slate-900">
                      {alert.title}
                    </strong>

                    <span className="text-[9px] text-slate-400 shrink-0">
                      {alert.timestamp}
                    </span>

                  </div>

                  <p className="text-[10px] leading-relaxed text-slate-600 mt-0.5">
                    {alert.description}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
};

export default HomeDashboardView;