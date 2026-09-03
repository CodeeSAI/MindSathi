import React from 'react';
import { PatientProfile, HealthMetrics, MoodType } from '../types';
import { Brain, ShieldCheck } from 'lucide-react';

interface MonitoringViewProps {
  patient: PatientProfile;
  metrics: HealthMetrics;
  onUpdateMood: (mood: MoodType) => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  patient,
}) => {
  return (
    <div className="space-y-4 pb-20">

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Cognitive Monitoring
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Focused progress view for {patient.fullName}
        </p>
      </div>

      {/* Patient */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Brain className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">
              {patient.fullName}
            </p>

            <p className="text-xs text-slate-500 mt-0.5">
              Cognitive game performance
            </p>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            SAFE
          </div>

        </div>
      </div>

      {/* Clean message */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">

        <Brain className="w-10 h-10 text-emerald-500 mx-auto mb-3" />

        <h3 className="text-sm font-bold text-slate-900">
          Cognitive Progress
        </h3>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Completed memory games and detailed cognitive results
          are available in the Memory Progress report.
        </p>

      </div>

    </div>
  );
};

export default MonitoringView;