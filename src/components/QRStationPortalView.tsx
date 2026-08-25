import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  Search, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  Sliders, 
  Building, 
  UserPlus, 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldAlert,
  Calendar,
  Sparkles,
  StopCircle,
  PlayCircle,
  RefreshCw,
  X,
  Radio,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Copy,
  Check,
  Timer,
  Megaphone,
  BarChart3,
  User,
  Plus,
  Download,
  Filter,
  FileText,
  TrendingUp,
  Award,
  Pin,
  CheckCircle,
  Trash2,
  Printer
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { TeacherUser, AttendanceSession, NavTab, BroadcastQR, AttendanceTimeSettings, Announcement } from '../types';
import { storage } from '../lib/storage';
import { QRTimeAdjustmentModal } from './QRTimeAdjustmentModal';
import { audioAlerts } from '../lib/audioAlerts';

interface QRStationPortalViewProps {
  currentUser: TeacherUser;
  teachers?: TeacherUser[];
  users?: TeacherUser[];
  attendanceRecords?: AttendanceSession[];
  activeBroadcastQR?: BroadcastQR | null;
  broadcastQR?: BroadcastQR | null;
  onOpenKiosk: () => void;
  onManualMarkTeacher?: (teacher: TeacherUser | string, status: 'present' | 'late' | 'absent', note?: string) => void;
  onNavigateTab?: (tab: NavTab) => void;
  schoolName?: string;
  todayDateStr?: string;
  isLocked?: boolean;
  onToggleLock?: () => void;
  todayDateFormatted?: string;
  onPostTodayQR?: () => void;
  onRegenerateTodayQR?: () => void;
  onStopQR?: () => void;
  isAutoCreateQREnabled?: boolean;
  onToggleAutoCreateQR?: (enabled: boolean) => void;
  attendanceRules?: AttendanceTimeSettings;
  onSaveAttendanceRules?: (rules: AttendanceTimeSettings) => void;
  onUpdateBroadcastQR?: (qr: BroadcastQR) => void;
  announcements?: Announcement[];
  onSaveAnnouncements?: (announcements: Announcement[]) => void;
  onUpdateProfile?: (updated: Partial<TeacherUser>) => void;
  activeStationTab?: 'broadcast' | 'roster' | 'manual' | 'announcements' | 'reports' | 'settings' | 'profile';
  onSelectStationTab?: (tab: 'broadcast' | 'roster' | 'manual' | 'announcements' | 'reports' | 'settings' | 'profile') => void;
}

export const QRStationPortalView: React.FC<QRStationPortalViewProps> = ({
  currentUser,
  teachers = [],
  users = [],
  attendanceRecords = [],
  activeBroadcastQR,
  broadcastQR,
  onOpenKiosk,
  onManualMarkTeacher,
  schoolName = 'EduSchool International Academy',
  todayDateStr = '2026-08-21',
  todayDateFormatted = 'August 21, 2026',
  onPostTodayQR,
  onRegenerateTodayQR,
  onStopQR,
  isAutoCreateQREnabled = true,
  onToggleAutoCreateQR,
  attendanceRules = {
    morningStart: '07:30 AM',
    morningEnd: '09:30 AM',
    lateThreshold: '08:15 AM',
    createTime: '07:30',
    lateTime: '08:15',
    lateAfterMinutes: 15,
    stopTime: '09:30',
    qrDefaultExpiryMinutes: 120,
    enforceOneScanPerDay: true,
    gracePeriodMinutes: 15,
    autoSendQREnabled: true,
    autoSendTime: '07:30 AM',
    broadcastTarget: 'single_kiosk_device',
    targetDeviceName: 'School Entrance Terminal (Device #1)'
  },
  onSaveAttendanceRules = (_rules: AttendanceTimeSettings) => {},
  onUpdateBroadcastQR,
  announcements = [],
  onSaveAnnouncements,
  onUpdateProfile,
  activeStationTab: propActiveStationTab,
  onSelectStationTab: propOnSelectStationTab
}) => {
  const safeTeachers = (teachers && teachers.length > 0 ? teachers : users) || [];
  const facultyTeachers = safeTeachers.filter(t => t.role === 'teacher');
  const effectiveBroadcastQR = activeBroadcastQR || broadcastQR || null;

  // Active Station Navigation Menu Tab
  const [internalStationTab, setInternalStationTab] = useState<
    'broadcast' | 'roster' | 'manual' | 'announcements' | 'reports' | 'settings' | 'profile'
  >('broadcast');

  const activeStationTab = propActiveStationTab !== undefined ? propActiveStationTab : internalStationTab;
  const setActiveStationTab = (tab: 'broadcast' | 'roster' | 'manual' | 'announcements' | 'reports' | 'settings' | 'profile') => {
    setInternalStationTab(tab);
    if (propOnSelectStationTab) {
      propOnSelectStationTab(tab);
    }
  };

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [terminalName, setTerminalName] = useState<string>('Main Gate - Entrance Station #1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  
  // 15-Second Dynamic Token & Rotation State
  const [slotIndex, setSlotIndex] = useState<number>(0);
  const [secondsRemaining15s, setSecondsRemaining15s] = useState<number>(15);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedDirectLink, setCopiedDirectLink] = useState<boolean>(false);

  // Time Adjustment Modal
  const [isTimeModalOpen, setIsTimeModalOpen] = useState<boolean>(false);

  // Station Lock State
  const [isStationLocked, setIsStationLocked] = useState<boolean>(() => storage.getStationLockState());
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState<string>('');
  const [showUnlockPassword, setShowUnlockPassword] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Auto Create QR Local Toggle
  const [autoCreateEnabled, setAutoCreateEnabled] = useState<boolean>(() => storage.getAutoCreateQREnabled());

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Announcements State (Local fallback if onSaveAnnouncements not provided)
  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>(announcements);
  const [announcementSearch, setAnnouncementSearch] = useState<string>('');
  const [announcementPriorityFilter, setAnnouncementPriorityFilter] = useState<string>('all');
  const [isNewAnnouncementModalOpen, setIsNewAnnouncementModalOpen] = useState<boolean>(false);
  const [newAnnTitle, setNewAnnTitle] = useState<string>('');
  const [newAnnContent, setNewAnnContent] = useState<string>('');
  const [newAnnPriority, setNewAnnPriority] = useState<'urgent' | 'normal' | 'info'>('normal');
  const [newAnnPinned, setNewAnnPinned] = useState<boolean>(false);

  // Quick Print Modal & Search state for Reports tab
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  // Synchronize incoming announcements
  useEffect(() => {
    if (announcements && announcements.length > 0) {
      setLocalAnnouncements(announcements);
    }
  }, [announcements]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Digital Clock & 15s Slot Index Calculation
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
      
      const nowMs = now.getTime();
      const currentSlot = Math.floor(nowMs / 15000);
      setSlotIndex(currentSlot);
      
      const secRem = 15 - (Math.floor(nowMs / 1000) % 15);
      setSecondsRemaining15s(secRem);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync station lock state changes to storage
  const handleSetLock = (locked: boolean) => {
    setIsStationLocked(locked);
    storage.saveStationLockState(locked);
    if (!locked) {
      setIsUnlockModalOpen(false);
      setUnlockPasswordInput('');
      setUnlockError(null);
    }
  };

  // Handle station unlock
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = unlockPasswordInput.trim();
    if (clean === '1234' || clean === 'admin' || clean === 'station' || clean === '0000' || clean === 'manager') {
      handleSetLock(false);
      showToast('Entrance Station unlocked successfully.');
    } else {
      setUnlockError('Incorrect station passcode. Default passcodes: 1234 or admin');
    }
  };

  // Toggle Auto Create QR
  const handleToggleAutoCreate = (enabled: boolean) => {
    setAutoCreateEnabled(enabled);
    storage.saveAutoCreateQREnabled(enabled);
    if (onToggleAutoCreateQR) {
      onToggleAutoCreateQR(enabled);
    }
    showToast(`Auto-create QR code is now ${enabled ? 'ENABLED' : 'DISABLED'}.`);
  };

  // Check if QR is valid for today
  const isQrValidForToday = Boolean(
    effectiveBroadcastQR &&
    effectiveBroadcastQR.isActive &&
    effectiveBroadcastQR.generatedDate === todayDateStr &&
    effectiveBroadcastQR.expiresAt > Date.now()
  );

  // Dynamic 15-Second Rolling Token
  const dynamic15sToken = isQrValidForToday && effectiveBroadcastQR?.token
    ? `${effectiveBroadcastQR.token}#15S_SLOT_${slotIndex}`
    : '';

  // Synchronized Dynamic Manual Attendance Link
  const dynamicManualLinkUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attendance?code=${encodeURIComponent(dynamic15sToken)}`
    : `https://abunegorgorios.edu/attendance?code=${encodeURIComponent(dynamic15sToken)}`;

  // Generate QR Code data URL dynamically synchronized with the 15-second slot index
  useEffect(() => {
    if (isQrValidForToday && dynamic15sToken) {
      QRCodeLib.toDataURL(dynamic15sToken, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then(setQrDataUrl)
        .catch(console.error);
    } else {
      setQrDataUrl('');
    }
  }, [isQrValidForToday, dynamic15sToken]);

  // Dynamic Late and Stop Time Parameters
  const lateMinutes = effectiveBroadcastQR?.lateAfterMinutes !== undefined
    ? effectiveBroadcastQR.lateAfterMinutes
    : (attendanceRules?.lateAfterMinutes ?? 15);
  const stopTimeStr = effectiveBroadcastQR?.stopTime || attendanceRules?.stopTime || '09:30';
  const lateTimeStr = effectiveBroadcastQR?.lateTime || attendanceRules?.lateTime || '08:15';
  const createTimeStr = effectiveBroadcastQR?.createTime || effectiveBroadcastQR?.postTime || attendanceRules?.createTime || '07:30';

  // Filtered Today Attendance Records
  const todayRecords = attendanceRecords.filter(r => r.date === todayDateStr || r.date === todayDateFormatted);
  const checkedInTeacherIds = new Set(todayRecords.map(r => r.teacherId).filter(Boolean));
  const totalCheckedIn = todayRecords.length;
  const remainingCount = Math.max(0, facultyTeachers.length - totalCheckedIn);
  const presentCount = todayRecords.filter(r => r.status === 'present').length;
  const lateCount = todayRecords.filter(r => r.status === 'late').length;
  const attendanceRate = facultyTeachers.length > 0
    ? Math.min(100, Math.round((totalCheckedIn / facultyTeachers.length) * 100))
    : 0;

  // Departments List
  const departmentsList = Array.from(new Set(safeTeachers.map(t => t.department).filter(Boolean)));

  // Filtered Faculty for Roster / Manual desk
  const filteredTeachers = facultyTeachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === 'all' || t.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  // Manual mark helper
  const handlePerformStationScan = (teacherId: string, status: 'present' | 'late' = 'present') => {
    const teacher = safeTeachers.find(t => t.employeeId === teacherId || t.id === teacherId);
    if (!teacher) return;

    // Trigger audible tone
    if (status === 'late') {
      audioAlerts.playLateAlertTone();
    } else {
      audioAlerts.playPresentChime();
    }

    if (onManualMarkTeacher) {
      onManualMarkTeacher(teacher, status, `Verified by ${currentUser.name} at Entrance Station #1`);
    }
    showToast(`Checked in ${teacher.name} (${teacher.employeeId}) as ${status.toUpperCase()}!`);
  };

  // Delete Station Announcement
  const handleDeleteStationAnnouncement = (id: string) => {
    const updated = localAnnouncements.filter(a => a.id !== id);
    setLocalAnnouncements(updated);
    if (onSaveAnnouncements) {
      onSaveAnnouncements(updated);
    }
    showToast('Station announcement removed from bulletin.');
  };

  // Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    let csv = `Institution,${schoolName}\n`;
    csv += `Terminal Device,${terminalName}\n`;
    csv += `Date,${todayDateFormatted} (${todayDateStr})\n`;
    csv += `Exported By,${currentUser.name} (${currentUser.role})\n\n`;
    csv += `Record ID,Teacher Name,Employee ID,Department,Check-In Time,Status,Verification Station,Note\n`;
    
    facultyTeachers.forEach(t => {
      const rec = todayRecords.find(r => r.teacherId === t.employeeId || r.teacherName === t.name);
      if (rec) {
        csv += `"${rec.id}","${t.name}","${t.employeeId}","${t.department || 'Faculty'}","${rec.checkInTime}","${rec.status.toUpperCase()}","Entrance Station #1","${rec.note || 'Verified'}"\n`;
      } else {
        csv += `"--","${t.name}","${t.employeeId}","${t.department || 'Faculty'}","--","ABSENT / PENDING","Entrance Station #1","Not arrived yet"\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Station_Attendance_${todayDateStr}.csv`;
    link.click();
    showToast('Attendance report exported to CSV successfully.');
  };

  // Post new Announcement handler
  const handleCreateStationAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    const newAnnouncement: Announcement = {
      id: `ann-station-${Date.now()}`,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      date: todayDateStr,
      author: currentUser.name,
      authorRole: 'QR Station Mentor / Entrance Officer',
      priority: newAnnPriority,
      category: 'Mentor Bulletin',
      pinned: newAnnPinned
    };

    const updated = [newAnnouncement, ...localAnnouncements];
    setLocalAnnouncements(updated);
    if (onSaveAnnouncements) {
      onSaveAnnouncements(updated);
    }

    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnPinned(false);
    setIsNewAnnouncementModalOpen(false);
    showToast('New Station Announcement posted to Bulletin!');
  };

  // Filtered Announcements
  const filteredAnnouncementsList = localAnnouncements.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      a.content.toLowerCase().includes(announcementSearch.toLowerCase());
    const matchesPriority = announcementPriorityFilter === 'all' || a.priority === announcementPriorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Station Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>{terminalName}</span>
            </span>
            <span className="px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Station Mentor Desk</span>
            </span>
            {isQrValidForToday ? (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>QR Live (15s Dynamic Sync)</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>QR Broadcast Stopped</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Entrance Station Portal
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 font-medium">
            Live attendance broadcasting, faculty roster verification, announcements & real-time analytics
          </p>
        </div>

        {/* Live Clock & Quick Adjust Action */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="bg-black/30 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 text-right">
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-300">
              {currentTime || '07:30:00 AM'}
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              {currentDateStr || todayDateFormatted}
            </div>
          </div>

          {/* Adjust QR Times Button */}
          <button
            type="button"
            onClick={() => setIsTimeModalOpen(true)}
            id="station-adjust-times-btn"
            className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:scale-[1.02]"
            title="Adjust Create Time, Late Time, Late After Minutes, and Stop Time"
          >
            <Sliders className="w-4 h-4 text-slate-950" />
            <span>Adjust QR Times</span>
          </button>

          <button
            type="button"
            onClick={onOpenKiosk}
            className="px-4 py-3 bg-white text-slate-950 hover:bg-amber-50 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-[1.02]"
          >
            <Maximize2 className="w-4 h-4 text-amber-600" />
            <span>Kiosk Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Real-time Attendance Timing Strip */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-6 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Create / Start Time:</span>
            <strong className="text-emerald-300 font-mono">{createTimeStr}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">Late After:</span>
            <strong className="text-amber-300 font-mono">{lateMinutes} min</strong>
            <span className="text-slate-500 font-mono text-[11px]">({lateTimeStr})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-slate-400">Stop Time:</span>
            <strong className="text-rose-300 font-mono">{stopTimeStr}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">15s Sync Rotation:</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-mono font-bold flex items-center gap-1">
            <Timer className="w-3 h-3 text-indigo-400 animate-spin" />
            <span>Next in {secondsRemaining15s}s</span>
          </span>
        </div>
      </div>

      {/* Station Navigation Menu */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveStationTab('broadcast')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeStationTab === 'broadcast'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Live QR Display</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStationTab('roster')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeStationTab === 'roster'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Faculty Roster ({facultyTeachers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStationTab('manual')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeStationTab === 'manual'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Manual Officer Desk</span>
        </button>

        {/* 1. Announcements */}
        <button
          type="button"
          onClick={() => setActiveStationTab('announcements')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeStationTab === 'announcements'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements ({localAnnouncements.length})</span>
        </button>

        {/* 2. Reports */}
        <button
          type="button"
          onClick={() => setActiveStationTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeStationTab === 'reports'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reports & Analytics</span>
        </button>

        {/* 3. Settings */}
        <button
          type="button"
          onClick={() => setActiveStationTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeStationTab === 'settings'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Settings & QR Controls</span>
        </button>

        {/* 4. Profile */}
        <button
          type="button"
          onClick={() => setActiveStationTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeStationTab === 'profile'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Officer Info</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE QR BROADCAST DISPLAY */}
      {/* ========================================================================= */}
      {activeStationTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main QR Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col items-center justify-center text-center space-y-6">
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-600" />
                  <span>Entrance Attendance QR Code</span>
                </h2>
                <p className="text-xs text-slate-500">Live dynamic rotating token for faculty smartphone scanning</p>
              </div>

              <div className="flex items-center gap-2">
                {isQrValidForToday ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>QR Active (15s Rotation)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>QR Stopped</span>
                  </span>
                )}
              </div>
            </div>

            {isQrValidForToday && qrDataUrl ? (
              <div className="space-y-4 max-w-lg w-full">
                <div className="p-4 bg-slate-900 rounded-3xl shadow-xl border-4 border-amber-500/30 inline-block relative">
                  <img
                    src={qrDataUrl}
                    alt="Main Gate Attendance QR"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-2xl"
                  />
                  <div className="mt-2 w-full bg-slate-950 text-slate-200 px-3 py-1.5 rounded-xl text-center flex items-center justify-between text-[11px] font-mono font-bold border border-slate-800">
                    <span className="text-amber-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      15s Rolling Token
                    </span>
                    <span className="text-emerald-400">Rotates in {secondsRemaining15s}s</span>
                  </div>
                </div>

                {/* Direct Link Box Synchronized Every 15 Seconds */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-amber-600" />
                      <span>Mentor Attendance Direct Link (15s Dynamic Sync)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dynamicManualLinkUrl);
                        setCopiedDirectLink(true);
                        setTimeout(() => setCopiedDirectLink(false), 2000);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedDirectLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDirectLink ? 'Copied' : 'Copy 15s Link'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all select-all">
                    {dynamicManualLinkUrl}
                  </div>

                  {/* Dynamic Timing Rules Window */}
                  <div className="pt-2 text-xs space-y-1.5 text-slate-600 border-t border-slate-200/80">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span><strong>Present:</strong> within the first {lateMinutes} minutes.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span><strong>Late:</strong> after {lateMinutes} minutes ({lateTimeStr}) but before the session closes ({stopTimeStr}).</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span><strong>Absent:</strong> no valid scan before closing ({stopTimeStr}).</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <StopCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">QR Code Currently Stopped</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    No active QR token is running for today. You can auto-create or post a new QR code below.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onPostTodayQR) onPostTodayQR();
                    }}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Start / Create QR Code Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="w-full pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimeModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adjust Times</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetLock(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Display</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenKiosk}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen Kiosk</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isQrValidForToday && onStopQR && (
                  <button
                    type="button"
                    onClick={onStopQR}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Stop QR Code</span>
                  </button>
                )}

                {onRegenerateTodayQR && (
                  <button
                    type="button"
                    onClick={onRegenerateTodayQR}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Token</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel: Today's Verified Arrivals */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Today's Verified Arrivals
              </h3>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                {todayRecords.length} Logged
              </span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {todayRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No check-ins recorded yet today.</p>
                </div>
              ) : (
                todayRecords.map(rec => {
                  const teacher = safeTeachers.find(t => t.employeeId === rec.teacherId || t.name === rec.teacherName);
                  return (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3 hover:bg-slate-100/80 transition-all"
                    >
                      <img
                        src={teacher?.avatarUrl || teacher?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={rec.teacherName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{rec.teacherName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{rec.teacherId} • {rec.checkInTime}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FACULTY ROSTER */}
      {/* ========================================================================= */}
      {activeStationTab === 'roster' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span>Faculty Attendance Status</span>
              </h2>
              <p className="text-xs text-slate-500">Live roster of teachers and their attendance status for today</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Departments</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Terminal Station</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map(teacher => {
                  const record = todayRecords.find(r => r.teacherId === teacher.employeeId || r.teacherName === teacher.name);
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2.5">
                        <img
                          src={teacher.avatarUrl || teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={teacher.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{teacher.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{teacher.employeeId}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {teacher.department || 'General Faculty'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {record ? (
                          <span className="text-slate-900 font-bold">{record.checkInTime}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Arrived</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {record ? (record.room || 'Entrance Station #1') : '--'}
                      </td>
                      <td className="py-3.5 px-4">
                        {record ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            record.status === 'present' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {record ? (
                          <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePerformStationScan(teacher.employeeId, 'present')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Check In
                          </button>
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

      {/* ========================================================================= */}
      {/* TAB 3: MANUAL CHECK-IN DESK */}
      {/* ========================================================================= */}
      {activeStationTab === 'manual' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <span>Officer Manual Check-In Desk</span>
            </h2>
            <p className="text-xs text-slate-500">
              For faculty who left their phone at home or require manual entrance officer assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map(teacher => {
              const record = todayRecords.find(r => r.teacherId === teacher.employeeId || r.teacherName === teacher.name);
              return (
                <div 
                  key={teacher.id}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 hover:border-amber-300 transition-all shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={teacher.avatarUrl || teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={teacher.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{teacher.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{teacher.employeeId} • {teacher.department}</p>
                    </div>
                  </div>

                  {record ? (
                    <div className="p-2 bg-emerald-100/60 rounded-xl border border-emerald-200 text-center">
                      <p className="text-[11px] font-bold text-emerald-900 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Checked In at {record.checkInTime} ({record.status.toUpperCase()})
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePerformStationScan(teacher.employeeId, 'present')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Mark Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePerformStationScan(teacher.employeeId, 'late')}
                        className="py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Mark Late
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ANNOUNCEMENTS */}
      {/* ========================================================================= */}
      {activeStationTab === 'announcements' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <span>Station Bulletin & Announcements</span>
              </h2>
              <p className="text-xs text-slate-500">
                School-wide announcements, station duty notices, and emergency gate alerts
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewAnnouncementModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Post Station Announcement</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={announcementPriorityFilter}
              onChange={(e) => setAnnouncementPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="info">Information</option>
            </select>
          </div>

          {/* Announcements Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnnouncementsList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                <Megaphone className="w-10 h-10 mx-auto opacity-40 text-slate-500" />
                <p className="text-sm font-bold text-slate-700">No Announcements Found</p>
                <p className="text-xs text-slate-500">Post a new notice or change your search filter.</p>
              </div>
            ) : (
              filteredAnnouncementsList.map(item => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    item.pinned
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.pinned && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-bold flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            <span>Pinned</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : (item.priority === 'info' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700')
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.date}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStationAnnouncement(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>By: <strong className="text-slate-700">{item.author}</strong> ({item.authorRole})</span>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {activeStationTab === 'reports' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Headcount</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{facultyTeachers.length}</p>
              <p className="text-[11px] text-slate-500">Registered teaching staff</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Present Today</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{presentCount}</p>
              <p className="text-[11px] text-slate-500">On-time verified arrivals</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Late Arrivals</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{lateCount}</p>
              <p className="text-[11px] text-slate-500">After {lateMinutes} min cutoff</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Attendance Rate</span>
              <p className="text-2xl sm:text-3xl font-black text-blue-600">{attendanceRate}%</p>
              <p className="text-[11px] text-slate-500">{totalCheckedIn} of {facultyTeachers.length} checked in</p>
            </div>
          </div>

          {/* Department Breakdown & Arrival Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Department Attendance Distribution</span>
              </h3>
              
              <div className="space-y-3">
                {departmentsList.map(dept => {
                  const deptTeachers = facultyTeachers.filter(t => t.department === dept);
                  const deptArrived = deptTeachers.filter(t => checkedInTeacherIds.has(t.employeeId)).length;
                  const deptPct = deptTeachers.length > 0 ? Math.round((deptArrived / deptTeachers.length) * 100) : 0;
                  
                  return (
                    <div key={dept} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{dept}</span>
                        <span>{deptArrived}/{deptTeachers.length} ({deptPct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                          style={{ width: `${deptPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Arrival Timing Breakdown</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Quick Print Report"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAttendanceCSV}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">On-Time (within first {lateMinutes} mins):</span>
                  <strong className="text-emerald-700 font-mono text-sm">{presentCount} Teachers</strong>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Late (after {lateMinutes} mins, before {stopTimeStr}):</span>
                  <strong className="text-amber-700 font-mono text-sm">{lateCount} Teachers</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Pending / Absent:</span>
                  <strong className="text-rose-700 font-mono text-sm">{remainingCount} Teachers</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Attendance parameters configured: Create Time {createTimeStr}, Late Threshold {lateMinutes} min ({lateTimeStr}), Stop Time {stopTimeStr}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SETTINGS & QR CONTROLS */}
      {/* ========================================================================= */}
      {activeStationTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Entrance Terminal Station Settings</span>
            </h2>
            <p className="text-xs text-slate-500">Configure time adjustments, automated QR creation, active token stopping, and station lock</p>
          </div>

          <div className="space-y-5">
            {/* TIMING ADJUSTMENT CONTROL CARD */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl border border-slate-800 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>QR Attendance Timing Rules (Create, Late & Stop Times)</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Adjust when the daily QR code activates, the late arrival cutoff threshold, and when the session closes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimeModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adjust Times Now</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs font-mono">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-emerald-300 block uppercase font-sans font-bold">Create Time</span>
                  <span className="text-white font-bold">{createTimeStr}</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-amber-300 block uppercase font-sans font-bold">Late After</span>
                  <span className="text-white font-bold">{lateMinutes} min ({lateTimeStr})</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-rose-300 block uppercase font-sans font-bold">Stop Time</span>
                  <span className="text-white font-bold">{stopTimeStr}</span>
                </div>
              </div>
            </div>

            {/* Terminal Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Terminal Device Title</label>
              <input
                type="text"
                value={terminalName}
                onChange={(e) => setTerminalName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              />
            </div>

            {/* AUTO CREATE QR CODE SECTION */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Auto Create QR Code</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Automatically generate and maintain an active daily QR code for faculty attendance
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAutoCreate(!autoCreateEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    autoCreateEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {autoCreateEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600">
                  Status: {autoCreateEnabled ? 'Auto creation active on session startup' : 'Manual creation mode'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onPostTodayQR) onPostTodayQR();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Auto Create QR Code Now</span>
                </button>
              </div>
            </div>

            {/* STOP QR CODE SECTION */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <StopCircle className="w-4 h-4 text-rose-600" />
                    <span>Stop QR Code (Deactivate Attendance)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Immediately stops/revokes the active attendance QR code to halt check-in scanning
                  </p>
                </div>
                
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  isQrValidForToday ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isQrValidForToday ? 'QR Active' : 'QR Stopped'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-600">
                  {isQrValidForToday ? 'Click below to stop attendance check-in immediately.' : 'QR Code is already stopped.'}
                </p>
                
                {isQrValidForToday && onStopQR ? (
                  <button
                    type="button"
                    onClick={onStopQR}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Stop QR Code Now</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onPostTodayQR) onPostTodayQR();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Restart QR Code</span>
                  </button>
                )}
              </div>
            </div>

            {/* Audio Chime */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Audio Chime On Verified Scan</p>
                <p className="text-[11px] text-slate-500">Plays a pleasant chime when teacher check-in succeeds</p>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Lock Station Button */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-950">Engage Station Lock Mode</p>
                <p className="text-[11px] text-amber-800">
                  Locks settings and puts station in high-visibility QR scanning kiosk mode.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSetLock(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Station Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PROFILE & OFFICER INFO */}
      {/* ========================================================================= */}
      {activeStationTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 max-w-3xl">
          <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
            <img
              src={currentUser.avatarUrl || currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{currentUser.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                  Station Mentor
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.employeeId} • {currentUser.email}</p>
              <p className="text-xs text-amber-700 font-semibold mt-1">Terminal Gate Assignment: {terminalName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Institution</span>
              <p className="text-xs font-bold text-slate-900">{schoolName}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Terminal ID</span>
              <p className="text-xs font-bold text-slate-900">STATION-GATE-01</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assigned Shift</span>
              <p className="text-xs font-bold text-slate-900">07:00 AM - 17:00 PM (Morning & Afternoon Gate Duty)</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Station Security Clearance</span>
              <p className="text-xs font-bold text-emerald-700">QR Broadcast & Attendance Desk Mentor</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Officer Duty Checklist</span>
            </h4>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>Keep live QR code display open for teachers scanning on arrival.</li>
              <li>Use the 15s dynamic direct link for faculty if camera scanning is unavailable.</li>
              <li>Adjust Create Time, Late cutoff time, and Stop time via the Adjust Times modal.</li>
              <li>Manually check in faculty from the Manual Officer Desk when requested.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Post New Announcement Modal */}
      {isNewAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span>Post Station Announcement</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewAnnouncementModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStationAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Entrance Gate 1 Maintenance / Faculty Briefing"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Content:</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the announcement details for teachers arriving today..."
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority:</label>
                  <select
                    value={newAnnPriority}
                    onChange={(e) => setNewAnnPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="info">Information</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnPinned}
                      onChange={(e) => setNewAnnPinned(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Pin to top of bulletin</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAnnouncementModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Timing & Threshold Adjustment Modal for Station Mentor */}
      <QRTimeAdjustmentModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        currentUser={currentUser}
        attendanceRules={attendanceRules}
        onSaveRules={(newRules) => {
          onSaveAttendanceRules(newRules);
          showToast('Attendance timing (Create Time, Late cutoff, Stop Time) updated successfully!');
        }}
        broadcastQR={effectiveBroadcastQR}
        onUpdateBroadcastQR={onUpdateBroadcastQR}
        roleContext="mentor"
      />

      {/* QUICK PRINT MODAL FOR PRINTER-FRIENDLY ATTENDANCE SUMMARY */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Controls Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Quick Print • Official Daily Attendance Summary</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Content */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="quick-print-document">
              {/* Official Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs uppercase font-bold text-amber-700 tracking-wider">
                  <Building className="w-4 h-4" />
                  <span>{schoolName}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  Daily Faculty Attendance & Verification Summary
                </h2>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
                  <span><strong>Date:</strong> {todayDateFormatted} ({todayDateStr})</span>
                  <span>•</span>
                  <span><strong>Terminal:</strong> Entrance Station #1</span>
                  <span>•</span>
                  <span><strong>Officer in Charge:</strong> {currentUser.name}</span>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-2 text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="p-2 border-r border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Headcount</span>
                  <p className="text-lg font-black text-slate-900">{facultyTeachers.length}</p>
                </div>
                <div className="p-2 border-r border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Present (On-Time)</span>
                  <p className="text-lg font-black text-emerald-700">{presentCount}</p>
                </div>
                <div className="p-2 border-r border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Late Arrivals</span>
                  <p className="text-lg font-black text-amber-700">{lateCount}</p>
                </div>
                <div className="p-2">
                  <span className="text-[10px] uppercase font-bold text-blue-700">Attendance Rate</span>
                  <p className="text-lg font-black text-blue-700">{attendanceRate}%</p>
                </div>
              </div>

              {/* Simplified Tabular Breakdown */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 uppercase text-[10px]">
                      <th className="py-2 px-2.5 border-r border-slate-300 w-10 text-center">#</th>
                      <th className="py-2 px-2.5 border-r border-slate-300">Teacher Name</th>
                      <th className="py-2 px-2.5 border-r border-slate-300">ID</th>
                      <th className="py-2 px-2.5 border-r border-slate-300">Department</th>
                      <th className="py-2 px-2.5 border-r border-slate-300">Check-in Time</th>
                      <th className="py-2 px-2.5 border-r border-slate-300">Status</th>
                      <th className="py-2 px-2.5">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {facultyTeachers.map((t, idx) => {
                      const rec = todayRecords.find(r => r.teacherId === t.employeeId || r.teacherName === t.name);
                      const isPres = rec?.status === 'present';
                      const isLate = rec?.status === 'late';
                      const statusText = isPres ? 'PRESENT' : (isLate ? 'LATE' : 'ABSENT');

                      return (
                        <tr key={t.id || t.employeeId} className="even:bg-slate-50/50">
                          <td className="py-2 px-2.5 border-r border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-2.5 border-r border-slate-300 font-bold text-slate-900">{t.name}</td>
                          <td className="py-2 px-2.5 border-r border-slate-300 font-mono text-slate-700">{t.employeeId}</td>
                          <td className="py-2 px-2.5 border-r border-slate-300 text-slate-700">{t.department || 'Academic Faculty'}</td>
                          <td className="py-2 px-2.5 border-r border-slate-300 font-mono font-medium text-slate-800">
                            {rec?.checkInTime || '--:--'}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-300 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                              isPres 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : (isLate ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                            }`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-[11px] text-slate-600">
                            {rec ? (rec.checkInMethod === 'qr' ? 'QR Terminal Scan' : 'Direct Link / Manual') : 'Awaiting Arrival'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures & Verification Block */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="font-bold text-slate-800 mb-6">Attendance Officer Verification:</p>
                  <div className="border-b border-slate-400 w-48 pb-1 text-slate-700 font-semibold">{currentUser.name}</div>
                  <p className="text-[10px] text-slate-500 mt-1">Signature & Date</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 mb-6">Academic Administration Stamp:</p>
                  <div className="border-b border-slate-400 w-48 ml-auto pb-1 text-slate-700 font-semibold">{schoolName}</div>
                  <p className="text-[10px] text-slate-500 mt-1">Authorized Seal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
