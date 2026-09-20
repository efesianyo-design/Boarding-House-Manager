import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Upload,
  Printer,
  Download,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  X,
  FileSpreadsheet,
  ArrowUpDown,
  Filter,
  HeartPulse,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { Student, DormStatus } from '../types';
import { soundManager } from '../utils/audio';
import { exportMasterRollCSV, parseStudentsCSV, downloadCSVTemplate } from '../utils/storage';

interface MasterRosterProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onBulkImport: (students: Student[]) => void;
  onOpenPrintRollSheet: () => void;
  onRequestPinAuth: (actionDescription: string, callback: () => void) => void;
  selectedHouse: string;
  houses: string[];
}

export const MasterRoster: React.FC<MasterRosterProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkImport,
  onOpenPrintRollSheet,
  onRequestPinAuth,
  selectedHouse,
  houses
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'id' | 'name' | 'class' | 'room' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Add / Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'M' | 'F'>('M');
  const [formClass, setFormClass] = useState('Form 1 Gen Sci A');
  const [formHouse, setFormHouse] = useState(houses[0] || 'Aggrey House');
  const [formRoom, setFormRoom] = useState('Dorm A-1');
  const [formBed, setFormBed] = useState('Bed 1 (Lower)');
  const [formTown, setFormTown] = useState('Accra - Madina');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('+233 24 000 0000');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formMedicalNotes, setFormMedicalNotes] = useState('');
  const [formIsFirstTime, setFormIsFirstTime] = useState(true);
  const [formStatus, setFormStatus] = useState<DormStatus>('pending_arrival');

  // CSV file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter & Sort
  const displayedStudents = useMemo(() => {
    let result = students.filter(s => {
      if (selectedHouse !== 'All Houses' && s.house !== selectedHouse) {
        return false;
      }
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.town.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, selectedHouse, statusFilter, searchQuery, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    soundManager.playButtonClick();
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const openAddModal = () => {
    soundManager.playButtonClick();
    setEditingStudent(null);
    setFormId(`BH-2026-F${String(students.length + 1).padStart(3, '0')}`);
    setFormName('');
    setFormGender('M');
    setFormClass('Form 1 Gen Sci A');
    setFormHouse(selectedHouse !== 'All Houses' ? selectedHouse : (houses[0] || 'Aggrey House'));
    setFormRoom('Dorm A-1');
    setFormBed('Bed 1 (Lower)');
    setFormTown('Accra');
    setFormParentName('');
    setFormParentPhone('+233 24 ');
    setFormEmergencyPhone('');
    setFormMedicalNotes('');
    setFormIsFirstTime(true);
    setFormStatus('pending_arrival');
    setIsAddModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    soundManager.playButtonClick();
    setEditingStudent(student);
    setFormId(student.id);
    setFormName(student.name);
    setFormGender(student.gender);
    setFormClass(student.class);
    setFormHouse(student.house);
    setFormRoom(student.room);
    setFormBed(student.bedNumber);
    setFormTown(student.town);
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentPhone);
    setFormEmergencyPhone(student.emergencyPhone || '');
    setFormMedicalNotes(student.medicalNotes || '');
    setFormIsFirstTime(student.isFirstTimeReporting ?? student.id.includes('-F'));
    setFormStatus(student.status);
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formId.trim()) return;

    soundManager.playCheckInChime();

    const studentData: Student = {
      id: formId.trim(),
      name: formName.trim(),
      gender: formGender,
      class: formClass.trim(),
      house: formHouse,
      room: formRoom.trim(),
      bedNumber: formBed.trim(),
      town: formTown.trim(),
      parentName: formParentName.trim() || 'Parent / Guardian',
      parentPhone: formParentPhone.trim(),
      emergencyPhone: formEmergencyPhone.trim() || undefined,
      medicalNotes: formMedicalNotes.trim() || undefined,
      isFirstTimeReporting: formIsFirstTime,
      status: formStatus,
      houseItems: editingStudent?.houseItems || {
        broom: false,
        scrubbingBrush: false,
        disinfectant: false,
        houseDuesPaid: false
      },
      lastArrivalTimestamp: editingStudent?.lastArrivalTimestamp,
      lastDepartureTimestamp: editingStudent?.lastDepartureTimestamp,
      luggageInspectionNotes: editingStudent?.luggageInspectionNotes
    };

    if (editingStudent) {
      onUpdateStudent(studentData);
    } else {
      onAddStudent(studentData);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteWithAuth = (student: Student) => {
    soundManager.playButtonClick();
    onRequestPinAuth(
      `Delete student record "${student.name}" (${student.id}) from the master house roll.`,
      () => {
        onDeleteStudent(student.id);
      }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseStudentsCSV(text);
        if (parsed.length > 0) {
          onRequestPinAuth(
            `Import ${parsed.length} student records from CSV spreadsheet.`,
            () => {
              onBulkImport(parsed);
              soundManager.playCheckInChime();
            }
          );
        } else {
          soundManager.playErrorBuzzer();
          alert('Could not parse any valid student records from the CSV file.');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-3 sm:p-5">
      {/* Action Controls Header */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Roster: Student Name, ID, Class, Room, Town, Parent Phone..."
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

        {/* Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="in_dorm">In Dormitory Only</option>
            <option value="checked_out">Checked Out Only</option>
            <option value="pending_arrival">Pending Arrival Only</option>
          </select>

          {/* Add Learner Manually */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Learner (Manual)</span>
          </button>

          {/* Download CSV Template */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              downloadCSVTemplate();
            }}
            title="Download formatted CSV template for bulk student registration"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">CSV Template</span>
            <span className="sm:hidden">Template</span>
          </button>

          {/* Upload CSV */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,text/csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Bulk import spreadsheet columns (id, name, class, house, room, parentName, parentPhone, town)"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Bulk Upload</span>
          </button>

          {/* Print House Roll Sheet */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onOpenPrintRollSheet();
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Roll Sheet</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              exportMasterRollCSV(displayedStudents);
            }}
            title="Export current table to CSV"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-950/80 sticky top-0 z-10 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('id')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Student ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Full Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('class')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Class &amp; House</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('room')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Room / Bed</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">House Items</th>
              <th className="py-3 px-4">Parent Contact</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {displayedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No student records match the search or filter criteria.
                </td>
              </tr>
            ) : (
              displayedStudents.map(student => {
                const isInDorm = student.status === 'in_dorm';
                const isCheckedOut = student.status === 'checked_out';
                const cleanPhone = student.parentPhone.replace(/[^0-9+]/g, '');

                return (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {student.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white">{student.name}</span>
                        {(student.isFirstTimeReporting || student.id.includes('-F')) && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                            Fresher
                          </span>
                        )}
                        {student.medicalNotes && (
                          <span
                            title={`Medical / Dietary: ${student.medicalNotes}`}
                            className="inline-flex items-center text-rose-400 cursor-help"
                          >
                            <HeartPulse className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{student.town}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{student.class}</div>
                      <div className="text-[11px] text-teal-400">{student.house}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{student.room}</div>
                      <div className="text-[11px] text-amber-400">{student.bedNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          isInDorm
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isCheckedOut
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isInDorm ? 'In Dorm' : isCheckedOut ? 'Checked Out' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span title="Broom" className={student.houseItems.broom ? 'opacity-100' : 'opacity-25 grayscale'}>🧹</span>
                        <span title="Scrubbing Brush" className={student.houseItems.scrubbingBrush ? 'opacity-100' : 'opacity-25 grayscale'}>🪥</span>
                        <span title="Disinfectant" className={student.houseItems.disinfectant ? 'opacity-100' : 'opacity-25 grayscale'}>🧴</span>
                        <span title="Dues Paid" className={student.houseItems.houseDuesPaid ? 'text-emerald-400 font-bold' : 'text-slate-600'}>💵</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 truncate max-w-[130px]">{student.parentName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-400">{student.parentPhone}</span>
                        {/* Quick Call Button with tel: link */}
                        <a
                          href={`tel:${cleanPhone}`}
                          title={`Direct Call Parent (${cleanPhone})`}
                          className="p-1 rounded bg-emerald-950/70 text-emerald-400 hover:bg-emerald-800/70 border border-emerald-800/40 transition"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(student)}
                          title="Edit Student Bio-Data"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWithAuth(student)}
                          title="Delete Record (Protected by PIN)"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingStudent ? 'Edit Student Bio-Data' : 'Add Single Student to Master Roll'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Student ID</label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={e => setFormId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Gender</label>
                  <select
                    value={formGender}
                    onChange={e => setFormGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-xs">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Class / Form</label>
                  <input
                    type="text"
                    required
                    value={formClass}
                    onChange={e => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">House</label>
                  <select
                    value={formHouse}
                    onChange={e => setFormHouse(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    {houses.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Dorm Room</label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={e => setFormRoom(e.target.value)}
                    placeholder="e.g. Dorm A-2"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Bed Number</label>
                  <input
                    type="text"
                    required
                    value={formBed}
                    onChange={e => setFormBed(e.target.value)}
                    placeholder="e.g. Bed 3 (Lower)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-xs">Home Town / Destination</label>
                <input
                  type="text"
                  required
                  value={formTown}
                  onChange={e => setFormTown(e.target.value)}
                  placeholder="e.g. Accra - Madina"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={e => setFormParentName(e.target.value)}
                    placeholder="e.g. Mr. Mensah"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Primary Phone (WhatsApp)</label>
                  <input
                    type="text"
                    value={formParentPhone}
                    onChange={e => setFormParentPhone(e.target.value)}
                    placeholder="+233 24 555 0000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Emergency / Alt Phone</label>
                  <input
                    type="text"
                    value={formEmergencyPhone}
                    onChange={e => setFormEmergencyPhone(e.target.value)}
                    placeholder="e.g. +233 20 111 2222"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-xs">Current Dorm Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as DormStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="pending_arrival">Pending Arrival</option>
                    <option value="in_dorm">In Dormitory</option>
                    <option value="checked_out">Checked Out / Vacated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-xs">
                  Medical Conditions, Allergies or Dietary Notes
                </label>
                <input
                  type="text"
                  value={formMedicalNotes}
                  onChange={e => setFormMedicalNotes(e.target.value)}
                  placeholder="e.g. Mild Asthma, Nut allergy, None..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsFirstTime}
                    onChange={e => setFormIsFirstTime(e.target.checked)}
                    className="w-4 h-4 rounded accent-teal-500"
                  />
                  <span className="text-xs text-slate-200 font-semibold">
                    First-Time Reporting Learner (Fresher / New Admission)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition"
                >
                  {editingStudent ? 'Save Changes' : 'Add Student to Roll'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
