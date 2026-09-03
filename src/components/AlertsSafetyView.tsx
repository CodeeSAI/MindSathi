import React from 'react';
import { AlertItem, EmergencyContact, PatientProfile } from '../types';
import {
  AlertTriangle,
  Shield,
  Phone,
  Share2,
  MapPin,
  CheckCircle2,
  UserCheck,
  BellRing,
  Pill,
  Navigation
} from 'lucide-react';

interface AlertsSafetyViewProps {
  patient: PatientProfile;
  alerts: AlertItem[];
  onTriggerSos: () => void;
  onResolveAlert: (id: string) => void;
  onNavigateToLocation: () => void;
}

export const AlertsSafetyView: React.FC<AlertsSafetyViewProps> = ({
  patient,
  alerts,
  onTriggerSos,
  onResolveAlert,
  onNavigateToLocation,
}) => {
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-4 pb-20 relative">
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Emergency & Safety Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            High-priority safety protocol & emergency dispatch
          </p>
        </div>
        <button
          onClick={onNavigateToLocation}
          className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 flex items-center gap-1 text-xs font-bold"
        >
          <Navigation className="w-4 h-4" />
          <span>Map</span>
        </button>
      </div>

      {/* 1. Large SOS Alert Card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-rose-700 via-rose-600 to-red-700 text-white shadow-xl shadow-rose-900/20 border border-rose-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-100">
              Emergency Safety Trigger
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase">
            24/7 Monitored
          </span>
        </div>

        <p className="text-xs text-rose-100/90 leading-relaxed mb-4">
          Tap below to dispatch instant high-priority emergency notifications to all registered
          caregivers, sounding alert alarms and transmitting Margaret's live GPS coordinates.
        </p>

        <button
          onClick={onTriggerSos}
          id="sos-main-trigger-btn"
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-sm font-black tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
          <span>TRIGGER EMERGENCY SOS</span>
        </button>
      </div>

      {/* 2. Action Buttons (Call Caregiver & Share Location) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => showToast('📞 Calling Sarah Jenkins (+91 98111 22334)...')}
          id="dummy-call-caregiver-btn"
          className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span>Call Caregiver</span>
        </button>

        <button
          onClick={() => showToast(`📍 Location Shared: ${patient.lastKnownLocation}`)}
          id="dummy-share-location-btn"
          className="py-3 px-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Location</span>
        </button>
      </div>

      {/* 3. Safety Alerts Feed */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-emerald-600" />
            <span>Safety Alerts Feed</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{alerts.length} Total</span>
        </div>

        <div className="space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border transition-all ${
                alert.severity === 'critical'
                  ? 'bg-rose-50/70 border-rose-200'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5">
                  {alert.type === 'SOS' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  {alert.type === 'MissedMedicine' && <Pill className="w-4 h-4 text-amber-600" />}
                  {alert.type === 'SafeZoneBreach' && <MapPin className="w-4 h-4 text-sky-600" />}
                  {alert.type === 'info' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {alert.description}
                  </p>
                  {alert.location && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-2">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{alert.location}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    {!alert.isResolved ? (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
                      >
                        Mark as Resolved
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Emergency Contact Cards */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Emergency Contacts Directory</span>
        </h3>

        <div className="space-y-2.5">
          {patient.emergencyContacts.map((contact, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                contact.isPrimary ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{contact.name}</span>
                  {contact.isPrimary && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{contact.relationship}</p>
                <p className="text-xs font-semibold text-slate-700">{contact.phone}</p>
              </div>
              <button
                onClick={() => showToast(`📞 Calling ${contact.name} (${contact.phone})...`)}
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
