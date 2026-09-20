import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  Building,
  School,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { SystemSettings, Student, MovementAuditLog } from '../types';
import { soundManager } from '../utils/audio';
import { exportFullDatabaseJSON } from '../utils/storage';

interface AdminModalProps {
  isOpen: boolean;
  settings: SystemSettings;
  students: Student[];
  logs: MovementAuditLog[];
  onUpdateSettings: (settings: SystemSettings) => void;
  onResetFactoryData: () => void;
  onRestoreJSON: (students: Student[], logs: MovementAuditLog[], settings: SystemSettings) => void;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  settings,
  students,
  logs,
  onUpdateSettings,
  onResetFactoryData,
  onRestoreJSON,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>({ ...settings });
  const [newPin, setNewPin] = useState(settings.housemasterPin);
  const [confirmPin, setConfirmPin] = useState(settings.housemasterPin);
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playCheckInChime();
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleUpdatePin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      soundManager.playErrorBuzzer();
      setPinMessage('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      soundManager.playErrorBuzzer();
      setPinMessage('PINs do not match.');
      return;
    }
    soundManager.playDepartureClick();
    const updated = { ...localSettings, housemasterPin: newPin };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    setPinMessage('Security PIN successfully updated!');
    setTimeout(() => setPinMessage(null), 3000);
  };

  const handleJSONFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.students && Array.isArray(parsed.students)) {
          soundManager.playCheckInChime();
          onRestoreJSON(
            parsed.students,
            parsed.logs || [],
            parsed.settings || localSettings
          );
          alert(`Successfully restored ${parsed.students.length} student records and database history.`);
          onClose();
        } else {
          soundManager.playErrorBuzzer();
          alert('Invalid backup JSON format.');
        }
      } catch {
        soundManager.playErrorBuzzer();
        alert('Could not parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Housemaster Administrative Settings</h3>
              <p className="text-xs text-slate-400">System parameters, security PIN, &amp; database recovery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Institution & Term Configuration */}
          <form onSubmit={handleSaveGeneral} className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <School className="w-4 h-4 text-emerald-400" />
              School &amp; Officer Bio
            </h4>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">School / Institution Name</label>
              <input
                type="text"
                value={localSettings.schoolName}
                onChange={e => setLocalSettings({ ...localSettings, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 text-xs">Academic Year</label>
                <input
                  type="text"
                  value={localSettings.academicYear}
                  onChange={e => setLocalSettings({ ...localSettings, academicYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-xs">Term / Phase</label>
                <input
                  type="text"
                  value={localSettings.currentTerm}
                  onChange={e => setLocalSettings({ ...localSettings, currentTerm: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 text-xs">Senior Housemaster Name</label>
                <input
                  type="text"
                  value={localSettings.officerName}
                  onChange={e => setLocalSettings({ ...localSettings, officerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-xs">Reopening Defaulter Grace (Hours)</label>
                <input
                  type="number"
                  value={localSettings.reopeningDeadlineHours}
                  onChange={e => setLocalSettings({ ...localSettings, reopeningDeadlineHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              Save Parameters
            </button>
          </form>

          {/* Security PIN Configuration */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              Security PIN Modification (Default: 1234)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 text-xs">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-base"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-xs">Confirm 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-base"
                />
              </div>
            </div>

            {pinMessage && (
              <p className="text-xs font-semibold text-emerald-400">{pinMessage}</p>
            )}

            <button
              type="button"
              onClick={handleUpdatePin}
              className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition"
            >
              Update Security PIN
            </button>
          </div>

          {/* Database Backup & Disaster Recovery */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Local Persistence &amp; Backup
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Records are persistently stored in browser IndexedDB / LocalStorage with automated background snapshots.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Full JSON Export */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playButtonClick();
                  exportFullDatabaseJSON(students, logs, localSettings);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-teal-400" />
                <span>Export Full Backup (JSON)</span>
              </button>

              {/* Restore JSON */}
              <input
                type="file"
                ref={jsonInputRef}
                onChange={handleJSONFileRestore}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Restore from JSON</span>
              </button>
            </div>

            {/* Factory Reset */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playButtonClick();
                  if (confirm('Reset to factory dataset? This will restore the 180 initial boarders (142 arrived, 38 vacated).')) {
                    onResetFactoryData();
                    onClose();
                  }
                }}
                className="py-2 px-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold transition flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Factory 180 Students Dataset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
