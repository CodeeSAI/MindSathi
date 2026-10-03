import React from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  HeartPulse,
  AlarmClock,
  BellRing,
  User,
  Wifi,
  BatteryMedium,
  Signal,
  Brain,
  Navigation
} from 'lucide-react';

interface MobileFrameProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
  alertCount: number;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  activeTab,
  setActiveTab,
  children,
  alertCount,
}) => {
  return (
    <div className="ms-mobile-frame relative mx-auto w-full max-w-[430px] h-[860px] bg-slate-900 rounded-[48px] p-3.5 shadow-2xl shadow-slate-900/30 border-4 border-slate-800 flex flex-col">
      {/* Phone Hardware Notch / Dynamic Island */}
      <div className="ms-mobile-notch absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 flex items-center justify-end px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700" />
      </div>

      {/* Screen Inner Bezel */}
      <div className="ms-mobile-screen relative w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col border border-slate-200/60">
        {/* Status Bar */}
        <div className="w-full h-10 px-6 pt-2 flex items-center justify-end text-slate-800 text-[11px] font-bold z-30 shrink-0 select-none">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-2 custom-scrollbar">
          {children}
        </main>

        {/* Material 3 Bottom Navigation Bar */}
        <nav className="ms-bottom-nav h-16 border-t border-slate-200/70 px-2 flex items-center justify-around z-30 shrink-0">
          {/* Home */}
          <button
            onClick={() => setActiveTab('home')}
            id="nav-tab-home-btn"
            type="button"
            aria-label="Home"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <div
              className={`ms-nav-icon--home p-1 rounded-xl transition-all ${
                activeTab === 'home' ? 'ms-nav-active text-emerald-800 scale-105' : ''
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-[12px] leading-tight mt-0.5 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>Home</span>
          </button>

          {/* Monitoring */}
          <button
            onClick={() => setActiveTab('monitoring')}
            id="nav-tab-monitoring-btn"
            type="button"
            aria-label="Monitoring"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'monitoring' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <div
              className={`ms-nav-icon--games p-1 rounded-xl transition-all ${
                activeTab === 'monitoring' ? 'ms-nav-active text-emerald-800 scale-105' : ''
              }`}
            >
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className={`text-[12px] leading-tight mt-0.5 ${activeTab === 'monitoring' ? 'font-bold' : 'font-medium'}`}>Monitoring</span>
          </button>

          {/* Reminders */}
          <button
            onClick={() => setActiveTab('reminders')}
            id="nav-tab-reminders-btn"
            type="button"
            aria-label="Reminders"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'reminders' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <div
              className={`ms-nav-icon--reminders p-1 rounded-xl transition-all ${
                activeTab === 'reminders' ? 'ms-nav-active text-emerald-800 scale-105' : ''
              }`}
            >
              <AlarmClock className="w-5 h-5" />
            </div>
            <span className={`text-[12px] leading-tight mt-0.5 ${activeTab === 'reminders' ? 'font-bold' : 'font-medium'}`}>Reminders</span>
          </button>

          {/* Alerts */}
          <button
            onClick={() => setActiveTab('alerts')}
            id="nav-tab-alerts-btn"
            type="button"
            aria-label="Alerts"
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'alerts' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <div
              className={`ms-nav-icon--garden p-1 rounded-xl transition-all relative ${
                activeTab === 'alerts' ? 'ms-nav-active text-emerald-800 scale-105' : ''
              }`}
            >
              <BellRing className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </div>
            <span className={`text-[12px] leading-tight mt-0.5 ${activeTab === 'alerts' ? 'font-bold' : 'font-medium'}`}>Alerts</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            id="nav-tab-profile-btn"
            type="button"
            aria-label="Profile"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'profile' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <div
              className={`ms-nav-icon--profile p-1 rounded-xl transition-all ${
                activeTab === 'profile' ? 'ms-nav-active text-emerald-800 scale-105' : ''
              }`}
            >
              <User className="w-5 h-5" />
            </div>
            <span className={`text-[12px] leading-tight mt-0.5 ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
