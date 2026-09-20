import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle2, ShieldCheck, AlertTriangle, Phone, HeartPulse, Sparkles, Send } from 'lucide-react';
import { Student, AccompaniedType, LuggageStatus, HouseItemChecks, MovementAuditLog } from '../types';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface NewLearnerArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterStudent: (student: Student, movementLog?: MovementAuditLog) => void;
  houses: string[];
  defaultHouse?: string;
  initialName?: string;
  existingStudentCount: number;
}

export const NewLearnerArrivalModal: React.FC<NewLearnerArrivalModalProps> = ({
  isOpen,
  onClose,
  onRegisterStudent,
  houses,
  defaultHouse,
  initialName = '',
  existingStudentCount
}) => {
  // Bio-data fields
  const [name, setName] = useState(initialName);
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [studentClass, setStudentClass] = useState('Form 1 Gen Sci A');
  const [house, setHouse] = useState(
    defaultHouse && defaultHouse !== 'All Houses' ? defaultHouse : (houses[0] || 'Aggrey House')
  );
  const [room, setRoom] = useState('Dorm A-1');
  const [bedNumber, setBedNumber] = useState('Bed 1 (Lower)');
  const [town, setTown] = useState('');
  
  // Contacts & Medical
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('+233 ');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Gate Check-In toggle
  const [checkInImmediately, setCheckInImmediately] = useState(true);
  const [accompaniedBy, setAccompaniedBy] = useState<AccompaniedType>('parent');
  const [luggageStatus, setLuggageStatus] = useState<LuggageStatus>('cleared');
  const [luggageNotes, setLuggageNotes] = useState('');
  const [houseItems, setHouseItems] = useState<HouseItemChecks>({
    broom: true,
    scrubbingBrush: true,
    disinfectant: true,
    houseDuesPaid: false
  });

  // Success state for quick parent notification
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);

  // Initialize auto ID and defaults when opened
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      const generatedId = `BH-2026-F${String(existingStudentCount + 1).padStart(3, '0')}`;
      setStudentId(generatedId);
      setHouse(defaultHouse && defaultHouse !== 'All Houses' ? defaultHouse : (houses[0] || 'Aggrey House'));
      setRegisteredStudent(null);
    }
  }, [isOpen, initialName, existingStudentCount, defaultHouse, houses]);

  if (!isOpen) return null;

  const handleSaveAndCheckIn = (e: React.FormEvent, checkInNow: boolean) => {
    e.preventDefault();
    if (!name.trim()) {
      soundManager.playDefaulterBuzzer();
      return;
    }

    const timestampStr = new Date().toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const isFlagged = luggageStatus === 'flagged_withheld';

    const newStudent: Student = {
      id: studentId.trim() || `BH-2026-F${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      gender,
      class: studentClass.trim() || 'Form 1 General',
      house,
      room: room.trim() || 'Dorm 1',
      bedNumber: bedNumber.trim() || 'Bed 1',
      town: town.trim() || 'Not Specified',
      parentName: parentName.trim() || 'Parent / Guardian',
      parentPhone: parentPhone.trim() || '+233 24 000 0000',
      emergencyPhone: emergencyPhone.trim() || undefined,
      medicalNotes: medicalNotes.trim() || undefined,
      isFirstTimeReporting: true,
      status: checkInNow ? 'in_dorm' : 'pending_arrival',
      lastArrivalTimestamp: checkInNow ? timestampStr : undefined,
      houseItems: checkInNow ? houseItems : {
        broom: false,
        scrubbingBrush: false,
        disinfectant: false,
        houseDuesPaid: false
      },
      luggageInspectionNotes: (checkInNow && luggageNotes.trim()) ? luggageNotes.trim() : undefined,
      flagNotes: (checkInNow && isFlagged) ? (luggageNotes.trim() || 'Items held at gate inspection') : undefined
    };

    let auditLog: MovementAuditLog | undefined;

    if (checkInNow) {
      soundManager.playCheckInChime();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      auditLog = {
        id: `LOG-ARR-NEW-${Date.now().toString().slice(-6)}`,
        studentId: newStudent.id,
        studentName: newStudent.name,
        studentClass: newStudent.class,
        house: newStudent.house,
        room: newStudent.room,
        type: 'arrival',
        timestamp: timestampStr,
        accompaniedBy,
        luggageStatus,
        luggageNotes: luggageNotes.trim() || 'First-time reporting fresher luggage cleared at gate.',
        houseItems,
        officerName: 'Senior Housemaster',
        officerRole: 'Gate Desk Officer'
      };

      setRegisteredStudent(newStudent);
    } else {
      soundManager.playButtonClick();
    }

    onRegisterStudent(newStudent, auditLog);

    if (!checkInNow) {
      onClose();
    }
  };

  const cleanPhone = registeredStudent?.parentPhone.replace(/[^0-9]/g, '') || '';
  const whatsAppText = registeredStudent
    ? `Dear Parent, ${registeredStudent.name} (Fresher) has safely arrived and checked into ${registeredStudent.house}, Room: ${registeredStudent.room}, Bed: ${registeredStudent.bedNumber}. We welcome them warmly to the boarding house! — Housemaster.`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Manual Learner Registration</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> First-Time Reporting
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Add a new learner directly at the gate without waiting for bulk spreadsheet upload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If already registered and showing quick confirmation dispatch */}
        {registeredStudent ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                {registeredStudent.name} Successfully Checked In!
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                ID: <span className="font-mono text-emerald-400">{registeredStudent.id}</span> • House: {registeredStudent.house} • Room: {registeredStudent.room}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 max-w-md mx-auto text-left">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Instant Parent Arrival Notification
              </div>
              <p className="text-xs text-slate-300 italic mb-3">"{whatsAppText}"</p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsAppText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp to Parent</span>
                </a>
                <a
                  href={`tel:${cleanPhone}`}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Call Parent"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close & Return to Arrival Desk
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={e => handleSaveAndCheckIn(e, checkInImmediately)} className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
            {/* 1. Student Bio-Data */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3.5">
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>1. Learner Identification & Academic Placement</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Emmanuel Kofi Mensah"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Student / Admission ID</label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Class / Form</label>
                  <input
                    type="text"
                    required
                    value={studentClass}
                    onChange={e => setStudentClass(e.target.value)}
                    placeholder="e.g. Form 1 Gen Sci A"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Assigned House</label>
                  <select
                    value={house}
                    onChange={e => setHouse(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  >
                    {houses.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Home Town / Origin</label>
                  <input
                    type="text"
                    value={town}
                    onChange={e => setTown(e.target.value)}
                    placeholder="e.g. Takoradi"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Dormitory Room</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="e.g. Dorm B-2"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Bed Number</label>
                  <input
                    type="text"
                    required
                    value={bedNumber}
                    onChange={e => setBedNumber(e.target.value)}
                    placeholder="e.g. Bed 3 (Lower)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Parent & Emergency Contact */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3.5">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>2. Parent / Guardian & Emergency Contact</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="e.g. Mr. Charles Mensah"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Primary Phone (WhatsApp)</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold text-xs">Alternative / Emergency Phone</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="+233 20 000 0000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Health & Medical Notes */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4" />
                <span>3. Health, Allergies & Special Dietary Needs</span>
              </div>
              <input
                type="text"
                value={medicalNotes}
                onChange={e => setMedicalNotes(e.target.value)}
                placeholder="e.g. Asthma (carries Ventolin inhaler), Penicillin allergy, None..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            {/* 4. Gate Check-In & Sanitary Inspection Option */}
            <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-800/60 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkInImmediately}
                    onChange={e => setCheckInImmediately(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <span className="font-bold text-white text-xs sm:text-sm">
                    Perform Immediate Gate Clearance & Check-In
                  </span>
                </label>
                <span className="text-[11px] text-emerald-300 font-medium">
                  {checkInImmediately ? 'Checking in right now' : 'Save to roll only'}
                </span>
              </div>

              {checkInImmediately && (
                <div className="pt-2 border-t border-emerald-900/50 space-y-3">
                  {/* Escort / Accompanied */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1 text-xs">Accompanied By</label>
                      <select
                        value={accompaniedBy}
                        onChange={e => setAccompaniedBy(e.target.value as AccompaniedType)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                      >
                        <option value="parent">Accompanied by Parent</option>
                        <option value="guardian">Accompanied by Guardian / Relative</option>
                        <option value="public_transit_alone">Arrived Alone (Public Transit / Commercial Bus)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 text-xs">Luggage Inspection</label>
                      <select
                        value={luggageStatus}
                        onChange={e => setLuggageStatus(e.target.value as LuggageStatus)}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                          luggageStatus === 'cleared'
                            ? 'bg-slate-900 border-emerald-700 text-emerald-300'
                            : 'bg-rose-950 border-rose-600 text-rose-200'
                        }`}
                      >
                        <option value="cleared">✅ Luggage Cleared (Authorized Items Only)</option>
                        <option value="flagged_withheld">⚠️ Flagged (Prohibited Items Withheld at Gate)</option>
                      </select>
                    </div>
                  </div>

                  {luggageStatus === 'flagged_withheld' && (
                    <div>
                      <label className="text-rose-300 block mb-1 text-xs font-semibold">
                        Items Withheld & Inspection Remarks
                      </label>
                      <input
                        type="text"
                        value={luggageNotes}
                        onChange={e => setLuggageNotes(e.target.value)}
                        placeholder="e.g. Immersion heater (coil) & phone confiscated for safekeeping"
                        className="w-full px-3 py-2 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-100 text-xs"
                      />
                    </div>
                  )}

                  {/* House Items */}
                  <div>
                    <label className="text-slate-300 block mb-1 text-xs font-semibold">
                      Boarding House Items Verified
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={houseItems.broom}
                          onChange={e => setHouseItems({ ...houseItems, broom: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-emerald-500"
                        />
                        <span>🧹 Hard Broom</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={houseItems.scrubbingBrush}
                          onChange={e => setHouseItems({ ...houseItems, scrubbingBrush: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-emerald-500"
                        />
                        <span>🪥 Scrub Brush</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={houseItems.disinfectant}
                          onChange={e => setHouseItems({ ...houseItems, disinfectant: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-emerald-500"
                        />
                        <span>🧴 Disinfectant</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={houseItems.houseDuesPaid}
                          onChange={e => setHouseItems({ ...houseItems, houseDuesPaid: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-emerald-500"
                        />
                        <span>💵 House Dues</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={e => handleSaveAndCheckIn(e, false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-semibold text-xs transition"
              >
                Save to Roll Only (Pending Arrival)
              </button>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{checkInImmediately ? 'Register & Check-In Now' : 'Save Learner'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
