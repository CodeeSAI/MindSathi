import React, { useState } from 'react';
import { PatientProfile } from '../types';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  Compass,
  Radio,
  Layers,
  ChevronLeft,
  Info
} from 'lucide-react';

interface LocationMonitoringViewProps {
  patient: PatientProfile;
  onBack?: () => void;
}

export const LocationMonitoringView: React.FC<LocationMonitoringViewProps> = ({
  patient,
  onBack,
}) => {
  const [safeZoneEnabled, setSafeZoneEnabled] = useState(true);

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Location Monitoring
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            GPS tracking & safe zone perimeter status
          </p>
        </div>
      </div>

      {/* 1. Map Placeholder Ready for Google Maps */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 h-64 flex items-center justify-center">
        {/* Stylized Grid Canvas */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
        
        {/* Curving road graphics */}
        <svg className="absolute inset-0 w-full h-full stroke-slate-300 fill-none stroke-[6]">
          <path d="M-20,160 Q120,80 220,180 T420,100" />
          <path d="M100,-20 Q180,120 160,300" strokeWidth="4" />
        </svg>

        {/* Geofence Safe Zone Circle */}
        <div className="relative w-48 h-48 rounded-full border-2 border-emerald-500/80 bg-emerald-500/10 flex items-center justify-center animate-pulse">
          {/* Inner pulse */}
          <div className="w-24 h-24 rounded-full bg-emerald-500/20" />
          
          {/* Patient Marker */}
          <div className="absolute flex flex-col items-center">
            <div className="p-1 bg-white rounded-full shadow-lg border-2 border-emerald-600">
              <img
                src={patient.photoUrl}
                alt={patient.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-700 text-white shadow-xs">
              Margaret (Inside Zone)
            </span>
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-xl shadow-xs text-xs font-bold text-slate-700 border border-slate-200">
          <Compass className="w-3.5 h-3.5 text-sky-600 animate-spin" />
          <span>Google Maps Ready</span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white rounded-xl shadow-xs text-[11px] font-extrabold uppercase tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safe Zone Normal</span>
        </div>

        {/* Bottom Coordinates overlay */}
        <div className="absolute bottom-3 left-3 right-3 p-2 bg-slate-900/80 backdrop-blur-xs rounded-xl text-white text-[11px] flex items-center justify-between">
          <span className="font-mono text-emerald-300">
            {patient.currentLatitude.toFixed(4)}° N, {patient.currentLongitude.toFixed(4)}° E
          </span>
          <span className="text-slate-300">Updated {patient.lastLocationUpdate}</span>
        </div>
      </div>

      {/* 2. Geofence & Location Details */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Current Location Status</span>
        </h3>

        {/* Location Box */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Last Known Address
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {patient.lastKnownLocation}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Living Room Garden Patio & Courtyard area
          </p>
        </div>

        {/* Safe Zone Geofence Box */}
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe Zone Geofence</span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">{patient.safeZoneName}</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={safeZoneEnabled}
              onChange={(e) => setSafeZoneEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>
      </div>
    </div>
  );
};
