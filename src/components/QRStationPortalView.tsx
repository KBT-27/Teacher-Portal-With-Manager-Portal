import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Search, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  Laptop, 
  Wifi, 
  Smartphone, 
  Sliders, 
  Building, 
  UserPlus, 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldAlert,
  Calendar,
  XCircle,
  Sparkles,
  StopCircle,
  PlayCircle,
  RefreshCw,
  X,
  Radio,
  Eye,
  EyeOff
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { TeacherUser, AttendanceSession, NavTab, BroadcastQR } from '../types';
import { storage } from '../lib/storage';
import { fastHash, hashPassword } from '../lib/utils';

interface QRStationPortalViewProps {
  currentUser: TeacherUser;
  teachers?: TeacherUser[];
  users?: TeacherUser[];
  attendanceRecords?: AttendanceSession[];
  activeBroadcastQR?: BroadcastQR | null;
  broadcastQR?: BroadcastQR | null;
  onOpenKiosk: () => void;
  onManualMarkTeacher?: (teacherId: string, status: 'present' | 'late' | 'absent') => void;
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
  onToggleAutoCreateQR
}) => {
  const safeTeachers = (teachers && teachers.length > 0 ? teachers : users) || [];
  const effectiveBroadcastQR = activeBroadcastQR || broadcastQR || null;
  const isManager = currentUser.role === 'manager';

  const [activeStationTab, setActiveStationTab] = useState<'broadcast' | 'scanner' | 'roster' | 'manual' | 'settings'>('broadcast');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [terminalName, setTerminalName] = useState<string>('Main Gate - Entrance Station #1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  
  // Scanned Teacher Overlay Alert (shows name, photo, status upon scan)
  const [scannedPopup, setScannedPopup] = useState<{
    teacher: TeacherUser;
    time: string;
    status: 'present' | 'late';
  } | null>(null);

  // Persistent Terminal Lock States
  const [isStationLocked, setIsStationLocked] = useState<boolean>(() => storage.getStationLockState());
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState<string>('');
  const [showUnlockPassword, setShowUnlockPassword] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Auto Create QR Local Toggle
  const [autoCreateEnabled, setAutoCreateEnabled] = useState<boolean>(() => storage.getAutoCreateQREnabled());

  // Scanner Simulator / Camera State
  const [isStationCameraActive, setIsStationCameraActive] = useState(false);
  const [scannerFeedback, setScannerFeedback] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [slotIndex, setSlotIndex] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Live Digital Clock & 15s Slot Index
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
      setSlotIndex(Math.floor(now.getTime() / 15000));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync station lock state changes to persistent storage
  const handleSetLock = (locked: boolean) => {
    setIsStationLocked(locked);
    storage.saveStationLockState(locked);
    if (!locked) {
      setIsUnlockModalOpen(false);
      setUnlockPasswordInput('');
      setUnlockError(null);
    }
  };

  // Toggle Auto Create QR
  const handleToggleAutoCreate = (enabled: boolean) => {
    setAutoCreateEnabled(enabled);
    storage.saveAutoCreateQREnabled(enabled);
    if (onToggleAutoCreateQR) {
      onToggleAutoCreateQR(enabled);
    }
  };

  // Check if there is a valid QR posted for TODAY
  const isQrValidForToday = Boolean(
    effectiveBroadcastQR &&
    effectiveBroadcastQR.isActive &&
    effectiveBroadcastQR.generatedDate === todayDateStr &&
    effectiveBroadcastQR.expiresAt > Date.now()
  );

  // Render QR data URL for the posted Manager token
  useEffect(() => {
    if (isQrValidForToday && effectiveBroadcastQR?.token) {
      const dynamicToken = `${effectiveBroadcastQR.token}#SLOT_${slotIndex}`;
      QRCodeLib.toDataURL(dynamicToken, {
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
  }, [isQrValidForToday, effectiveBroadcastQR?.token, slotIndex]);

  const todayRecords = (attendanceRecords || []).filter(r => r && r.date === todayDateStr);
  const presentCount = todayRecords.filter(r => r && r.status === 'present').length;
  const lateCount = todayRecords.filter(r => r && r.status === 'late').length;
  const totalCheckedIn = todayRecords.length;
  const facultyTeachers = safeTeachers.filter(t => t && t.role === 'teacher');
  const remainingCount = Math.max(0, facultyTeachers.length - totalCheckedIn);

  // Audio chime on successful check-in
  const playScanChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio context policy
    }
  };

  // Perform a teacher check-in scan (triggers animated popup with photo and name)
  const handlePerformStationScan = (teacherId: string, status: 'present' | 'late' = 'present') => {
    if (!isQrValidForToday) {
      alert("Cannot record attendance: Today's attendance QR code is currently stopped or has not been posted.");
      return;
    }
    const target = safeTeachers.find(t => (t.employeeId === teacherId || t.id === teacherId));
    if (!target) return;

    if (onManualMarkTeacher) {
      onManualMarkTeacher(target.employeeId, status);
    }
    playScanChime();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Trigger popup on screen
    setScannedPopup({
      teacher: target,
      time: timeStr,
      status
    });

    setScannerFeedback(`Verified check-in for ${target.name} (${status.toUpperCase()})`);

    // Auto-dismiss popup after 4 seconds
    setTimeout(() => {
      setScannedPopup(null);
    }, 4500);
  };

  // Unlock Station Modal Password Authentication
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const entered = unlockPasswordInput.trim();

    if (!entered) {
      setUnlockError('Please enter your password to unlock the station.');
      return;
    }

    const fastInput = fastHash(entered);
    const fullHash = await hashPassword(entered);

    // Accept Station Password, Current User Password, or Academic Manager Password
    const targetUser = currentUser;
    const expectedHash = targetUser.passwordHash;
    const isDirectMatch = 
      entered === 'Qr code 123' || 
      entered.toLowerCase() === 'qr code 123' ||
      entered === 'Manager 123' || 
      entered.toLowerCase() === 'manager 123';
    
    const isUserHashMatch = expectedHash && (expectedHash === fastInput || expectedHash === fullHash);
    
    // Check if manager account hash matches
    const managerUser = safeTeachers.find(t => t.role === 'manager');
    const isManagerHashMatch = managerUser?.passwordHash && (managerUser.passwordHash === fastInput || managerUser.passwordHash === fullHash);

    if (isDirectMatch || isUserHashMatch || isManagerHashMatch || isManager) {
      handleSetLock(false);
      setIsUnlockModalOpen(false);
      setUnlockPasswordInput('');
      setUnlockError(null);
    } else {
      setUnlockError('Incorrect passcode. Enter station password (Qr code 123) or Manager password.');
    }
  };

  // Screen Touch / Click handler when locked: open the password prompt
  const handleLockedScreenTouch = (e: React.MouseEvent) => {
    // If unlock modal is already open or target is inside modal, ignore
    if (isUnlockModalOpen) return;
    setIsUnlockModalOpen(true);
  };

  const filteredTeachers = facultyTeachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === 'all' || t.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const departmentsList = Array.from(new Set(facultyTeachers.map(t => t.department).filter(Boolean)));

  // =========================================================================
  // 1. LOCKED DISPLAY VIEW (When station is LOCKED)
  // Display shows the QR code prominently. When touched, asks for password.
  // When a person scans, their name and photo pop up with animation!
  // =========================================================================
  if (isStationLocked) {
    return (
      <div 
        onClick={handleLockedScreenTouch}
        className="min-h-[680px] bg-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-all animate-in fade-in"
      >
        {/* Background Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar of Locked Kiosk */}
        <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider">
                  Station Locked Mode
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-medium">Touch screen to unlock</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {terminalName}
              </h2>
            </div>
          </div>

          {/* Live Clock & Lock Status Indicator */}
          <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800 backdrop-blur-md">
            <div className="text-right pr-3 border-r border-slate-700">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Live Time</p>
              <p className="text-lg sm:text-xl font-mono font-black text-white">{currentTime || '--:--:--'}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsUnlockModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Station</span>
            </button>
          </div>
        </div>

        {/* Center: Live QR Display */}
        <div className="relative z-10 my-8 flex flex-col items-center justify-center text-center space-y-6">
          {isQrValidForToday && qrDataUrl ? (
            <div className="space-y-4">
              <div className="relative p-5 sm:p-6 bg-white rounded-3xl shadow-2xl border-4 border-amber-500/40 inline-block">
                <img
                  src={qrDataUrl}
                  alt="Faculty Attendance QR"
                  className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-2xl mx-auto"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-900 text-amber-400 border border-amber-500/50 text-[11px] font-mono font-black uppercase tracking-wider shadow-md">
                  15s Dynamic Rotation
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">
                  Scan with your mobile camera or teacher scanner
                </p>
                <p className="text-xs text-slate-400">
                  {schoolName} • Attendance Gate Terminal
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900/80 rounded-3xl border border-slate-800 text-center max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <StopCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">QR Attendance Stopped / Inactive</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The attendance QR code is currently inactive. Unlock the station to auto-create or post today's QR code.
                </p>
              </div>
            </div>
          )}

          {/* Quick Simulated Teacher Scan Picker (for testing scans while locked) */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-lg bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 space-y-2.5 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Arriving Teacher Scan / Badge Tap:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {totalCheckedIn}/{facultyTeachers.length} Checked In
              </span>
            </div>
            
            <div className="flex gap-2">
              <select
                id="locked-station-teacher-picker"
                disabled={!isQrValidForToday}
                onChange={(e) => {
                  if (e.target.value) {
                    handlePerformStationScan(e.target.value, 'present');
                    e.target.value = '';
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Tap Faculty Member to Scan --</option>
                {facultyTeachers.map(t => {
                  const isChecked = todayRecords.some(r => r.teacherId === t.employeeId || r.teacherName === t.name);
                  return (
                    <option key={t.id} value={t.employeeId}>
                      {isChecked ? '✓ ' : '○ '} {t.name} ({t.employeeId}) {isChecked ? '[Already Checked In]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="relative z-10 border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Attendance Terminal Online</span>
            <span className="text-slate-600">•</span>
            <span>Date: {todayDateFormatted}</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Touch anywhere on screen to enter Passcode & Unlock Station Settings
          </p>
        </div>

        {/* ========================================================================= */}
        {/* POPUP ALERT: When a Person Scans, Display their Photo, Name, Status */}
        {/* ========================================================================= */}
        {scannedPopup && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-200"
          >
            <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl p-8 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/20 text-center space-y-5 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                  Check-In Verified
                </span>
              </div>

              {/* Photo & Name */}
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={scannedPopup.teacher.avatarUrl || scannedPopup.teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={scannedPopup.teacher.name}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-emerald-500 shadow-xl"
                />
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {scannedPopup.teacher.name}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-400 font-mono mt-0.5">
                    {scannedPopup.teacher.employeeId} • {scannedPopup.teacher.department || 'Faculty'}
                  </p>
                </div>
              </div>

              {/* Time & Status */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-around text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Time</p>
                  <p className="text-base font-mono font-bold text-white">{scannedPopup.time}</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                  <p className={`text-base font-bold uppercase ${scannedPopup.status === 'present' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {scannedPopup.status}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScannedPopup(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Notification
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* UNLOCK MODAL: Prompt when screen is touched */}
        {/* ========================================================================= */}
        {isUnlockModalOpen && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  Station Locked
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Touch detected on display. Enter the station password or Academic Manager password to unlock settings.
                </p>
              </div>

              {unlockError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl animate-in shake flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{unlockError}</span>
                </div>
              )}

              <form onSubmit={handleUnlockSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password / Master Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showUnlockPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={unlockPasswordInput}
                      onChange={(e) => setUnlockPasswordInput(e.target.value)}
                      placeholder="Enter password (e.g. Qr code 123 or Manager 123)"
                      className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showUnlockPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlockModalOpen(false);
                      setUnlockPasswordInput('');
                      setUnlockError(null);
                    }}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel / Lock Screen
                  </button>

                  <button
                    type="submit"
                    id="modal-unlock-submit-btn"
                    className="py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Station</span>
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                Authorized Credentials: Station Passcode or Academic Manager
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. UNLOCKED STATION WORKSPACE
  // Full controls, Station Settings (Auto Create QR, Stop QR), Roster, Manual Desk
  // =========================================================================
  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      
      {/* Top Station Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-900/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Entrance Terminal Station</span>
              <span className="text-white/60">•</span>
              <span className="text-amber-200">Unlocked Mode</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {terminalName}
            </h1>
            
            <p className="text-sm text-amber-100/90 max-w-xl">
              Display station for faculty attendance check-in. Configure auto-create QR code, stop active QR code, or engage secure station lock.
            </p>
          </div>

          {/* Real-time Clock & Lock Station Quick Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <div className="text-left sm:text-right pr-2 sm:border-r border-white/20">
              <p className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Live Clock</p>
              <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">{currentTime || '--:--:--'}</p>
              <p className="text-[10px] text-slate-300">{currentDateStr}</p>
            </div>

            <button
              type="button"
              onClick={() => handleSetLock(true)}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-amber-100 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer transition-all shrink-0"
            >
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Lock Station Display</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15 text-white">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <p className="text-[11px] text-amber-200 font-bold uppercase">Present Today</p>
            <p className="text-xl font-black">{presentCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <p className="text-[11px] text-rose-200 font-bold uppercase">Late Arrivals</p>
            <p className="text-xl font-black">{lateCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <p className="text-[11px] text-blue-200 font-bold uppercase">Total Checked In</p>
            <p className="text-xl font-black">{totalCheckedIn}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <p className="text-[11px] text-slate-200 font-bold uppercase">Remaining Faculty</p>
            <p className="text-xl font-black">{remainingCount}</p>
          </div>
        </div>
      </div>

      {/* Station Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveStationTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeStationTab === 'manual'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Manual Officer Desk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStationTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeStationTab === 'settings'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Station Settings & QR Controls</span>
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
              <div>
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
                    <span>QR Code Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>QR Code Stopped</span>
                  </span>
                )}
              </div>
            </div>

            {isQrValidForToday && qrDataUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 rounded-3xl shadow-xl border-4 border-amber-500/30 inline-block">
                  <img
                    src={qrDataUrl}
                    alt="Main Gate Attendance QR"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-2xl"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Refreshes every 15 seconds to prevent static photo sharing
                </p>
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

          {/* Side Panel: Recent Check-in Feed */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center justify-between">
              <span>Today's Verified Arrivals</span>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {todayRecords.length}
              </span>
            </h3>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
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
                        rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
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
                              : 'bg-rose-100 text-rose-800'
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
                        className="py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
      {/* TAB 4: ENTRANCE TERMINAL STATION SETTINGS (Auto Create & Stop QR Code) */}
      {/* ========================================================================= */}
      {activeStationTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Entrance Terminal Station Settings</span>
            </h2>
            <p className="text-xs text-slate-500">Configure automated QR creation, active token stopping, and audio chimes</p>
          </div>

          <div className="space-y-5">
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

            {/* Authority / Security Constraints Note */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Academic Manager Master Authority</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The Academic Manager controls all institutional functions, including teacher credential administration, attendance reporting, QR token generation, and manual attendance overrides.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
