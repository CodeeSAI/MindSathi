import React from "react";
import { PatientProfile, CognitiveProgress } from "../types";
import { Brain, ShieldCheck, Clock } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

interface PatientProfileViewProps {
  patient: PatientProfile;
  progress: CognitiveProgress;
  onUpdateNotes: (notes: string) => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  progress,
}) => {
  return (
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Patient Profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Patient information and cognitive summary
        </p>
      </div>

      {/* Patient Information */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
              Patient
            </p>

            <h3 className="text-lg font-extrabold text-slate-900">
              {patient.fullName}
            </h3>

            <p className="text-xs font-bold text-emerald-700 mt-1">
              ● {patient.status}
            </p>
          </div>

        </div>
      </div>

      {/* Cognitive Summary */}
      <div className="bg-gradient-to-br from-teal-800 to-emerald-700 rounded-2xl p-4 text-white shadow-md">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>

          <div>
            <p className="text-[10px] uppercase font-semibold text-emerald-100">
              Cognitive Score
            </p>

            <p className="text-3xl font-black">
              {progress.overallScore}/100
            </p>
          </div>

        </div>

        <p className="text-xs text-emerald-100 mt-2">
          {progress.statusDescription}
        </p>
      </div>

      {/* Recent Game Results */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">

        <div className="flex items-center gap-2 mb-3">

          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-600" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Game Results
            </h3>

            <p className="text-[10px] text-slate-500">
              Latest cognitive activities
            </p>
          </div>

        </div>

        {progress.gameHistory.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            No game results available.
          </p>
        ) : (
          <div className="space-y-2">

            {progress.gameHistory.slice(0, 5).map((game) => {

              const percentage =
                game.maxScore > 0
                  ? Math.round(
                      (game.score / game.maxScore) * 100
                    )
                  : 0;

              return (
                <div
                  key={game.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50"
                >

                  <div className="flex items-center justify-between">

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {game.gameName}
                      </h4>

                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {game.playedTime}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-700">
                        {game.score}/{game.maxScore}
                      </p>

                      <p className="text-[10px] font-bold text-emerald-600">
                        {percentage}%
                      </p>
                    </div>

                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
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

      {/* Logout */}
      <button
        onClick={async () => {
          await signOut(auth);
          window.location.reload();
        }}
        className="w-full py-4 bg-red-50 border-2 border-red-200 text-red-600 text-base font-bold rounded-2xl"
      >
        🚪 Logout
      </button>

    </div>
  );
};

export default PatientProfileView;