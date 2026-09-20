import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MessageCircle,
  Phone,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Luggage,
  X,
  User,
  ExternalLink,
  Filter,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, AccompaniedType, LuggageStatus, HouseItemChecks, MovementAuditLog } from '../types';
import { soundManager } from '../utils/audio';
import { NewLearnerArrivalModal } from './NewLearnerArrivalModal';

interface ArrivalDeskProps {
  students: Student[];
  onUpdateStudent: (student: Student, movementLog?: MovementAuditLog) => void;
  onAddStudent: (student: Student, movementLog?: MovementAuditLog) => void;
  onOpenScanner: () => void;
  selectedHouse: string;
  houses: string[];
}

export const ArrivalDesk: React.FC<ArrivalDeskProps> = ({
  students,
  onUpdateStudent,
  onAddStudent,
  onOpenScanner,
  selectedHouse,
  houses
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'arrived' | 'flagged'>('pending');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [isNewLearnerModalOpen, setIsNewLearnerModalOpen] = useState(false);
  const [newLearnerInitialName, setNewLearnerInitialName] = useState('');

  // Check-In Form State inside Modal
  const [accompaniedBy, setAccompaniedBy] = useState<AccompaniedType>('parent');
  const [luggageStatus, setLuggageStatus] = useState<LuggageStatus>('cleared');
  const [luggageNotes, setLuggageNotes] = useState('');
  const [houseItems, setHouseItems] = useState<HouseItemChecks>({
    broom: false,
    scrubbingBrush: false,
    disinfectant: false,
    houseDuesPaid: false
  });
  const [timestampStr, setTimestampStr] = useState('');

  // Filter students based on selected house & search & tab
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // House filter
      if (selectedHouse !== 'All Houses' && s.house !== selectedHouse) {
        return false;
      }

      // Tab filter
      if (filterTab === 'pending' && s.status === 'in_dorm') return false;
      if (filterTab === 'arrived' && s.status !== 'in_dorm') return false;
      if (filterTab === 'flagged' && !s.luggageInspectionNotes && s.status !== 'flagged') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q) ||
        s.house.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      );
    });
  }, [students, selectedHouse, filterTab, searchQuery]);

  const openCheckInModal = (student: Student) => {
    soundManager.playButtonClick();
    setActiveStudent(student);
    setAccompaniedBy('parent');
    setLuggageStatus(student.luggageInspectionNotes ? 'flagged_withheld' : 'cleared');
    setLuggageNotes(student.luggageInspectionNotes || '');
    setHouseItems(student.houseItems || {
      broom: false,
      scrubbingBrush: false,
      disinfectant: false,
      houseDuesPaid: false
    });
    const now = new Date();
    setTimestampStr(
      now.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    );
  };

  const handleConfirmArrival = () => {
    if (!activeStudent) return;

    soundManager.playCheckInChime();

    // Trigger celebratory confetti effect
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });

    const isFlagged = luggageStatus === 'flagged_withheld';
    const updatedStudent: Student = {
      ...activeStudent,
      status: 'in_dorm',
      lastArrivalTimestamp: timestampStr,
      houseItems,
      luggageInspectionNotes: luggageNotes.trim() || undefined,
      flagNotes: isFlagged ? (luggageNotes || 'Items withheld at gate') : undefined
    };

    const auditLog: MovementAuditLog = {
      id: `LOG-ARR-${Date.now().toString().slice(-6)}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      studentClass: activeStudent.class,
      house: activeStudent.house,
      room: activeStudent.room,
      type: 'arrival',
      timestamp: timestampStr,
      accompaniedBy,
      luggageStatus,
      luggageNotes: luggageNotes.trim() || 'Luggage cleared without incident.',
      houseItems,
      officerName: 'Senior Housemaster',
      officerRole: 'Gate Desk Officer'
    };

    onUpdateStudent(updatedStudent, auditLog);
    setActiveStudent(null);
  };

  const generateWhatsAppUrl = (student: Student, timeStr: string, luggageState: LuggageStatus) => {
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const luggageText = luggageState === 'cleared' ? 'Luggage cleared.' : 'Luggage flagged / Items held for inspection.';
    const text = `Dear Parent, ${student.name} has safely arrived at ${student.house} on ${timeStr}. ${luggageText} — Housemaster.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const generateSmsUrl = (student: Student, timeStr: string, luggageState: LuggageStatus) => {
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const luggageText = luggageState === 'cleared' ? 'Luggage cleared.' : 'Luggage flagged / Items held for inspection.';
    const body = `Dear Parent, ${student.name} has safely arrived at ${student.house} on ${timeStr}. ${luggageText} — Housemaster.`;
    return `sms:${cleanPhone}?body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-3 sm:p-5">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Typeahead Search: Student ID, Name, Class, Dorm Room..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Manual Entry for First-Time Reporting */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setNewLearnerInitialName(searchQuery);
              setIsNewLearnerModalOpen(true);
            }}
            title="Register a fresher or first-time reporting learner directly at the gate"
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-teal-950/40 transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>➕ First-Time Arrival (Manual Entry)</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setFilterTab('pending');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Pending Check-In ({students.filter(s => s.status !== 'in_dorm').length})
          </button>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setFilterTab('arrived');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterTab === 'arrived'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Arrived In Dorm ({students.filter(s => s.status === 'in_dorm').length})
          </button>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setFilterTab('flagged');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterTab === 'flagged'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Flagged / Notes
          </button>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setFilterTab('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterTab === 'all'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All Students ({students.length})
          </button>
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredStudents.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
            <UserCheck className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              {searchQuery ? `No learner found matching "${searchQuery}"` : 'No student records found'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
              {searchQuery
                ? 'This learner might be reporting for the first time and not yet in the master roster. You can manually register and clear them right now.'
                : 'Try adjusting your search keywords, house selection, or register a first-time learner manually.'}
            </p>
            <button
              onClick={() => {
                soundManager.playButtonClick();
                setNewLearnerInitialName(searchQuery);
                setIsNewLearnerModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-teal-950/50 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register {searchQuery ? `"${searchQuery}"` : 'New Learner'} Manually</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredStudents.map(student => {
              const isInDorm = student.status === 'in_dorm';
              const isCheckedOut = student.status === 'checked_out';
              const isFlagged = !!student.luggageInspectionNotes;

              return (
                <div
                  key={student.id}
                  className={`rounded-2xl border p-4 bg-slate-900/90 transition-all hover:border-slate-600 flex flex-col justify-between ${
                    isInDorm
                      ? 'border-emerald-900/50 shadow-sm shadow-emerald-950/20'
                      : isFlagged
                      ? 'border-rose-800/60 bg-rose-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header with Photo Avatar and Status Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 border ${
                            isInDorm
                              ? 'bg-emerald-900/70 border-emerald-600/60 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate leading-snug">
                            {student.name}
                          </h4>
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/40">
                            {student.id}
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isInDorm
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isCheckedOut
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isInDorm ? 'In Dorm' : isCheckedOut ? 'Vacated' : 'Pending'}
                      </span>
                    </div>

                    {/* Academic & Dorm Details */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300 mb-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 font-medium">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Class</span>
                        <span className="truncate block">{student.class}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">House</span>
                        <span className="truncate block text-teal-400">{student.house}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Room</span>
                        <span className="truncate block">{student.room}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Bed</span>
                        <span className="truncate block text-amber-300">{student.bedNumber}</span>
                      </div>
                    </div>

                    {/* Luggage Note if Flagged */}
                    {student.luggageInspectionNotes && (
                      <div className="mb-3 flex items-start gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                        <span className="line-clamp-2">{student.luggageInspectionNotes}</span>
                      </div>
                    )}

                    {/* Arrival Timestamp if checked in */}
                    {student.lastArrivalTimestamp && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>Arrived: {student.lastArrivalTimestamp}</span>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCheckInModal(student)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        isInDorm
                          ? 'bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-700/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isInDorm ? 'Review / Edit Arrival' : 'Check-In Student'}</span>
                    </button>

                    {/* Quick WhatsApp Link to Parent */}
                    <a
                      href={generateWhatsAppUrl(student, student.lastArrivalTimestamp || 'today', student.luggageInspectionNotes ? 'flagged_withheld' : 'cleared')}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Send WhatsApp Arrival Confirmation"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Check-In Modal / Card */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Reopening Arrival Verification</h3>
                  <p className="text-xs text-slate-400">Gate roll-call clearance &amp; luggage audit</p>
                </div>
              </div>
              <button
                onClick={() => setActiveStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Student Bio Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-bold text-white text-lg shadow-inner shrink-0">
                  {activeStudent.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-white truncate">{activeStudent.name}</h4>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                      {activeStudent.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeStudent.class} • <span className="text-teal-400">{activeStudent.house}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Room: <strong className="text-slate-200">{activeStudent.room}</strong> • Bed: <strong className="text-amber-300">{activeStudent.bedNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Timestamp auto-captured */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Auto-Captured Gate Timestamp:
                </span>
                <span className="font-mono font-semibold text-emerald-300">{timestampStr}</span>
              </div>

              {/* Accompanied By Checks */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Accompanied By
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['parent', 'guardian', 'public_transit_alone'] as AccompaniedType[]).map(type => {
                    const label = type === 'parent' ? 'Parent' : type === 'guardian' ? 'Guardian' : 'Public / Alone';
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          soundManager.playButtonClick();
                          setAccompaniedBy(type);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                          accompaniedBy === type
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Luggage Inspection Form */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Luggage className="w-4 h-4 text-teal-400" />
                    Luggage Inspection Status
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playButtonClick();
                        setLuggageStatus('cleared');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        luggageStatus === 'cleared'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Cleared
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playErrorBuzzer();
                        setLuggageStatus('flagged_withheld');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        luggageStatus === 'flagged_withheld'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Flagged / Withheld
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={luggageNotes}
                  onChange={e => setLuggageNotes(e.target.value)}
                  placeholder={luggageStatus === 'cleared' ? 'Inspection notes (optional)' : 'Reason: Unauthorized electronics, contraband, meds withheld...'}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* House Items & Dues Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Mandatory House Items &amp; Dues
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={houseItems.broom}
                      onChange={e => {
                        soundManager.playButtonClick();
                        setHouseItems(prev => ({ ...prev, broom: e.target.checked }));
                      }}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-800"
                    />
                    <span>Broom Supplied 🧹</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={houseItems.scrubbingBrush}
                      onChange={e => {
                        soundManager.playButtonClick();
                        setHouseItems(prev => ({ ...prev, scrubbingBrush: e.target.checked }));
                      }}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-800"
                    />
                    <span>Scrubbing Brush 🪥</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={houseItems.disinfectant}
                      onChange={e => {
                        soundManager.playButtonClick();
                        setHouseItems(prev => ({ ...prev, disinfectant: e.target.checked }));
                      }}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-800"
                    />
                    <span>Disinfectant 🧴</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={houseItems.houseDuesPaid}
                      onChange={e => {
                        soundManager.playButtonClick();
                        setHouseItems(prev => ({ ...prev, houseDuesPaid: e.target.checked }));
                      }}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-800"
                    />
                    <span className="font-semibold text-emerald-400">House Dues Paid 💵</span>
                  </label>
                </div>
              </div>

              {/* Primary Parent Contact & Notification Preview */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Primary Parent / Guardian</span>
                  <p className="text-xs font-semibold text-white truncate">{activeStudent.parentName}</p>
                  <p className="text-xs font-mono text-emerald-400">{activeStudent.parentPhone}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={generateWhatsAppUrl(activeStudent, timestampStr, luggageStatus)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={generateSmsUrl(activeStudent, timestampStr, luggageStatus)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>SMS</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleConfirmArrival}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>🟢 Confirm Arrival &amp; Check-In</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStudent(null)}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-Time Learner Manual Registration & Gate Clearance Modal */}
      <NewLearnerArrivalModal
        isOpen={isNewLearnerModalOpen}
        onClose={() => setIsNewLearnerModalOpen(false)}
        onRegisterStudent={onAddStudent}
        houses={houses}
        defaultHouse={selectedHouse}
        initialName={newLearnerInitialName}
        existingStudentCount={students.length}
      />
    </div>
  );
};
