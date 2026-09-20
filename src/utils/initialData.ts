import { Student, MovementAuditLog, SystemSettings } from '../types';

export const INITIAL_HOUSES = [
  'Aggrey House',
  'Guggisberg House',
  'Casely Hayford House',
  'Sarbah House',
  'Kwame Nkrumah House',
  'Yaa Asantewaa House'
];

export const INITIAL_CLASSES = [
  'Form 1 Gen Sci A',
  'Form 1 Gen Arts B',
  'Form 1 Business A',
  'Form 2 Gen Sci B',
  'Form 2 Gen Arts A',
  'Form 2 Home Econs',
  'Form 3 Gen Sci A',
  'Form 3 Gen Arts C',
  'Form 3 Business B'
];

export const INITIAL_SETTINGS: SystemSettings = {
  housemasterPin: '1234',
  soundEnabled: true,
  termMode: 'reopening',
  schoolName: 'St. Eugene Senior High & Boarding School',
  selectedHouse: 'All Houses',
  academicYear: '2025/2026',
  currentTerm: 'Term 1 Reopening',
  officerName: 'Mr. Eugene Asante (Snr Housemaster)',
  reopeningDeadlineHours: 48
};

// Generates 180 realistic students matching the prompt's stats:
// 142 Arrived (In Dormitory), 38 Checked Out / Pending Arrival
export function generateInitialStudents(): Student[] {
  const ghanaianFirstNamesM = ['Kwame', 'Kofi', 'Kojo', 'Yaw', 'Kwaku', 'Fiifi', 'Emmanuel', 'Samuel', 'Michael', 'Kelvin', 'Bernard', 'Daniel', 'Prince', 'Nana Kwesi', 'Richmond', 'Gideon'];
  const ghanaianFirstNamesF = ['Akosua', 'Ama', 'Abena', 'Yaa', 'Afia', 'Esi', 'Grace', 'Priscilla', 'Deborah', 'Comfort', 'Jennifer', 'Naa Borkor', 'Blessing', 'Gloria', 'Mercy', 'Doreen'];
  const ghanaianLastNames = ['Mensah', 'Osei', 'Appiah', 'Boateng', 'Acheampong', 'Quaye', 'Frimpong', 'Asante', 'Darko', 'Owusu', 'Agyemang', 'Boakye', 'Baffoe', 'Addai', 'Antwi', 'Kwarteng', 'Tetteh', 'Donkor', 'Amankwah', 'Oppong'];
  const towns = [
    'Accra - Madina',
    'Accra - Dansoman',
    'Kumasi - Bantama',
    'Kumasi - Asokwa',
    'Cape Coast - Kotokuraba',
    'Takoradi - Market Circle',
    'Ho - Bankoe',
    'Sunyani - New Dormaa',
    'Koforidua - Ada',
    'Tamale - Central',
    'Tema - Community 4',
    'Techiman - Zongo'
  ];

  const students: Student[] = [];

  for (let i = 1; i <= 180; i++) {
    const isFemale = i % 2 === 0;
    const firstNames = isFemale ? ghanaianFirstNamesF : ghanaianFirstNamesM;
    const firstName = firstNames[(i * 3 + 7) % firstNames.length];
    const lastName = ghanaianLastNames[(i * 5 + 11) % ghanaianLastNames.length];
    const house = INITIAL_HOUSES[(i - 1) % INITIAL_HOUSES.length];
    const studentClass = INITIAL_CLASSES[(i * 2) % INITIAL_CLASSES.length];
    const dormRoom = `Dorm ${String.fromCharCode(65 + ((i - 1) % 4))}-${Math.floor(((i - 1) % 12) / 2) + 1}`;
    const bedNumber = `Bed ${((i - 1) % 6) + 1} (${i % 2 === 0 ? 'Upper' : 'Lower'})`;
    const town = towns[(i * 7) % towns.length];
    const parentTitle = i % 3 === 0 ? 'Dr.' : i % 2 === 0 ? 'Mrs.' : 'Mr.';
    const parentName = `${parentTitle} ${lastName}`;
    const phoneSuffix = String(1000 + i * 47).padStart(4, '0');
    const parentPhone = `+233 24 555 ${phoneSuffix}`;

    // 142 arrived ('in_dorm'), 30 'checked_out', 8 'pending_arrival' (Total 180)
    let status: Student['status'] = 'in_dorm';
    let lastArrivalTimestamp: string | undefined = undefined;
    let lastDepartureTimestamp: string | undefined = undefined;
    let luggageNotes: string | undefined = undefined;

    if (i <= 142) {
      status = 'in_dorm';
      // Recent arrival timestamps over the last 24-48 hours
      const arrivalHoursAgo = (i % 36) + 1;
      const d = new Date(Date.now() - arrivalHoursAgo * 3600000);
      lastArrivalTimestamp = d.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      if (i === 14) {
        luggageNotes = 'Unprescribed paracetamol withheld until School Dispensary review.';
      } else if (i === 28) {
        luggageNotes = 'Non-regulation electric pressing iron detained at gate.';
      }
    } else if (i <= 172) {
      status = 'checked_out';
      const exitHoursAgo = (i % 24) + 2;
      const d = new Date(Date.now() - exitHoursAgo * 3600000);
      lastDepartureTimestamp = d.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } else {
      status = 'pending_arrival';
    }

    const id = `BH-2026-${String(i).padStart(3, '0')}`;

    students.push({
      id,
      name: `${firstName} ${lastName}`,
      gender: isFemale ? 'F' : 'M',
      class: studentClass,
      house,
      room: dormRoom,
      bedNumber,
      town,
      parentName,
      parentPhone,
      status,
      lastArrivalTimestamp,
      lastDepartureTimestamp,
      houseItems: {
        broom: i <= 142 ? i % 10 !== 0 : false,
        scrubbingBrush: i <= 142 ? i % 8 !== 0 : false,
        disinfectant: i <= 142 ? i % 6 !== 0 : false,
        houseDuesPaid: i <= 142 ? i % 5 !== 0 : false
      },
      luggageInspectionNotes: luggageNotes,
      flagNotes: luggageNotes ? 'Luggage withheld item' : undefined
    });
  }

  return students;
}

export function generateInitialAuditLogs(students: Student[]): MovementAuditLog[] {
  const logs: MovementAuditLog[] = [];
  
  // Recent arrivals
  const arrivedStudents = students.filter(s => s.status === 'in_dorm').slice(0, 20);
  arrivedStudents.forEach((student, idx) => {
    logs.push({
      id: `LOG-ARR-${1000 + idx}`,
      studentId: student.id,
      studentName: student.name,
      studentClass: student.class,
      house: student.house,
      room: student.room,
      type: 'arrival',
      timestamp: student.lastArrivalTimestamp || '10 Sep 2026, 14:30',
      accompaniedBy: idx % 3 === 0 ? 'parent' : idx % 2 === 0 ? 'guardian' : 'public_transit_alone',
      luggageStatus: student.luggageInspectionNotes ? 'flagged_withheld' : 'cleared',
      luggageNotes: student.luggageInspectionNotes || 'Luggage fully cleared and verified.',
      houseItems: student.houseItems,
      officerName: 'Mr. Eugene Asante',
      officerRole: 'Senior Housemaster'
    });
  });

  // Recent departures
  const departedStudents = students.filter(s => s.status === 'checked_out').slice(0, 10);
  departedStudents.forEach((student, idx) => {
    logs.push({
      id: `LOG-DEP-${2000 + idx}`,
      studentId: student.id,
      studentName: student.name,
      studentClass: student.class,
      house: student.house,
      room: student.room,
      type: 'departure',
      timestamp: student.lastDepartureTimestamp || '10 Sep 2026, 17:15',
      destinationTown: student.town,
      escortName: idx % 2 === 0 ? student.parentName : 'Self (Public Transit)',
      escortIdType: idx % 2 === 0 ? 'ghana_card' : 'student_self',
      escortPhone: idx % 2 === 0 ? student.parentPhone : student.parentPhone,
      keySurrendered: true,
      roomCleaned: true,
      formMasterSigned: true,
      officerName: 'Mr. Eugene Asante',
      officerRole: 'Senior Housemaster'
    });
  });

  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
