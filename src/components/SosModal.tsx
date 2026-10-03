import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  patientName?: string;
  location?: string;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  location,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isSending) return;
    setIsSending(true);
    setSendError(null);

    try {
      await onConfirm();
      setIsSending(false);
      onClose();
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : "unknown";
      console.error("SOS Firestore persistence failed", { code, error });
      setSendError("The SOS alert could not be saved. Please try again.");
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="ms-glass bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-rose-100" style={{"--ms-glass-tint":"rgb(232 64 64 / 5%)", maxWidth: "min(calc(100% - 24px), 420px)"} as React.CSSProperties}>
        {/* Header row: icon + close */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                Trigger Emergency SOS?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Alert your linked caregiver</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-10 min-w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {patientName ? `${patientName}, this` : "This"} saves an SOS safety alert for the linked caregiver to review. It does not call emergency services.
          {location ? (
            <> The supplied location is <span className="text-emerald-700 font-semibold">{location}</span>.</>
          ) : (
            " Location is optional and is not included."
          )}
        </p>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-5 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="text-xs text-rose-800 leading-relaxed">The active alert will appear on the linked caregiver dashboard immediately.</span>
        </div>

        {sendError && <p className="text-sm text-rose-700 mb-4 bg-rose-50 px-3 py-2 rounded-lg" role="alert">{sendError}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isSending}
            id="cancel-sos-btn"
            className="flex-1 min-h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSending}
            id="confirm-dispatch-sos-btn"
            className="flex-1 min-h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isSending ? "Saving alert..." : "Send SOS Alert"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
