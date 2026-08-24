import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  UserCheck, 
  AlertCircle,
  Trash2,
  Search,
  Users,
  Radio,
  Building,
  ShieldCheck,
  Camera,
  XCircle,
  Link as LinkIcon,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TeacherUser, AttendanceSession, BroadcastQR } from '../types';
import { ConfirmDialog, ConfirmDialogState } from './ConfirmDialog';

interface AttendanceViewProps {
  currentUser: TeacherUser;
  attendanceRecords?: AttendanceSession[];
  allAttendanceRecords?: AttendanceSession[];
  teachers?: TeacherUser[];
  broadcastQR?: BroadcastQR | null;
  onOpenScanner?: () => void;
  onScanSuccess?: (scannedText: string, method?: 'qr' | 'link') => boolean | void;
  alreadyScannedToday?: boolean;
  todayDateStr?: string;
  onEraseAttendance?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentUser,
  attendanceRecords = [],
  allAttendanceRecords = [],
  teachers = [],
  broadcastQR,
  onOpenScanner = () => {},
  onScanSuccess,
  alreadyScannedToday = false,
  todayDateStr = '2026-08-21',
  onEraseAttendance = () => {}
}) => {
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  
  // Manual link entry state
  const [manualLinkInput, setManualLinkInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Erase & Confirm') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  const handleManualLinkCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    const input = manualLinkInput.trim();
    if (!input) {
      setLinkError('Please enter or paste the attendance link.');
      return;
    }

    if (alreadyScannedToday) {
      setWarningToast('You have already checked in for today.');
      return;
    }

    // Extract code
    let cleanCode = input;
    if (input.includes('code=')) {
      const match = input.match(/[?&]code=([^&]+)/);
      if (match && match[1]) {
        cleanCode = decodeURIComponent(match[1]);
      }
    }

    if (onScanSuccess) {
      const result = onScanSuccess(cleanCode, 'link');
      if (result === false) {
        setLinkError('Invalid or expired attendance link. Please verify with your mentor/manager.');
      } else {
        setSuccessToast('Check-in successfully recorded via attendance link!');
        setManualLinkInput('');
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  };

  // Dynamic Month & Year Navigation (Default: August 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 7 is August (0-indexed)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(21);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedCalendarDay(null);
  };

  const handleJumpToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(7); // August
    setSelectedCalendarDay(21);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const displayedMonthName = `${monthNames[currentMonth]} ${currentYear}`;

  // Teacher's personal attendance records
  const safePersonalAttendance = attendanceRecords || [];
  const personalPresentCount = safePersonalAttendance.filter((r) => r && r.status === 'present').length;
  const personalLateCount = safePersonalAttendance.filter((r) => r && r.status === 'late').length;
  const personalAbsentCount = safePersonalAttendance.filter((r) => r && r.status === 'absent').length;
  const totalClasses = personalPresentCount + personalLateCount + personalAbsentCount;
  const attendanceRate = totalClasses > 0 
    ? Math.round(((personalPresentCount + personalLateCount) / totalClasses) * 100)
    : 100;

  // Calendar Math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map of days to attendance for current view month
  const attendanceDayMap = new Map<number, AttendanceSession>();
  safePersonalAttendance.forEach((rec) => {
    if (!rec || !rec.date) return;
    const parts = rec.date.split('-');
    if (parts.length === 3) {
      const recYear = parseInt(parts[0], 10);
      const recMonth = parseInt(parts[1], 10) - 1;
      const recDay = parseInt(parts[2], 10);
      if (recYear === currentYear && recMonth === currentMonth) {
        attendanceDayMap.set(recDay, rec);
      }
    }
  });

  const isCurrentViewingAugust2026 = currentYear === 2026 && currentMonth === 7;
  const todayPersonalRecord = safePersonalAttendance.find((r) => r && r.date === todayDateStr);

  const facultyMembers = teachers.filter(t => t.role === 'teacher');
  const effectiveAllAttendance = allAttendanceRecords.length > 0 ? allAttendanceRecords : safePersonalAttendance;
  const todayAllAttendance = effectiveAllAttendance.filter(r => r && r.date === todayDateStr);

  const facultyCount = facultyMembers.length;
  let totalPresentFaculty = 0;
  let totalLateFaculty = 0;
  let totalAbsentFaculty = 0;

  const rosterWithStatus = facultyMembers.map((member) => {
    const log = todayAllAttendance.find(
      r => r.teacherId === member.employeeId || r.teacherName === member.name
    );
    const status = log?.status || 'absent';
    if (status === 'present') totalPresentFaculty++;
    else if (status === 'late') totalLateFaculty++;
    else totalAbsentFaculty++;
    return {
      member,
      log,
      status
    };
  });

  const facultyAttendanceRate = facultyCount > 0 
    ? Math.round(((totalPresentFaculty + totalLateFaculty) / facultyCount) * 100) 
    : 100;

  // Filtered roster for table
  const query = (rosterSearch || '').toLowerCase();
  const filteredRoster = rosterWithStatus.filter(({ member, status }) => {
    const matchesSearch = 
      (member.name || '').toLowerCase().includes(query) ||
      (member.employeeId || '').toLowerCase().includes(query) ||
      (member.subject || '').toLowerCase().includes(query) ||
      (member.department || '').toLowerCase().includes(query);
    
    const matchesStatus = rosterStatusFilter === 'all' || status === rosterStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const isTodayQRBroadcastLive = Boolean(
    broadcastQR && 
    broadcastQR.isActive && 
    broadcastQR.generatedDate === todayDateStr &&
    broadcastQR.generatedByRole === 'manager' &&
    broadcastQR.expiresAt > Date.now()
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
      
      {/* Toast Banners */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="text-sm font-semibold">{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-white hover:text-emerald-100 text-xs px-2 py-1 bg-emerald-700/50 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {warningToast && (
        <div className="bg-amber-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-200" />
            <span className="text-sm font-semibold">{warningToast}</span>
          </div>
          <button 
            onClick={() => setWarningToast(null)}
            className="text-white hover:text-amber-100 text-xs px-2 py-1 bg-amber-700/50 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Teacher Attendance & Roster</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Today's Faculty Attendance Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Live status for faculty members, Manager QR code entrance verification, and personal monthly logs.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {currentUser.role === 'manager' && attendanceRecords.length > 0 && (
            <button
              onClick={() => {
                triggerConfirm(
                  'Erase Attendance Records',
                  'Are you sure you want to clear attendance logs?',
                  () => {
                    onEraseAttendance();
                    setSuccessToast('All attendance records erased.');
                  },
                  'Erase Attendance'
                );
              }}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Clear Attendance Records</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className={`w-2.5 h-2.5 rounded-full ${alreadyScannedToday ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <span className="text-xs font-semibold text-slate-700">
              Today ({todayDateStr}): {alreadyScannedToday ? (
                <strong className="text-emerald-700 font-bold">1/1 Check-in Done</strong>
              ) : (
                <strong className="text-indigo-700 font-bold">1 Check-in / Day</strong>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: QR ATTENDANCE STATION STATUS */}
      {isTodayQRBroadcastLive ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>QR Station Active • Posted by Academic Manager</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20 text-[11px] font-mono font-bold">
                  Main Gate - Entrance Station #1
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                School Entrance QR Attendance Station
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The Academic Manager has posted today's dynamic QR code. Scan the code displayed at the entrance station with your camera to record your daily attendance.
              </p>
              <div className="flex items-center gap-3 text-xs text-blue-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>1 scan per teacher per day • Manager signature verified</span>
              </div>
            </div>

            <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-center gap-3">
              {alreadyScannedToday ? (
                <div className="w-full px-5 py-3.5 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl text-xs font-bold text-emerald-300 flex items-center justify-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-black">Attendance Recorded for Today</p>
                    <p className="text-[11px] text-emerald-400/90 font-medium font-mono">
                      Logged: {todayPersonalRecord?.checkInTime || '08:15 AM'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full">
                  <button
                    onClick={onOpenScanner}
                    className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.02]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera to Scan Today's QR</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>QR Attendance Station:</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-200">
                  Today's QR Has Not Been Posted Yet
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The Academic Manager will post today's official attendance QR code. Once posted, you will be able to scan and record check-in.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL LINK ENTRY CARD (Exact user requested layout) */}
      {/* ========================================================================= */}
      {currentUser.role === 'teacher' && !alreadyScannedToday && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Manual link entry
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Paste the attendance link your mentor shared to check in.
            </p>
          </div>

          {linkError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{linkError}</span>
            </div>
          )}

          <form onSubmit={handleManualLinkCheckIn} className="space-y-4 max-w-2xl">
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={manualLinkInput}
                onChange={(e) => setManualLinkInput(e.target.value)}
                placeholder="https://…/attendance?code=…"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Check in with link</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenScanner}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-slate-600" />
                <span>Or use Camera Scanner</span>
              </button>
            </div>
          </form>

          {/* Attendance Rules Window */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-2xl space-y-2 text-xs">
            <div className="space-y-1.5 text-slate-700">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>Present:</strong> within the first 15 minutes.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span><strong>Late:</strong> after 15 minutes but before the session closes.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span><strong>Absent:</strong> no valid scan before closing.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentUser.role === 'teacher' ? 'My Present Days' : 'Present'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {currentUser.role === 'teacher' ? personalPresentCount : totalPresentFaculty}
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              On-Time
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentUser.role === 'teacher' ? 'My Late Days' : 'Late'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {currentUser.role === 'teacher' ? personalLateCount : totalLateFaculty}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Check-In
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentUser.role === 'teacher' ? 'My Absent Days' : 'Absent'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600 font-mono">
              {currentUser.role === 'teacher' ? personalAbsentCount : totalAbsentFaculty}
            </span>
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {currentUser.role === 'teacher' ? 'Unrecorded' : 'Absent Roster'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-indigo-600 font-mono">
              {currentUser.role === 'teacher' ? attendanceRate : facultyAttendanceRate}%
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {currentUser.role === 'teacher' ? `${totalClasses} Days Logged` : `${facultyCount} Faculty`}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: ROSTER TABLE (ONLY FOR MANAGERS - HIDDEN FROM TEACHERS) */}
      {currentUser.role === 'manager' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-900">Today's Faculty Attendance Roster</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live status for all school faculty members on {todayDateStr}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search faculty..."
                  className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setRosterStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    rosterStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({facultyCount})
                </button>
                <button
                  onClick={() => setRosterStatusFilter('present')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    rosterStatusFilter === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
                  }`}
                >
                  Present ({totalPresentFaculty})
                </button>
                <button
                  onClick={() => setRosterStatusFilter('late')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    rosterStatusFilter === 'late' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700'
                  }`}
                >
                  Late ({totalLateFaculty})
                </button>
                <button
                  onClick={() => setRosterStatusFilter('absent')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    rosterStatusFilter === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'
                  }`}
                >
                  Absent ({totalAbsentFaculty})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-5">Faculty Member</th>
                  <th className="py-3 px-5">Department & Subject</th>
                  <th className="py-3 px-5">Employee ID</th>
                  <th className="py-3 px-5">Check-In Time</th>
                  <th className="py-3 px-5">Verification Gate</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map(({ member, log, status }) => {
                  const isCurrentUser = member.employeeId === currentUser.employeeId || member.name === currentUser.name;
                  
                  return (
                    <tr key={member.id} className={`hover:bg-slate-50/70 transition-colors ${isCurrentUser ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={member.avatarUrl || member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={member.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500">{member.role === 'teacher' ? 'Faculty Member' : 'Academic Administration'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-800">{member.subject || member.subjects?.[0] || 'Faculty'}</p>
                        <p className="text-[10px] text-slate-400">{member.department || 'General Faculty'}</p>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600 font-semibold">
                        {member.employeeId}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-700">
                        {log?.checkInTime || '--:--'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                        {log?.checkInMethod === 'qr' ? 'Terminal #1 (Entrance QR)' : log ? 'Manager Manual Override' : 'Awaiting Check-in'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {status === 'present' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Present</span>
                          </span>
                        ) : status === 'late' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                            <Clock className="w-3 h-3" />
                            <span>Late</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                            <XCircle className="w-3 h-3" />
                            <span>Absent</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: TEACHER'S PERSONAL MONTHLY ATTENDANCE CALENDAR */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-900">{displayedMonthName} Personal Log</h2>
              <button
                onClick={handleJumpToToday}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                Today (Aug 21)
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personal attendance record • 1 shift check-in per day
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev Month</span>
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 rounded-lg border border-slate-200 min-w-[120px] text-center">
              {displayedMonthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Next Month"
            >
              <span className="hidden sm:inline">Next Month</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {weekdays.map((day) => (
              <div key={day} className="py-1.5">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 rounded-xl bg-slate-50/50 border border-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const rec = attendanceDayMap.get(day);
              const isToday = isCurrentViewingAugust2026 && day === 21;
              const isSelected = selectedCalendarDay === day;
              let statusBg = 'bg-slate-50 border-slate-200 text-slate-700';
              let statusBadge = null;

              if (rec) {
                if (rec.status === 'present') {
                  statusBg = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                  statusBadge = <span className="w-2 h-2 rounded-full bg-emerald-500" />;
                } else if (rec.status === 'late') {
                  statusBg = 'bg-amber-50 border-amber-300 text-amber-900';
                  statusBadge = <span className="w-2 h-2 rounded-full bg-amber-500" />;
                } else if (rec.status === 'absent') {
                  statusBg = 'bg-rose-50 border-rose-300 text-rose-900';
                  statusBadge = <span className="w-2 h-2 rounded-full bg-rose-500" />;
                }
              }

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedCalendarDay(day)}
                  className={`h-16 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${statusBg} ${
                    isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-xs'
                  } ${isToday ? 'border-indigo-500 font-bold' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isToday ? 'text-indigo-600 font-black' : ''}`}>{day}</span>
                    {statusBadge}
                  </div>
                  {rec && (
                    <span className="text-[9px] font-mono truncate font-semibold">
                      {rec.checkInTime || rec.status}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
