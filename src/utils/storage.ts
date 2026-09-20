import { Student, MovementAuditLog, SystemSettings } from '../types';
import { generateInitialStudents, generateInitialAuditLogs, INITIAL_SETTINGS } from './initialData';

const STORAGE_KEYS = {
  STUDENTS: 'bh_mgmt_students_v1',
  LOGS: 'bh_mgmt_audit_logs_v1',
  SETTINGS: 'bh_mgmt_settings_v1',
  BACKUP: 'bh_mgmt_auto_backup_v1'
};

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      const initial = generateInitialStudents();
      saveStudents(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading students from localStorage:', err);
    return generateInitialStudents();
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    // Trigger auto-backup copy
    createAutoBackup(students);
  } catch (err) {
    console.error('Error saving students to localStorage:', err);
  }
}

export function loadLogs(): MovementAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      const initialStudents = loadStudents();
      const initial = generateInitialAuditLogs(initialStudents);
      saveLogs(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading logs from localStorage:', err);
    return [];
  }
}

export function saveLogs(logs: MovementAuditLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving logs to localStorage:', err);
  }
}

export function loadSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading settings from localStorage:', err);
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}

function createAutoBackup(students: Student[]): void {
  try {
    const backupPayload = {
      timestamp: new Date().toISOString(),
      studentCount: students.length,
      data: students
    };
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backupPayload));
  } catch {
    // quota exceeded or silent
  }
}

// JSON Database Export
export function exportFullDatabaseJSON(students: Student[], logs: MovementAuditLog[], settings: SystemSettings): void {
  const payload = {
    app: 'Boarding House Arrival & Departure Management Studio',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    settings,
    students,
    logs
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Boarding_House_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Movement Audit Log to CSV
export function exportMovementAuditLogCSV(logs: MovementAuditLog[]): void {
  const headers = [
    'Log ID',
    'Timestamp',
    'Movement Type',
    'Student ID',
    'Student Name',
    'Class',
    'House',
    'Room',
    'Accompanied By / Escort',
    'Destination Town',
    'Luggage Status',
    'Officer In Charge'
  ];

  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.type.toUpperCase()}"`,
    `"${l.studentId}"`,
    `"${l.studentName}"`,
    `"${l.studentClass}"`,
    `"${l.house}"`,
    `"${l.room}"`,
    `"${l.type === 'arrival' ? (l.accompaniedBy || 'N/A') : (l.escortName || 'N/A')}"`,
    `"${l.destinationTown || 'N/A'}"`,
    `"${l.luggageStatus || 'cleared'}"`,
    `"${l.officerName}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Movement_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Master Student Registry to CSV
export function exportMasterRollCSV(students: Student[]): void {
  const headers = [
    'Student ID',
    'Full Name',
    'Gender',
    'Class',
    'House',
    'Room',
    'Bed Number',
    'Current Status',
    'Home Town',
    'Parent/Guardian Name',
    'Parent Phone',
    'Broom',
    'Scrubbing Brush',
    'Disinfectant',
    'House Dues Paid',
    'Last Movement'
  ];

  const rows = students.map(s => [
    `"${s.id}"`,
    `"${s.name}"`,
    `"${s.gender}"`,
    `"${s.class}"`,
    `"${s.house}"`,
    `"${s.room}"`,
    `"${s.bedNumber}"`,
    `"${s.status.toUpperCase()}"`,
    `"${s.town}"`,
    `"${s.parentName}"`,
    `"${s.parentPhone}"`,
    `"${s.houseItems.broom ? 'YES' : 'NO'}"`,
    `"${s.houseItems.scrubbingBrush ? 'YES' : 'NO'}"`,
    `"${s.houseItems.disinfectant ? 'YES' : 'NO'}"`,
    `"${s.houseItems.houseDuesPaid ? 'YES' : 'NO'}"`,
    `"${s.lastArrivalTimestamp || s.lastDepartureTimestamp || 'None'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Master_House_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse CSV Bulk Import
export function parseStudentsCSV(csvText: string): Student[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(s => s.replace(/^"|"$/g, '').trim());
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Find column indices with fallback heuristics
  const idIdx = headers.findIndex(h => h.includes('id'));
  const nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('parent'));
  const genderIdx = headers.findIndex(h => h.includes('gender') || h.includes('sex'));
  const classIdx = headers.findIndex(h => h.includes('class') || h.includes('form') || h.includes('grade'));
  const houseIdx = headers.findIndex(h => h.includes('house') || h.includes('hall'));
  const roomIdx = headers.findIndex(h => h.includes('room') || h.includes('dorm'));
  const bedIdx = headers.findIndex(h => h.includes('bed'));
  const parentNameIdx = headers.findIndex(h => h.includes('parent') || h.includes('guardian'));
  const parentPhoneIdx = headers.findIndex(h => (h.includes('phone') || h.includes('contact') || h.includes('mobile')) && !h.includes('emergency'));
  const emergencyPhoneIdx = headers.findIndex(h => h.includes('emergency') || h.includes('altphone'));
  const medicalIdx = headers.findIndex(h => h.includes('medical') || h.includes('allergy') || h.includes('health'));
  const townIdx = headers.findIndex(h => h.includes('town') || h.includes('city') || h.includes('destination'));

  const parsedStudents: Student[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length < 2) continue;

    const studentId = (idIdx !== -1 && cols[idIdx]) ? cols[idIdx] : `BH-${Date.now().toString().slice(-4)}-${i}`;
    const name = (nameIdx !== -1 && cols[nameIdx]) ? cols[nameIdx] : `Student ${i}`;
    const rawGender = (genderIdx !== -1 && cols[genderIdx]) ? cols[genderIdx].toUpperCase() : 'M';
    const gender: 'M' | 'F' = rawGender.startsWith('F') ? 'F' : 'M';
    const studentClass = (classIdx !== -1 && cols[classIdx]) ? cols[classIdx] : 'Form 1 General';
    const house = (houseIdx !== -1 && cols[houseIdx]) ? cols[houseIdx] : 'Aggrey House';
    const room = (roomIdx !== -1 && cols[roomIdx]) ? cols[roomIdx] : 'Dorm A-1';
    const bedNumber = (bedIdx !== -1 && cols[bedIdx]) ? cols[bedIdx] : 'Bed 1 (Lower)';
    const parentName = (parentNameIdx !== -1 && cols[parentNameIdx]) ? cols[parentNameIdx] : 'Parent / Guardian';
    const parentPhone = (parentPhoneIdx !== -1 && cols[parentPhoneIdx]) ? cols[parentPhoneIdx] : '+233 24 000 0000';
    const emergencyPhone = (emergencyPhoneIdx !== -1 && cols[emergencyPhoneIdx]) ? cols[emergencyPhoneIdx] : undefined;
    const medicalNotes = (medicalIdx !== -1 && cols[medicalIdx]) ? cols[medicalIdx] : undefined;
    const town = (townIdx !== -1 && cols[townIdx]) ? cols[townIdx] : 'Accra';

    parsedStudents.push({
      id: studentId,
      name,
      gender,
      class: studentClass,
      house,
      room,
      bedNumber,
      town,
      parentName,
      parentPhone,
      emergencyPhone,
      medicalNotes,
      status: 'pending_arrival',
      houseItems: {
        broom: false,
        scrubbingBrush: false,
        disinfectant: false,
        houseDuesPaid: false
      }
    });
  }

  return parsedStudents;
}

// Download Blank CSV Template for Bulk Upload
export function downloadCSVTemplate(): void {
  const headers = [
    'Student_ID',
    'Full_Name',
    'Gender',
    'Class',
    'House',
    'Dorm_Room',
    'Bed_Number',
    'Home_Town',
    'Parent_Name',
    'Parent_Phone',
    'Emergency_Phone',
    'Medical_Notes'
  ];

  const sampleRows = [
    [
      'BH-2026-901',
      'Kofi Osei Tutu',
      'M',
      'Form 1 Gen Sci A',
      'Aggrey House',
      'Dorm A-1',
      'Bed 1 (Lower)',
      'Kumasi - Bantama',
      'Mr. Osei Tutu',
      '+233 24 411 2233',
      '+233 20 555 4433',
      'Mild Asthma (Inhaler with Housemaster)'
    ],
    [
      'BH-2026-902',
      'Abena Mansa Danquah',
      'F',
      'Form 1 Home Econs',
      'Yaa Asantewaa House',
      'Dorm B-3',
      'Bed 2 (Upper)',
      'Accra - East Legon',
      'Mrs. Danquah',
      '+233 24 998 8776',
      '+233 27 123 4567',
      'None'
    ]
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Boarding_House_Students_Import_Template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
