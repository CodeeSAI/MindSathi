import React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
  location: string;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  location,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Trigger Emergency SOS?
        </h3>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          This will immediately broadcast a critical safety alert to all primary caregivers,
          sound notification alarms, and ping <strong>{patientName}’s</strong> live GPS coordinates at{' '}
          <span className="text-emerald-700 font-semibold">{location}</span>.
        </p>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-5 text-xs text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Patient status will switch to <strong>EMERGENCY</strong> on all synced dashboards.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            id="cancel-sos-btn"
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            id="confirm-dispatch-sos-btn"
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Dispatch SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
