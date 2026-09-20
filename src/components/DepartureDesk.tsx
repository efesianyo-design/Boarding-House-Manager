import React, { useState, useMemo } from 'react';
import {
  Search,
  LogOut,
  Key,
  Sparkles,
  FileCheck2,
  Phone,
  MessageCircle,
  Send,
  CheckCircle,
  X,
  MapPin,
  ShieldCheck,
  Clock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Student, EscortIdType, MovementAuditLog } from '../types';
import { soundManager } from '../utils/audio';

interface DepartureDeskProps {
  students: Student[];
  onUpdateStudent: (student: Student, movementLog?: MovementAuditLog) => void;
  selectedHouse: string;
}

export const DepartureDesk: React.FC<DepartureDeskProps> = ({
  students,
  onUpdateStudent,
  selectedHouse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'eligible' | 'departed' | 'all'>('eligible');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Clearance Form State inside Modal
  const [destinationTown, setDestinationTown] = useState('');
  const [escortName, setEscortName] = useState('');
  const [escortIdType, setEscortIdType] = useState<EscortIdType>('ghana_card');
  const [escortPhone, setEscortPhone] = useState('');
  const [keySurrendered, setKeySurrendered] = useState(true);
  const [roomCleaned, setRoomCleaned] = useState(true);
  const [formMasterSigned, setFormMasterSigned] = useState(true);
  const [timestampStr, setTimestampStr] = useState('');

  // Filter students based on selected house & status & search
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // House filter
      if (selectedHouse !== 'All Houses' && s.house !== selectedHouse) {
        return false;
      }

      // Tab filter: 'eligible' means currently in_dorm; 'departed' means checked_out
      if (activeTab === 'eligible' && s.status !== 'in_dorm') return false;
      if (activeTab === 'departed' && s.status !== 'checked_out') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q) ||
        s.town.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      );
    });
  }, [students, selectedHouse, activeTab, searchQuery]);

  const openClearanceModal = (student: Student) => {
    soundManager.playButtonClick();
    setSelectedStudent(student);
    setDestinationTown(student.town || 'Accra - Madina');
    setEscortName(student.parentName || '');
    setEscortIdType('ghana_card');
    setEscortPhone(student.parentPhone || '');
    setKeySurrendered(true);
    setRoomCleaned(true);
    setFormMasterSigned(true);

    const now = new Date();
    setTimestampStr(
      now.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    );
  };

  const handleAuthorizeDeparture = () => {
    if (!selectedStudent) return;

    soundManager.playDepartureClick();

    const updatedStudent: Student = {
      ...selectedStudent,
      status: 'checked_out',
      lastDepartureTimestamp: timestampStr,
      town: destinationTown
    };

    const auditLog: MovementAuditLog = {
      id: `LOG-DEP-${Date.now().toString().slice(-6)}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.class,
      house: selectedStudent.house,
      room: selectedStudent.room,
      type: 'departure',
      timestamp: timestampStr,
      destinationTown,
      escortName: escortName || 'Self / Transit',
      escortIdType,
      escortPhone,
      keySurrendered,
      roomCleaned,
      formMasterSigned,
      officerName: 'Senior Housemaster',
      officerRole: 'Vacation Clearance Desk'
    };

    onUpdateStudent(updatedStudent, auditLog);
    setSelectedStudent(null);
  };

  const generateDepartureWhatsAppUrl = (student: Student, dest: string, timeStr: string, escort: string) => {
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const text = `Dear Parent, ${student.name} has officially vacated ${student.house} today at ${timeStr} heading to ${dest}. Escort: ${escort || 'Self'}. — Housemaster.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const generateDepartureSmsUrl = (student: Student, dest: string, timeStr: string, escort: string) => {
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const body = `Dear Parent, ${student.name} has officially vacated ${student.house} today at ${timeStr} heading to ${dest}. Escort: ${escort || 'Self'}. — Housemaster.`;
    return `sms:${cleanPhone}?body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-3 sm:p-5">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Departure Queue: Student ID, Name, Town, Dorm Room..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('eligible');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'eligible'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            In Dorm Ready for Exit ({students.filter(s => s.status === 'in_dorm').length})
          </button>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('departed');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'departed'
                ? 'bg-slate-700 text-slate-200 border border-slate-600'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Checked Out / Vacated ({students.filter(s => s.status === 'checked_out').length})
          </button>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'all'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All ({students.length})
          </button>
        </div>
      </div>

      {/* Student Cards Queue */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredStudents.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
            <LogOut className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No students in departure queue</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All students in this house may have already vacated or search filter returned zero matches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredStudents.map(student => {
              const isCheckedOut = student.status === 'checked_out';

              return (
                <div
                  key={student.id}
                  className={`rounded-2xl border p-4 bg-slate-900/90 transition-all hover:border-slate-600 flex flex-col justify-between ${
                    isCheckedOut
                      ? 'border-slate-800 opacity-80'
                      : 'border-amber-900/40 shadow-sm shadow-amber-950/20'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center font-bold text-sm text-white shrink-0">
                          {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate leading-snug">
                            {student.name}
                          </h4>
                          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/40">
                            {student.id}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isCheckedOut
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isCheckedOut ? 'Vacated' : 'In Dorm'}
                      </span>
                    </div>

                    {/* Room and Town Details */}
                    <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-xs mb-3 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[10px] text-slate-500 uppercase">Dormitory</span>
                        <span className="font-medium text-white">{student.house} • {student.room}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          Destination
                        </span>
                        <span className="font-semibold text-amber-300 truncate max-w-[140px]">{student.town}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[10px] text-slate-500 uppercase">Primary Escort</span>
                        <span className="truncate max-w-[140px] text-slate-300">{student.parentName}</span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    {student.lastDepartureTimestamp && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Vacated: {student.lastDepartureTimestamp}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openClearanceModal(student)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        isCheckedOut
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                          : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/40'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isCheckedOut ? 'Review Clearance' : 'Clear & Check-Out'}</span>
                    </button>

                    <a
                      href={generateDepartureWhatsAppUrl(student, student.town, student.lastDepartureTimestamp || 'today', student.parentName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Send Departure WhatsApp Notification"
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

      {/* Departure Verification Card Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Vacation &amp; Exeat Clearance Desk</h3>
                  <p className="text-xs text-slate-400">Authorized departure gate release verification</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Student Summary */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center font-bold text-white text-lg shrink-0">
                  {selectedStudent.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-white truncate">{selectedStudent.name}</h4>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                      {selectedStudent.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedStudent.class} • <span className="text-teal-400">{selectedStudent.house}</span> • {selectedStudent.room}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Current Status: <span className="text-emerald-400 font-semibold">{selectedStudent.status === 'in_dorm' ? 'In Dormitory' : 'Already Checked Out'}</span>
                  </p>
                </div>
              </div>

              {/* Destination Town/City */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Destination Town / City
                </label>
                <input
                  type="text"
                  value={destinationTown}
                  onChange={e => setDestinationTown(e.target.value)}
                  placeholder="e.g. Accra - Madina, Kumasi - Bantama, Ho"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Parent / Escort Pickup Verification */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  Escort / Pickup Verification
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Escort Full Name</label>
                    <input
                      type="text"
                      value={escortName}
                      onChange={e => setEscortName(e.target.value)}
                      placeholder="e.g. Mr. Kwame Mensah / Self"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Escort Phone Number</label>
                    <input
                      type="text"
                      value={escortPhone}
                      onChange={e => setEscortPhone(e.target.value)}
                      placeholder="+233 24 555 0000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ID Verification Document</label>
                  <select
                    value={escortIdType}
                    onChange={e => setEscortIdType(e.target.value as EscortIdType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ghana_card">National ID / Ghana Card Verified</option>
                    <option value="drivers_license">Driver's License Verified</option>
                    <option value="voter_id">Voter ID Card Verified</option>
                    <option value="passport">Passport Verified</option>
                    <option value="student_self">Self Clearance (Public Transit / Alone)</option>
                    <option value="other">Other Official Document</option>
                  </select>
                </div>
              </div>

              {/* Clearance Verification Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Clearance Verification Checklist
                </label>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                  <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keySurrendered}
                      onChange={e => {
                        soundManager.playButtonClick();
                        setKeySurrendered(e.target.checked);
                      }}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 bg-slate-800"
                    />
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dormitory Room Key Surrendered to Housemaster</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomCleaned}
                      onChange={e => {
                        soundManager.playButtonClick();
                        setRoomCleaned(e.target.checked);
                      }}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 bg-slate-800"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Cubicle / Bunk Left Swept, Clean &amp; Free of Litter</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formMasterSigned}
                      onChange={e => {
                        soundManager.playButtonClick();
                        setFormMasterSigned(e.target.checked);
                      }}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 bg-slate-800"
                    />
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Form Master / House Tutor Signature Endorsed</span>
                  </label>
                </div>
              </div>

              {/* Timestamp preview */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Authorized Exit Timestamp:
                </span>
                <span className="font-mono font-semibold text-amber-300">{timestampStr}</span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleAuthorizeDeparture}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/60 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>⚪ Authorize Departure &amp; Check-Out</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={generateDepartureWhatsAppUrl(selectedStudent, destinationTown, timestampStr, escortName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial py-3 px-3.5 rounded-xl bg-emerald-700/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Alert Parent (WA)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
