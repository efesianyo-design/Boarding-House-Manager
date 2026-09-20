export type DormStatus = 'in_dorm' | 'checked_out' | 'pending_arrival' | 'flagged';

export type AccompaniedType = 'parent' | 'guardian' | 'public_transit_alone';

export type LuggageStatus = 'cleared' | 'flagged_withheld';

export type EscortIdType = 'ghana_card' | 'drivers_license' | 'voter_id' | 'passport' | 'student_self' | 'other';

export interface HouseItemChecks {
  broom: boolean;
  scrubbingBrush: boolean;
  disinfectant: boolean;
  houseDuesPaid: boolean;
}

export interface Student {
  id: string; // e.g. "BH-2026-014"
  name: string;
  gender: 'M' | 'F';
  class: string; // e.g. "Form 3 Science A"
  house: string; // e.g. "Aggrey House"
  room: string; // e.g. "Dorm B-12"
  bedNumber: string; // e.g. "Bed 4 (Lower)"
  town: string; // e.g. "Accra - Madina"
  parentName: string;
  parentPhone: string; // e.g. "+233 24 555 0192"
  emergencyPhone?: string;
  medicalNotes?: string;
  isFirstTimeReporting?: boolean;
  status: DormStatus;
  photoUrl?: string;
  lastArrivalTimestamp?: string;
  lastDepartureTimestamp?: string;
  houseItems: HouseItemChecks;
  luggageInspectionNotes?: string;
  flagNotes?: string;
}

export type MovementType = 'arrival' | 'departure';

export interface MovementAuditLog {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  house: string;
  room: string;
  type: MovementType;
  timestamp: string; // ISO or formatted date
  accompaniedBy?: AccompaniedType;
  luggageStatus?: LuggageStatus;
  luggageNotes?: string;
  houseItems?: HouseItemChecks;
  destinationTown?: string;
  escortName?: string;
  escortIdType?: EscortIdType;
  escortPhone?: string;
  keySurrendered?: boolean;
  roomCleaned?: boolean;
  formMasterSigned?: boolean;
  officerName: string;
  officerRole: string;
}

export type AppMode = 'arrivals' | 'departures' | 'roster' | 'analytics';

export type TermMode = 'reopening' | 'vacation';

export interface SystemSettings {
  housemasterPin: string; // Default: '1234'
  soundEnabled: boolean;
  termMode: TermMode;
  schoolName: string;
  selectedHouse: string; // Filter or default house: 'All Houses' | specific house
  academicYear: string;
  currentTerm: string;
  officerName: string;
  reopeningDeadlineHours: number; // default 48
}
