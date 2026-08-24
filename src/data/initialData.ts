import { 
  TeacherUser, 
  DepartmentItem, 
  AttendanceTimeSettings, 
  BroadcastQR,
  SchoolClass,
  ScheduleItem,
  TodoItem,
  SubmissionItem,
  StudentRecord,
  Announcement,
  AttendanceSession,
  ManagerFeedback
} from '../types';
import { fastHash } from '../lib/utils';

export const DEFAULT_MANAGER_USER: TeacherUser = {
  id: 'mgr-admin-01',
  name: 'Academic Manager',
  employeeId: 'Manager',
  rawPassword: 'Manager 123',
  currentPassword: 'Manager 123',
  passwordHash: fastHash('Manager 123'),
  email: 'academic.manager@eduschool.edu',
  department: 'Academic Administration',
  mentorName: 'School Principal',
  mentorId: 'principal-01',
  role: 'manager',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  phone: '+1 (555) 901-4422',
  roomNumber: 'Office 101 - Admin Suite',
  subjects: ['Institutional Leadership', 'Curriculum Oversight'],
  shiftTiming: '07:30 AM - 05:00 PM',
  joinDate: 'January 2020',
  status: 'active'
};

export const DEFAULT_QR_STATION_USER: TeacherUser = {
  id: 'qr-station-01',
  name: 'Station Mentor Officer',
  employeeId: 'Qr Code',
  rawPassword: 'Qr code 123',
  currentPassword: 'Qr code 123',
  passwordHash: fastHash('Qr code 123'),
  email: 'entrance.kiosk@eduschool.edu',
  department: 'Main Gate - Entrance Station #1',
  mentorName: 'Academic Manager',
  role: 'qr_station', // Mentor level - Restricted from Manager Data & QR generation
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  phone: '+1 (555) 901-4422',
  roomNumber: 'Entrance Kiosk Terminal #1',
  subjects: ['QR Display', 'Badge Verification'],
  subject: 'Attendance Station',
  shiftTiming: '07:00 AM - 05:00 PM',
  status: 'active'
};

export const INITIAL_REGISTERED_TEACHERS: TeacherUser[] = [
  {
    id: 'tch-samuel',
    name: 'Samuel Asfaw',
    employeeId: 'TCH-8492',
    rawPassword: 'teach123',
    currentPassword: 'teach123',
    passwordHash: fastHash('teach123'),
    email: 'samuel.asfaw@faculty.eduschool.edu',
    department: 'Mathematics & STEM',
    mentorName: 'Academic Manager',
    mentorId: 'mgr-admin-01',
    role: 'teacher',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    phone: '+1 (555) 349-2819',
    roomNumber: 'Room 204 - STEM Wing',
    subjects: ['Mathematics', 'Advanced Algebra', 'Geometry'],
    assignedClasses: ['Grade 9A', 'Grade 10B', 'Grade 11A'],
    shiftTiming: '08:00 AM - 04:00 PM',
    joinDate: 'September 2022',
    status: 'active'
  },
  {
    id: 'tch-selamawit',
    name: 'Dr. Selamawit Bekele',
    employeeId: 'TCH-1001',
    rawPassword: 'science123',
    currentPassword: 'science123',
    passwordHash: fastHash('science123'),
    email: 'selamawit.bekele@faculty.eduschool.edu',
    department: 'Natural Sciences',
    mentorName: 'Academic Manager',
    mentorId: 'mgr-admin-01',
    role: 'teacher',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    phone: '+1 (555) 782-1928',
    roomNumber: 'Room 302 - Science Lab',
    subjects: ['Physics', 'AP Chemistry', 'General Science'],
    assignedClasses: ['Grade 8A', 'Grade 10A'],
    shiftTiming: '08:00 AM - 04:00 PM',
    joinDate: 'August 2021',
    status: 'active'
  },
  {
    id: 'tch-michael',
    name: 'Michael Harrison',
    employeeId: 'TCH-1002',
    rawPassword: 'english123',
    currentPassword: 'english123',
    passwordHash: fastHash('english123'),
    email: 'michael.harrison@faculty.eduschool.edu',
    department: 'Languages & Literature',
    mentorName: 'Academic Manager',
    mentorId: 'mgr-admin-01',
    role: 'teacher',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    phone: '+1 (555) 443-8901',
    roomNumber: 'Room 110 - Humanities Wing',
    subjects: ['English Literature', 'Essay Writing', 'World History'],
    assignedClasses: ['Grade 9B', 'Grade 11B'],
    shiftTiming: '08:00 AM - 04:00 PM',
    joinDate: 'January 2023',
    status: 'active'
  },
  {
    id: 'tch-amina',
    name: 'Amina Yusuf',
    employeeId: 'TCH-1003',
    rawPassword: 'tech123',
    currentPassword: 'tech123',
    passwordHash: fastHash('tech123'),
    email: 'amina.yusuf@faculty.eduschool.edu',
    department: 'Information & Technology',
    mentorName: 'Academic Manager',
    mentorId: 'mgr-admin-01',
    role: 'teacher',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    phone: '+1 (555) 612-4982',
    roomNumber: 'Computer Lab 2',
    subjects: ['ICT & Computing', 'Database Projects', 'Web Dev'],
    assignedClasses: ['Grade 11', 'Grade 12A'],
    shiftTiming: '08:00 AM - 04:00 PM',
    joinDate: 'March 2024',
    status: 'active'
  }
];

export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'dept-math',
    name: 'Mathematics & STEM',
    code: 'MATH',
    headOfDepartment: 'Samuel Asfaw',
    teacherCount: 14,
    subjectList: ['Mathematics', 'Advanced Math', 'Algebra', 'Calculus', 'Geometry'],
    subjects: ['Mathematics', 'Advanced Math', 'Algebra', 'Calculus', 'Geometry'],
    totalSubjects: 5,
    color: '#2563eb',
    description: 'Analytical thinking, pure mathematics, algebra and STEM integrated learning.'
  },
  {
    id: 'dept-sci',
    name: 'Natural Sciences',
    code: 'SCI',
    headOfDepartment: 'Dr. Selamawit Bekele',
    teacherCount: 18,
    subjectList: ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
    subjects: ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
    totalSubjects: 4,
    color: '#059669',
    description: 'Laboratory investigations, experimental physics, biological systems and chemistry.'
  },
  {
    id: 'dept-lang',
    name: 'Languages & Literature',
    code: 'LANG',
    headOfDepartment: 'Michael Harrison',
    teacherCount: 16,
    subjectList: ['English Literature', 'Creative Writing', 'French', 'World Languages'],
    subjects: ['English Literature', 'Creative Writing', 'French', 'World Languages'],
    totalSubjects: 4,
    color: '#d97706',
    description: 'Literary analysis, communication skills, international language development.'
  },
  {
    id: 'dept-ict',
    name: 'Information & Technology',
    code: 'ICT',
    headOfDepartment: 'Amina Yusuf',
    teacherCount: 12,
    subjectList: ['ICT Systems', 'Computer Science', 'Web Development', 'Robotics'],
    subjects: ['ICT Systems', 'Computer Science', 'Web Development', 'Robotics'],
    totalSubjects: 4,
    color: '#7c3aed',
    description: 'Modern computational systems, programming languages, and robotics lab.'
  }
];

export const INITIAL_ATTENDANCE_RULES: AttendanceTimeSettings = {
  morningStart: '07:30 AM',
  morningEnd: '09:30 AM',
  lateThreshold: '08:15 AM',
  qrDefaultExpiryMinutes: 45,
  enforceOneScanPerDay: true,
  gracePeriodMinutes: 15,
  autoSendQREnabled: true,
  autoSendTime: '07:30 AM',
  broadcastTarget: 'single_kiosk_device',
  targetDeviceName: 'School Entrance Terminal (Device #1)'
};

export const INITIAL_BROADCAST_QR: BroadcastQR = {
  id: 'qr-broadcast-today',
  token: 'EDUSCHOOL-MGR-OFFICIAL-2026-08-21-LIVE-9481',
  title: "Today's Faculty Attendance QR",
  generatedDate: '2026-08-21',
  createdAt: Date.now(),
  expiresAt: Date.now() + 8 * 60 * 60 * 1000, // Valid for 8 hours for today
  durationMinutes: 480,
  isActive: true,
  notes: 'Created and posted strictly by Academic Manager for physical entrance attendance.',
  generatedBy: 'Academic Manager',
  generatedByRole: 'manager',
  targetDevice: 'Main Gate - Entrance Station #1',
  isAutoGenerated: false,
  status: 'active',
  scanCount: 0,
  managerSignature: 'MGR_SIG_AUTHENTIC_2026_08_21'
};

export const DEFAULT_TEACHER: TeacherUser = INITIAL_REGISTERED_TEACHERS[0];
export const INITIAL_CLASSES: SchoolClass[] = [];
export const INITIAL_SCHEDULE: ScheduleItem[] = [];
export const INITIAL_TODOS: TodoItem[] = [];
export const INITIAL_SUBMISSIONS: SubmissionItem[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Midterm Exams Schedule',
    content: 'Midterm examinations will be held across all secondary levels from June 2 to June 7, 2026. Hall assignments published in examination portal.',
    author: 'Academic Manager',
    authorRole: 'Academic Manager',
    date: 'May 19, 2026 • 10:30 AM',
    priority: 'urgent',
    category: 'Schedule Update',
    isRead: false
  },
  {
    id: 'ann-2',
    title: 'Parent-Teacher Meeting',
    content: 'All faculty must attend the semester assembly in the main academic hall at 2:00 PM - 03:45 PM.',
    author: 'Academic Manager',
    authorRole: 'Academic Manager',
    date: 'May 18, 2026 • 03:45 PM',
    priority: 'normal',
    category: 'Mentor Bulletin',
    isRead: false
  }
];
export const INITIAL_ATTENDANCE: AttendanceSession[] = [];
export const INITIAL_FEEDBACK: ManagerFeedback[] = [];
export const INITIAL_STUDENTS: StudentRecord[] = [];
