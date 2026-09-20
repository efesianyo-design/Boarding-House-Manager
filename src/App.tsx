import React, { useState, useEffect, useCallback } from 'react';
import {
  AppMode,
  TermMode,
  Student,
  MovementAuditLog,
  SystemSettings
} from './types';
import {
  loadStudents,
  saveStudents,
  loadLogs,
  saveLogs,
  loadSettings,
  saveSettings
} from './utils/storage';
import { INITIAL_HOUSES, generateInitialStudents, generateInitialAuditLogs, INITIAL_SETTINGS } from './utils/initialData';
import { soundManager } from './utils/audio';
import { HeaderRibbon } from './components/HeaderRibbon';
import { ArrivalDesk } from './components/ArrivalDesk';
import { DepartureDesk } from './components/DepartureDesk';
import { MasterRoster } from './components/MasterRoster';
import { AnalyticsDesk } from './components/AnalyticsDesk';
import { ScannerModal } from './components/ScannerModal';
import { AdminModal } from './components/AdminModal';
import { PinModal } from './components/PinModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { PrintRollSheet } from './components/PrintRollSheet';
import { PrintSummaryReport } from './components/PrintSummaryReport';
import { useOnlineStatus } from './hooks/usePWAInstall';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [logs, setLogs] = useState<MovementAuditLog[]>(() => loadLogs());
  const [settings, setSettings] = useState<SystemSettings>(() => loadSettings());
  const [currentMode, setCurrentMode] = useState<AppMode>('arrivals');
  const [selectedHouse, setSelectedHouse] = useState<string>('All Houses');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrintRollSheetOpen, setIsPrintRollSheetOpen] = useState(false);
  const [isPrintSummaryReportOpen, setIsPrintSummaryReportOpen] = useState(false);

  // Security PIN gate state
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    description: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    description: '',
    onSuccess: () => {}
  });

  const isOnline = useOnlineStatus();

  // Sync sound manager enabled state
  useEffect(() => {
    soundManager.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Persist students
  const handleUpdateStudent = useCallback((updatedStudent: Student, movementLog?: MovementAuditLog) => {
    setStudents(prev => {
      const next = prev.map(s => (s.id === updatedStudent.id ? updatedStudent : s));
      saveStudents(next);
      return next;
    });

    if (movementLog) {
      setLogs(prev => {
        const nextLogs = [movementLog, ...prev];
        saveLogs(nextLogs);
        return nextLogs;
      });
    }
  }, []);

  const handleAddStudent = useCallback((newStudent: Student) => {
    setStudents(prev => {
      const next = [newStudent, ...prev];
      saveStudents(next);
      return next;
    });
  }, []);

  const handleDeleteStudent = useCallback((studentId: string) => {
    setStudents(prev => {
      const next = prev.filter(s => s.id !== studentId);
      saveStudents(next);
      return next;
    });
  }, []);

  const handleBulkImport = useCallback((importedStudents: Student[]) => {
    setStudents(prev => {
      // Merge by ID or append
      const existingMap = new Map<string, Student>(prev.map(s => [s.id, s]));
      importedStudents.forEach(s => existingMap.set(s.id, s));
      const next: Student[] = Array.from(existingMap.values());
      saveStudents(next);
      return next;
    });
  }, []);

  const handleUpdateSettings = useCallback((newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleToggleSound = () => {
    const nextState = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: nextState };
    handleUpdateSettings(updated);
  };

  const handleToggleTermMode = () => {
    soundManager.playButtonClick();
    const nextTermMode: TermMode = settings.termMode === 'reopening' ? 'vacation' : 'reopening';
    const updated = {
      ...settings,
      termMode: nextTermMode,
      currentTerm: nextTermMode === 'reopening' ? 'Term 1 Reopening' : 'End-of-Term Vacation Exeat'
    };
    handleUpdateSettings(updated);
  };

  const handleResetFactoryData = useCallback(() => {
    const initialStuds = generateInitialStudents();
    const initialLgs = generateInitialAuditLogs(initialStuds);
    setStudents(initialStuds);
    saveStudents(initialStuds);
    setLogs(initialLgs);
    saveLogs(initialLgs);
    setSettings(INITIAL_SETTINGS);
    saveSettings(INITIAL_SETTINGS);
    soundManager.playCheckInChime();
  }, []);

  const handleRestoreJSON = useCallback((newStudents: Student[], newLogs: MovementAuditLog[], newSettings: SystemSettings) => {
    setStudents(newStudents);
    saveStudents(newStudents);
    setLogs(newLogs);
    saveLogs(newLogs);
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const requestPinAuth = useCallback((actionDescription: string, onSuccess: () => void) => {
    setPinModalConfig({
      isOpen: true,
      description: actionDescription,
      onSuccess
    });
  }, []);

  // When barcode is scanned
  const handleBarcodeScanned = useCallback((code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const matched = students.find(
      s => s.id.toUpperCase() === cleanCode || s.name.toUpperCase().includes(cleanCode)
    );

    if (matched) {
      soundManager.playCheckInChime();
      // Set to arrivals or departures based on current view or status
      if (currentMode === 'departures' || matched.status === 'in_dorm') {
        // Can route to active modal
      }
    } else {
      soundManager.playErrorBuzzer();
      alert(`Scanned barcode "${code}" not found in master house registry.`);
    }
  }, [students, currentMode]);

  return (
    <div className="h-[100dvh] min-h-[100dvh] flex flex-col pb-[max(12px,env(safe-area-inset-bottom))] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Sticky Header Ribbon */}
      <HeaderRibbon
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        termMode={settings.termMode}
        onToggleTermMode={handleToggleTermMode}
        students={students}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAdmin={() => {
          requestPinAuth('Access Senior Housemaster administrative controls and settings.', () => {
            setIsAdminOpen(true);
          });
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        selectedHouse={selectedHouse}
        onSelectHouse={setSelectedHouse}
        houses={INITIAL_HOUSES}
      />

      {/* Main Mode Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentMode === 'arrivals' && (
          <ArrivalDesk
            students={students}
            onUpdateStudent={handleUpdateStudent}
            onAddStudent={handleAddStudent}
            onOpenScanner={() => setIsScannerOpen(true)}
            selectedHouse={selectedHouse}
            houses={INITIAL_HOUSES}
          />
        )}

        {currentMode === 'departures' && (
          <DepartureDesk
            students={students}
            onUpdateStudent={handleUpdateStudent}
            selectedHouse={selectedHouse}
          />
        )}

        {currentMode === 'roster' && (
          <MasterRoster
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={s => handleUpdateStudent(s)}
            onDeleteStudent={handleDeleteStudent}
            onBulkImport={handleBulkImport}
            onOpenPrintRollSheet={() => setIsPrintRollSheetOpen(true)}
            onRequestPinAuth={requestPinAuth}
            selectedHouse={selectedHouse}
            houses={INITIAL_HOUSES}
          />
        )}

        {currentMode === 'analytics' && (
          <AnalyticsDesk
            students={students}
            logs={logs}
            settings={settings}
            onOpenPrintSummaryReport={() => setIsPrintSummaryReportOpen(true)}
            selectedHouse={selectedHouse}
            houses={INITIAL_HOUSES}
          />
        )}
      </main>

      {/* Offline Connectivity Banner */}
      {!isOnline && (
        <div className="no-print fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/90 border border-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-pulse">
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span>Offline Mode Active • Local SQLite/Cache records enabled</span>
        </div>
      )}

      {/* Camera QR / Barcode Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        students={students}
        onScan={handleBarcodeScanned}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Senior Housemaster Admin Settings Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        settings={settings}
        students={students}
        logs={logs}
        onUpdateSettings={handleUpdateSettings}
        onResetFactoryData={handleResetFactoryData}
        onRestoreJSON={handleRestoreJSON}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Security PIN Gate Modal */}
      <PinModal
        isOpen={pinModalConfig.isOpen}
        description={pinModalConfig.description}
        correctPin={settings.housemasterPin}
        onSuccess={pinModalConfig.onSuccess}
        onClose={() => setPinModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Help Guide Modal */}
      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Printable House Roll Sheet */}
      {isPrintRollSheetOpen && (
        <PrintRollSheet
          students={students}
          selectedHouse={selectedHouse}
          onClose={() => setIsPrintRollSheetOpen(false)}
        />
      )}

      {/* Printable House Master Executive Summary Report */}
      {isPrintSummaryReportOpen && (
        <PrintSummaryReport
          students={students}
          settings={settings}
          houses={INITIAL_HOUSES}
          onClose={() => setIsPrintSummaryReportOpen(false)}
        />
      )}
    </div>
  );
}
