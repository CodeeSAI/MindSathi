import React from 'react';
import { PatientStatus } from '../types';
import { Shield, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderBarProps {
  patientStatus: PatientStatus;
  onTriggerSos: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  patientStatus,
  onTriggerSos,
}) => {
  return (
      <header className="ms-glass sticky top-0 z-30 border-b border-slate-200/80 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Brand & SIH Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                Caregiver Dashboard
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                SIH 2026 Prototype
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              AI Cognitive Gaming & Dementia Memory Assistance Platform
            </p>
          </div>
        </div>

        {/* Live Patient Status Badge */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              patientStatus === 'Emergency'
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : patientStatus === 'Needs Attention'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {patientStatus === 'Emergency' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : patientStatus === 'Needs Attention' ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Patient: {patientStatus.toUpperCase()}</span>
          </div>

          {/* Quick SOS button */}
          <button
            onClick={onTriggerSos}
            id="header-sos-trigger-btn"
            className="min-h-10 flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS Alert</span>
          </button>
        </div>
      </div>
    </header>
  );
};
