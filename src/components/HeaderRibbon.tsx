import React from 'react';
import {
  LogIn,
  LogOut,
  Users,
  BarChart3,
  QrCode,
  Volume2,
  VolumeX,
  Lock,
  HelpCircle,
  Download,
  Wifi,
  WifiOff,
  Building2
} from 'lucide-react';
import { AppMode, TermMode, Student } from '../types';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { soundManager } from '../utils/audio';

interface HeaderRibbonProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  termMode: TermMode;
  onToggleTermMode: () => void;
  students: Student[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenScanner: () => void;
  onOpenAdmin: () => void;
  onOpenHelp: () => void;
  selectedHouse: string;
  onSelectHouse: (house: string) => void;
  houses: string[];
}

export const HeaderRibbon: React.FC<HeaderRibbonProps> = ({
  currentMode,
  onSelectMode,
  termMode,
  onToggleTermMode,
  students,
  soundEnabled,
  onToggleSound,
  onOpenScanner,
  onOpenAdmin,
  onOpenHelp,
  selectedHouse,
  onSelectHouse,
  houses
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Filter calculations based on selectedHouse
  const filteredStudents = selectedHouse === 'All Houses'
    ? students
    : students.filter(s => s.house === selectedHouse);

  const total = filteredStudents.length;
  const arrived = filteredStudents.filter(s => s.status === 'in_dorm').length;
  const checkedOut = filteredStudents.filter(s => s.status === 'checked_out').length;
  const arrivedPercent = total > 0 ? ((arrived / total) * 100).toFixed(1) : '0.0';

  const modes: { id: AppMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'arrivals', label: '📥 Reopening Arrivals', icon: LogIn },
    { id: 'departures', label: '📤 Vacation Departures', icon: LogOut },
    { id: 'roster', label: '📋 Master House Roster', icon: Users },
    { id: 'analytics', label: '📊 Attendance Analytics', icon: BarChart3 }
  ];

  const handleModeChange = (mode: AppMode) => {
    soundManager.playButtonClick();
    onSelectMode(mode);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top Brand Bar & Live Roll-Call Badges */}
      <div className="px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-900/40 text-white font-bold text-sm">
            SE
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] sm:text-sm font-bold tracking-tight text-white">
                Sir Eugene Technologies
              </span>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                Boarding House Management
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Arrival &amp; Departure Gate Studio • St. Eugene High
            </p>
          </div>
        </div>

        {/* Live Badges & Quick Stats Ribbon */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Status Badge */}
          <button
            onClick={onToggleTermMode}
            title="Click to toggle Term Active vs Vacation Mode"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
              termMode === 'reopening'
                ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${termMode === 'reopening' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span>{termMode === 'reopening' ? '🟢 Term Active / Reopening' : '⚪ Vacation Mode'}</span>
          </button>

          {/* Live Turnout Pill */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-3 py-1 rounded-full text-[11px] font-mono">
            <span className="text-emerald-400 font-medium">
              [ Arrived: {arrived} / {total} ({arrivedPercent}%) ]
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300 font-medium">
              [ Checked Out: {checkedOut} ]
            </span>
          </div>

          {/* House Filter Dropdown */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedHouse}
              onChange={(e) => {
                soundManager.playButtonClick();
                onSelectHouse(e.target.value);
              }}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="All Houses" className="bg-slate-800 text-slate-100">All Houses</option>
              {houses.map(h => (
                <option key={h} value={h} className="bg-slate-800 text-slate-100">{h}</option>
              ))}
            </select>
          </div>

          {/* Online/Offline Status Indicator */}
          <div
            title={isOnline ? 'Network Connected' : 'Offline Mode Active'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-700/60 text-amber-300 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio Synthesizer' : 'Enable Audio Synthesizer'}
            className={`p-1.5 rounded-lg border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-750'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* PWA Install Button */}
          {(isInstallable || isIOS) && (
            <button
              onClick={() => install()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/40 text-teal-300 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA</span>
            </button>
          )}

          {/* Admin PIN Gate Button */}
          <button
            onClick={onOpenAdmin}
            title="Senior Housemaster Security Gate (PIN: 1234)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Admin (1234)</span>
          </button>

          {/* Help Guide */}
          <button
            onClick={onOpenHelp}
            title="Housemaster & Kiosk Help Guide"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Ribbon with Horizontal Scroll */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 overflow-x-auto no-scrollbar whitespace-nowrap gap-2 bg-slate-900/95">
        <nav className="flex items-center gap-1 sm:gap-2">
          {modes.map((mode) => {
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 border border-emerald-500'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{mode.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Instant Camera Scanner Action Button */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition shrink-0 active:scale-95"
        >
          <QrCode className="w-4 h-4 text-slate-950" />
          <span>Scanner</span>
        </button>
      </div>
    </header>
  );
};
