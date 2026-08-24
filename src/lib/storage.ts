import { 
  TeacherUser, 
  AttendanceSession, 
  Announcement, 
  ManagerFeedback, 
  SchoolClass, 
  ClassItem,
  ScheduleItem, 
  TimetableSlot,
  TodoItem, 
  StudentRecord,
  StudentItem,
  DepartmentItem,
  Department,
  AttendanceTimeSettings,
  BroadcastQR,
  Assignment,
  AssignmentItem,
  AssignmentSubmission,
  SubmissionItem,
  MaterialItem,
  GradeRecord,
  PasswordResetRequest
} from '../types';
import { 
  DEFAULT_TEACHER, 
  INITIAL_REGISTERED_TEACHERS,
  DEFAULT_MANAGER_USER,
  DEFAULT_QR_STATION_USER,
  INITIAL_DEPARTMENTS,
  INITIAL_ATTENDANCE_RULES,
  INITIAL_BROADCAST_QR,
  INITIAL_CLASSES, 
  INITIAL_SCHEDULE, 
  INITIAL_TODOS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_FEEDBACK, 
  INITIAL_STUDENTS 
} from '../data/initialData';
import { getTeacherRealPassword } from '../lib/utils';

const CURRENT_USER_KEY = 'eduschool_user_v9';
const SCHOOL_NAME_KEY = 'eduschool_school_name_v9';
const ATTENDANCE_KEY = 'eduschool_attendance_v9';
const ANNOUNCEMENTS_KEY = 'eduschool_announcements_v9';
const FEEDBACK_KEY = 'eduschool_feedback_v9';
const TODOS_KEY = 'eduschool_todos_v9';
const CLASSES_KEY = 'eduschool_classes_v9';
const SCHEDULE_KEY = 'eduschool_schedule_v9';
const STUDENTS_KEY = 'eduschool_students_v9';
const TEACHERS_KEY = 'eduschool_teachers_v9';
const DEPARTMENTS_KEY = 'eduschool_departments_v9';
const ATTENDANCE_RULES_KEY = 'eduschool_attendance_rules_v9';
const BROADCAST_QR_KEY = 'eduschool_broadcast_qr_v9';
const QR_HISTORY_KEY = 'eduschool_qr_history_v9';
const ASSIGNMENTS_KEY = 'eduschool_assignments_v9';
const SUBMISSIONS_KEY = 'eduschool_submissions_v9';
const MATERIALS_KEY = 'eduschool_materials_v9';
const GRADES_KEY = 'eduschool_grades_v9';
const PASSWORD_RESETS_KEY = 'eduschool_pwd_resets_v9';
const STATION_LOCK_KEY = 'eduschool_main_gate_locked_v9';
const AUTO_CREATE_QR_KEY = 'eduschool_auto_create_qr_v9';

export function initializeStorage() {
  if (!localStorage.getItem(TEACHERS_KEY)) {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify([
      DEFAULT_MANAGER_USER,
      DEFAULT_QR_STATION_USER,
      ...INITIAL_REGISTERED_TEACHERS
    ]));
  }
  if (!localStorage.getItem(CLASSES_KEY)) {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(INITIAL_CLASSES));
  }
  if (!localStorage.getItem(STUDENTS_KEY)) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  }
  if (!localStorage.getItem(ATTENDANCE_KEY)) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
  }
  if (!localStorage.getItem(ANNOUNCEMENTS_KEY)) {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem(SCHEDULE_KEY)) {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(INITIAL_SCHEDULE));
  }
  if (!localStorage.getItem(FEEDBACK_KEY)) {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(INITIAL_FEEDBACK));
  }
  if (!localStorage.getItem(DEPARTMENTS_KEY)) {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
  }
  if (!localStorage.getItem(BROADCAST_QR_KEY)) {
    localStorage.setItem(BROADCAST_QR_KEY, JSON.stringify(INITIAL_BROADCAST_QR));
  }
}

export function getSavedSchoolName(): string {
  try {
    const raw = localStorage.getItem(SCHOOL_NAME_KEY);
    if (raw) return raw;
  } catch (e) {
    console.error(e);
  }
  return 'EduSchool International Academy';
}

export function saveSchoolName(name: string) {
  try {
    localStorage.setItem(SCHOOL_NAME_KEY, name);
  } catch (e) {
    console.error(e);
  }
}

export function getSavedUser(): TeacherUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.id) {
        const realPwd = getTeacherRealPassword(parsed);
        return {
          ...parsed,
          rawPassword: parsed.rawPassword || realPwd,
          currentPassword: parsed.currentPassword || parsed.rawPassword || realPwd
        };
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveUser(user: TeacherUser | null) {
  try {
    if (user) {
      const realPwd = getTeacherRealPassword(user);
      const userToSave = {
        ...user,
        rawPassword: user.rawPassword || realPwd,
        currentPassword: user.currentPassword || user.rawPassword || realPwd
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToSave));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error(e);
  }
}

export const loadCurrentUser = getSavedUser;
export const saveCurrentUser = saveUser;

export function getSavedTeachers(): TeacherUser[] {
  try {
    const raw = localStorage.getItem(TEACHERS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(t => {
          const realPwd = getTeacherRealPassword(t);
          return {
            ...t,
            rawPassword: t.rawPassword || realPwd,
            currentPassword: t.currentPassword || t.rawPassword || realPwd
          };
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [
    DEFAULT_MANAGER_USER,
    DEFAULT_QR_STATION_USER,
    ...INITIAL_REGISTERED_TEACHERS
  ];
}

export function saveTeachers(teachers: TeacherUser[]) {
  try {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(Array.isArray(teachers) ? teachers : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadUsers = getSavedTeachers;
export const saveUsers = saveTeachers;

export function getSavedDepartments(): DepartmentItem[] {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_DEPARTMENTS;
}

export function saveDepartments(departments: DepartmentItem[]) {
  try {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(Array.isArray(departments) ? departments : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadDepartments = getSavedDepartments;

export function getSavedAttendanceRules(): AttendanceTimeSettings {
  try {
    const raw = localStorage.getItem(ATTENDANCE_RULES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_ATTENDANCE_RULES;
}

export function saveAttendanceRules(rules: AttendanceTimeSettings) {
  try {
    localStorage.setItem(ATTENDANCE_RULES_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedBroadcastQR(): BroadcastQR | null {
  try {
    const raw = localStorage.getItem(BROADCAST_QR_KEY);
    if (raw !== null) {
      const qr: BroadcastQR = JSON.parse(raw);
      if (qr && qr.generatedByRole === 'manager') {
        if (qr.expiresAt && Date.now() > qr.expiresAt) {
          return { ...qr, isActive: false, status: 'expired' };
        }
        return qr;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_BROADCAST_QR;
}

export function saveBroadcastQR(qr: BroadcastQR | null) {
  try {
    if (qr) {
      localStorage.setItem(BROADCAST_QR_KEY, JSON.stringify(qr));
    } else {
      localStorage.removeItem(BROADCAST_QR_KEY);
    }
  } catch (e) {
    console.error(e);
  }
}

export const loadBroadcastQR = getSavedBroadcastQR;

export function getSavedQRHistory(): BroadcastQR[] {
  try {
    const raw = localStorage.getItem(QR_HISTORY_KEY);
    if (raw !== null) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveQRHistory(history: BroadcastQR[]) {
  try {
    localStorage.setItem(QR_HISTORY_KEY, JSON.stringify(Array.isArray(history) ? history : []));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedAttendance(): AttendanceSession[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_ATTENDANCE;
}

export function saveAttendance(records: AttendanceSession[]) {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(Array.isArray(records) ? records : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadAttendanceRecords = getSavedAttendance;
export const saveAttendanceRecords = saveAttendance;

export function clearAllAttendanceRecords() {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_ANNOUNCEMENTS;
}

export function saveAnnouncements(announcements: Announcement[]) {
  try {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(Array.isArray(announcements) ? announcements : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadAnnouncements = getSavedAnnouncements;

export function getSavedFeedback(): ManagerFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_FEEDBACK;
}

export function saveFeedback(feedbacks: ManagerFeedback[]) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(Array.isArray(feedbacks) ? feedbacks : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadFeedback = getSavedFeedback;

export function getSavedTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_TODOS;
}

export function saveTodos(todos: TodoItem[]) {
  try {
    localStorage.setItem(TODOS_KEY, JSON.stringify(Array.isArray(todos) ? todos : []));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedClasses(): SchoolClass[] {
  try {
    const raw = localStorage.getItem(CLASSES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_CLASSES;
}

export function saveClasses(classes: SchoolClass[]) {
  try {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(Array.isArray(classes) ? classes : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadClasses = getSavedClasses;

export function getSavedSchedule(): ScheduleItem[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_SCHEDULE;
}

export function saveSchedule(schedule: ScheduleItem[]) {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(Array.isArray(schedule) ? schedule : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadTimetable = getSavedSchedule;
export const saveTimetable = saveSchedule;

export function getSavedStudents(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_STUDENTS;
}

export function saveStudents(students: StudentRecord[]) {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(Array.isArray(students) ? students : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadStudents = getSavedStudents;

export function getSavedAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveAssignments(assignments: Assignment[]) {
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(Array.isArray(assignments) ? assignments : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadAssignments = getSavedAssignments;

export function getSavedSubmissions(): AssignmentSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveSubmissions(submissions: AssignmentSubmission[]) {
  try {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(Array.isArray(submissions) ? submissions : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadSubmissions = getSavedSubmissions;

export function getSavedMaterials(): MaterialItem[] {
  try {
    const raw = localStorage.getItem(MATERIALS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [
    {
      id: 'mat-1',
      title: 'Trigonometry & Calculus Foundations',
      className: 'Mathematics Grade 10',
      subject: 'Mathematics',
      fileType: 'PDF',
      fileSize: '3.2 MB',
      uploadedDate: '2026-08-18'
    },
    {
      id: 'mat-2',
      title: 'Physics Lab Protocol & Safety Manual',
      className: 'AP Physics 1',
      subject: 'Science',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      uploadedDate: '2026-08-19'
    }
  ];
}

export function saveMaterials(materials: MaterialItem[]) {
  try {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(Array.isArray(materials) ? materials : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadMaterials = getSavedMaterials;

export function getSavedGrades(): GradeRecord[] {
  try {
    const raw = localStorage.getItem(GRADES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveGrades(grades: GradeRecord[]) {
  try {
    localStorage.setItem(GRADES_KEY, JSON.stringify(Array.isArray(grades) ? grades : []));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedPasswordResets(): PasswordResetRequest[] {
  try {
    const raw = localStorage.getItem(PASSWORD_RESETS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item && typeof item === 'object')
          .map((item: any) => {
            let cleanTeacherId = '';
            let cleanTeacherName = '';
            let cleanEmail = '';
            let cleanDept = '';
            let cleanRequestedPwd = '';
            let cleanReason = '';

            // Guard against corrupted nested object in teacherId
            if (item.teacherId && typeof item.teacherId === 'object') {
              cleanTeacherId = String(item.teacherId.teacherId || item.teacherId.employeeId || item.teacherId.id || 'TCH-FACULTY');
              cleanTeacherName = String(item.teacherId.teacherName || item.teacherId.name || 'Faculty Member');
              cleanEmail = String(item.teacherId.email || '');
              cleanDept = String(item.teacherId.department || 'Faculty');
              cleanRequestedPwd = String(item.teacherId.requestedNewPassword || '');
              cleanReason = String(item.teacherId.reason || '');
            } else {
              cleanTeacherId = typeof item.teacherId === 'string' ? item.teacherId : String(item.teacherId || 'TCH-FACULTY');
            }

            cleanTeacherName = cleanTeacherName || (typeof item.teacherName === 'string' ? item.teacherName : 'Faculty Member');
            cleanEmail = cleanEmail || (typeof item.email === 'string' ? item.email : '');
            cleanDept = cleanDept || (typeof item.department === 'string' ? item.department : 'Faculty');
            cleanRequestedPwd = cleanRequestedPwd || (typeof item.requestedNewPassword === 'string' ? item.requestedNewPassword : (typeof item.requestedPassword === 'string' ? item.requestedPassword : ''));
            cleanReason = cleanReason || (typeof item.reason === 'string' ? item.reason : '');

            return {
              id: typeof item.id === 'string' ? item.id : `rst-${Date.now()}-${Math.random()}`,
              teacherId: cleanTeacherId,
              teacherName: cleanTeacherName,
              email: cleanEmail,
              department: cleanDept,
              status: (item.status === 'approved' || item.status === 'rejected') ? item.status : 'pending',
              requestedNewPassword: cleanRequestedPwd || undefined,
              reason: cleanReason || undefined,
              requestedAt: typeof item.requestedAt === 'string' ? item.requestedAt : new Date().toISOString(),
              approvedAt: typeof item.approvedAt === 'string' ? item.approvedAt : undefined,
              managerNotes: typeof item.managerNotes === 'string' ? item.managerNotes : undefined,
            } as PasswordResetRequest;
          });
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function savePasswordResets(resets: PasswordResetRequest[]) {
  try {
    localStorage.setItem(PASSWORD_RESETS_KEY, JSON.stringify(Array.isArray(resets) ? resets : []));
  } catch (e) {
    console.error(e);
  }
}

export const loadPasswordResetRequests = getSavedPasswordResets;
export const savePasswordResetRequests = savePasswordResets;

// Persistent Station Lock State (Main Gate - Entrance Station #1)
export function getSavedStationLockState(): boolean {
  try {
    const raw = localStorage.getItem(STATION_LOCK_KEY);
    if (raw !== null) {
      return raw === 'true';
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

export function saveStationLockState(isLocked: boolean) {
  try {
    localStorage.setItem(STATION_LOCK_KEY, isLocked ? 'true' : 'false');
  } catch (e) {
    console.error(e);
  }
}

export function getSavedAutoCreateQREnabled(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_CREATE_QR_KEY);
    if (raw !== null) {
      return raw === 'true';
    }
  } catch (e) {
    console.error(e);
  }
  return true; // default to true for auto create
}

export function saveAutoCreateQREnabled(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_CREATE_QR_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error(e);
  }
}

export const loadMainGateLocked = getSavedStationLockState;
export const saveMainGateLocked = saveStationLockState;

export const storage = {
  getCurrentUser: getSavedUser,
  setCurrentUser: saveUser,
  getTeachers: getSavedTeachers,
  saveTeachers: saveTeachers,
  getPasswordResets: getSavedPasswordResets,
  savePasswordResets: savePasswordResets,
  getClasses: getSavedClasses,
  saveClasses: saveClasses,
  getStudents: getSavedStudents,
  saveStudents: saveStudents,
  getAttendance: getSavedAttendance,
  saveAttendance: saveAttendance,
  getAnnouncements: getSavedAnnouncements,
  saveAnnouncements: saveAnnouncements,
  getSchedule: getSavedSchedule,
  saveSchedule: saveSchedule,
  getFeedback: getSavedFeedback,
  saveFeedback: saveFeedback,
  getDepartments: getSavedDepartments,
  saveDepartments: saveDepartments,
  getAssignments: getSavedAssignments,
  saveAssignments: saveAssignments,
  getSubmissions: getSavedSubmissions,
  saveSubmissions: saveSubmissions,
  getMaterials: getSavedMaterials,
  saveMaterials: saveMaterials,
  getGrades: getSavedGrades,
  saveGrades: saveGrades,
  getTodos: getSavedTodos,
  saveTodos: saveTodos,
  getSchoolName: getSavedSchoolName,
  saveSchoolName: saveSchoolName,
  getBroadcastQR: getSavedBroadcastQR,
  saveBroadcastQR: saveBroadcastQR,
  getQRHistory: getSavedQRHistory,
  saveQRHistory: saveQRHistory,
  getStationLockState: getSavedStationLockState,
  saveStationLockState: saveStationLockState,
  getAutoCreateQREnabled: getSavedAutoCreateQREnabled,
  saveAutoCreateQREnabled: saveAutoCreateQREnabled
};
