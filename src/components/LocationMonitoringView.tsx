import React, { useState } from 'react';
import { PatientProfile } from '../types';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  Compass,
  Radio,
  ChevronLeft,
  User
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
      <div className="flex items-center gap-3 pt-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-xs shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-[24px] font-bold text-[#182019] tracking-tight leading-tight">
            Location Monitoring
          </h2>
          <p className="text-[14px] text-[#4F5A50] font-medium mt-0.5 leading-snug">
            GPS tracking & safe zone perimeter status
          </p>
        </div>
      </div>

      {/* 1. Map Area - Polished Vector Map Preview */}
      <div className="ms-map-canvas relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm h-72 sm:h-80 flex items-center justify-center select-none">
        {/* Subtle Map Vector Canvas */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="ms-map-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#E5DFD3" />
            </pattern>
          </defs>

          {/* Background dot grid */}
          <rect width="100%" height="100%" fill="url(#ms-map-dots)" />

          {/* Subtle Park/Garden Zones */}
          <path
            d="M 10 20 Q 80 30 100 110 T 20 200 Z"
            fill="#EDF6EC"
            stroke="#D5E8D3"
            strokeWidth="1.5"
          />
          <path
            d="M 290 180 Q 365 200 385 275 T 270 305 Z"
            fill="#EDF6EC"
            stroke="#D5E8D3"
            strokeWidth="1.5"
          />

          {/* Subtle Waterway */}
          <path
            d="M 390 -10 Q 330 90 350 190 T 300 330"
            fill="none"
            stroke="#E3EFFF"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Street Grid - Road Casings & Surfaces */}
          {/* East-West Boulevard */}
          <path
            d="M -20 150 L 420 150"
            stroke="#E2E8F0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M -20 150 L 420 150"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M -20 150 L 420 150"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* North-South Avenue */}
          <path
            d="M 200 -20 L 200 340"
            stroke="#E2E8F0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 200 -20 L 200 340"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 200 -20 L 200 340"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* Secondary Arterials */}
          <path
            d="M 40 270 Q 130 220 200 150 T 340 70"
            stroke="#E8ECEF"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 40 270 Q 130 220 200 150 T 340 70"
            stroke="#FFFFFF"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M 80 -10 L 80 150" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M 200 240 L 360 240" stroke="#FFFFFF" strokeWidth="6" />
        </svg>

        {/* Top Badges / Status Pills */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20 pointer-events-none">
          <div className="bg-white/92 backdrop-blur-md px-3 py-1.5 rounded-full border border-sky-200/80 shadow-xs flex items-center gap-1.5 text-[12px] font-semibold text-[#1E56A0]">
            <Compass className="w-3.5 h-3.5 text-[#1E56A0]" />
            <span>Google Maps Ready</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-full backdrop-blur-md shadow-xs flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide transition-colors ${
              safeZoneEnabled
                ? 'bg-[#E8F5E9]/95 text-[#1B5E20] border border-[#2F7D32]/30'
                : 'bg-amber-50/95 text-amber-800 border border-amber-300'
            }`}
          >
            {safeZoneEnabled ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D32]" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-amber-700" />
            )}
            <span>{safeZoneEnabled ? 'Safe Zone Normal' : 'Safe Zone Paused'}</span>
          </div>
        </div>

        {/* Geofence Safe Zone Circle */}
        <div
          className={`relative w-52 h-52 sm:w-56 sm:h-56 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            safeZoneEnabled
              ? 'border-[#2F7D32]/75 bg-[#2F7D32]/10 shadow-sm'
              : 'border-slate-300/80 bg-slate-200/20'
          }`}
        >
          {/* Inner pulse */}
          <div
            className={`w-28 h-28 rounded-full transition-all duration-300 ${
              safeZoneEnabled
                ? 'bg-[#2F7D32]/15 animate-pulse motion-reduce:animate-none'
                : 'bg-slate-200/30'
            }`}
          />

          {/* Patient Marker (Privacy-safe generic marker) */}
          <div className="absolute flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-[#2F7D32] ring-3 ring-white shadow-md border-2 border-emerald-600 flex items-center justify-center z-10 transition-transform hover:scale-105">
              <User className="w-5 h-5 text-white stroke-[2.4]" />
            </div>
            {/* Inside Zone Label - clearly separated beneath marker, no overlap */}
            <span
              className={`mt-2 px-2.5 py-0.5 rounded-full text-[12px] font-bold border shadow-xs whitespace-nowrap z-10 transition-colors ${
                safeZoneEnabled
                  ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#2F7D32]/35'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {patient.fullName.split(' ')[0]} ({safeZoneEnabled ? 'Inside Zone' : 'Paused'})
            </span>
          </div>
        </div>

        {/* Bottom Coordinates & Time Overlay Bar */}
        <div className="absolute bottom-3 left-3 right-3 p-2.5 px-3.5 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/10 text-white flex items-center justify-between shadow-md z-20">
          <span className="font-mono text-emerald-400 font-semibold text-[12px] flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-400 rotate-45 shrink-0" />
            <span>
              {patient.currentLatitude.toFixed(4)}° N, {patient.currentLongitude.toFixed(4)}° E
            </span>
          </span>
          <span className="text-slate-200 font-medium text-[12px]">
            Updated {patient.lastLocationUpdate}
          </span>
        </div>
      </div>

      {/* 2. Current Location Status Card */}
      <div className="ms-glass rounded-2xl p-4 border border-slate-200/70 shadow-sm space-y-3">
        <h3 className="text-[17px] font-bold text-[#182019] flex items-center gap-2">
          <MapPin className="w-4.5 h-4.5 text-[#2F7D32] shrink-0" />
          <span>Current Location Status</span>
        </h3>

        {/* Location Box */}
        <div className="p-3.5 bg-[#FAF8F2] rounded-xl border border-slate-200/70 shadow-2xs">
          <span className="text-[12px] font-bold text-[#667066] uppercase tracking-wider">
            Last Known Address
          </span>
          <p className="text-[16px] font-semibold text-[#182019] mt-1 leading-snug">
            {patient.lastKnownLocation}
          </p>
          <p className="text-[14px] text-[#4F5A50] mt-1 font-medium leading-relaxed">
            Living Room Garden Patio & Courtyard area
          </p>
        </div>

        {/* Safe Zone Geofence Box */}
        <div className="p-3.5 bg-[#E8F5E9]/60 rounded-xl border border-[#2F7D32]/25 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#182019]">
              <ShieldCheck className="w-4 h-4 text-[#2F7D32] shrink-0" />
              <span>Safe Zone Geofence</span>
            </div>
            <p className="text-[13px] text-[#2F7D32] font-semibold mt-0.5 leading-snug">
              {patient.safeZoneName}
            </p>
            <p className="text-[13px] text-[#4F5A50] font-medium mt-0.5">
              Radius: 350m perimeter active ({safeZoneEnabled ? 'monitoring enabled' : 'monitoring paused'})
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={safeZoneEnabled}
            aria-label="Toggle Safe Zone Geofence"
            onClick={() => setSafeZoneEnabled((prev) => !prev)}
            className="min-w-[44px] min-h-[44px] p-1 flex items-center justify-center cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            <div
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
                safeZoneEnabled ? 'bg-[#2F7D32]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  safeZoneEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
