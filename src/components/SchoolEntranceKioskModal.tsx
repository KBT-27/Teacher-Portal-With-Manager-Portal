import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Clock, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  Radio, 
  Users, 
  Building, 
  RefreshCw, 
  X, 
  ShieldAlert, 
  UserCheck, 
  Check,
  AlertCircle,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { BroadcastQR, AttendanceSession, TeacherUser, AttendanceStatus, AttendanceTimeSettings } from '../types';
import { useRealTimeClock } from '../lib/timeUtils';

interface SchoolEntranceKioskModalProps {
  isOpen?: boolean;
  onClose: () => void;
  broadcastQR?: BroadcastQR | null;
  attendanceRecords?: AttendanceSession[];
  teachers?: TeacherUser[];
  onManualMarkTeacher?: (teacher: TeacherUser, status: AttendanceStatus, note?: string) => void;
  schoolName?: string;
  onRegenerateQR?: () => void;
  onPostTodayQR?: () => void;
  onRevokeQR?: () => void;
  token?: string;
  countdown?: number;
  isManager?: boolean;
  todayDateStr?: string;
  todayDateFormatted?: string;
  currentUser?: TeacherUser;
  attendanceRules?: AttendanceTimeSettings;
}

export const SchoolEntranceKioskModal: React.FC<SchoolEntranceKioskModalProps> = ({
  isOpen = true,
  onClose,
  broadcastQR,
  attendanceRecords = [],
  teachers = [],
  onManualMarkTeacher,
  schoolName = 'EduSchool International Academy',
  onRegenerateQR,
  onPostTodayQR,
  onRevokeQR,
  token,
  countdown,
  isManager = false,
  todayDateStr = '2026-08-21',
  todayDateFormatted: _todayDateFormatted,
  currentUser: _currentUser,
  attendanceRules
}) => {
  const { timeFormatted, dateFormatted } = useRealTimeClock();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');
  const [time15sRemaining, setTime15sRemaining] = useState(15);
  const [slotIndex, setSlotIndex] = useState(0);

  // Quick Teacher Manual Check-in selection state (only if enabled)
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [justCheckedInTeacher, setJustCheckedInTeacher] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const effectiveToken = token || broadcastQR?.token;
  const isQrValidForToday = Boolean(
    effectiveToken && 
    ((broadcastQR && broadcastQR.isActive && broadcastQR.generatedDate === todayDateStr && broadcastQR.generatedByRole === 'manager' && broadcastQR.expiresAt > Date.now()) || (isManager && token))
  );

  useEffect(() => {
    if (!isOpen) return;

    if (countdown !== undefined) {
      setTime15sRemaining(countdown);
      setCountdownStr(`${countdown}s rotation`);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      if (!broadcastQR || !broadcastQR.isActive || broadcastQR.expiresAt <= now) {
        setCountdownStr('Active 15s Rotation');
        return;
      }
      const diff = Math.max(0, broadcastQR.expiresAt - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hours > 0) {
        setCountdownStr(`${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      } else {
        setCountdownStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
      const current15sSec = 15 - (Math.floor(now / 1000) % 15);
      setTime15sRemaining(current15sSec);
      const currentSlot = Math.floor(now / 15000);
      setSlotIndex(currentSlot);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, broadcastQR, countdown]);

  useEffect(() => {
    if (!isOpen || !effectiveToken || !isQrValidForToday) {
      setQrDataUrl('');
      return;
    }

    const dynamicToken = `${effectiveToken}#15S_SLOT_${slotIndex}`;
    QRCodeLib.toDataURL(dynamicToken, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [isOpen, effectiveToken, slotIndex, isQrValidForToday]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleQuickCheckInTeacher = () => {
    if (!selectedTeacherId || !onManualMarkTeacher) return;
    const teacher = teachers.find(t => t.id === selectedTeacherId || t.employeeId === selectedTeacherId);
    if (!teacher) return;
    onManualMarkTeacher(teacher, 'present', 'Entrance Station #1 Kiosk Check-In');
    setJustCheckedInTeacher(teacher.name);
    setSelectedTeacherId('');
    setTimeout(() => setJustCheckedInTeacher(null), 3000);
  };

  const checkedInIds = new Set((attendanceRecords || []).map(r => r && r.teacherId).filter(Boolean));
  const facultyList = teachers.filter(t => t.role === 'teacher');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 animate-in fade-in select-none overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold uppercase tracking-wider">
                Main Gate - Entrance Station #1
              </span>
              {isQrValidForToday ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span>Manager QR Broadcast Active</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>Awaiting Manager QR for Today</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {schoolName} • Faculty Attendance Kiosk
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-black font-mono tracking-tight text-blue-400">
              {timeFormatted}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {dateFormatted}
            </div>
          </div>

          {/* Regenerate button is strictly for Academic Manager */}
          {isManager && onRegenerateQR && (
            <button
              id="kiosk-regenerate-resend-btn"
              type="button"
              onClick={onRegenerateQR}
              className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
              title="Regenerate code and re-send to Station #1"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>Manager: Regenerate Today's QR</span>
            </button>
          )}

          {isManager && isQrValidForToday && onRevokeQR && (
            <button
              id="kiosk-revoke-btn"
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to STOP and REVOKE the active QR broadcast?')) {
                  onRevokeQR();
                }
              }}
              className="px-3.5 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Stop Broadcast</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-3 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-rose-300 rounded-xl transition-colors cursor-pointer"
            title="Close Kiosk Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center QR Presentation Area */}
      <div className="flex-1 my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto w-full">
        {/* Left: Big Dynamic QR Code Display Box */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>15s Dynamic Rolling Anti-Screenshot Token</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Scan Here with Your Smartphone Camera
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Position your phone in front of this terminal to log your 1 daily faculty attendance.
            </p>
          </div>

          <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-blue-500/40 relative flex flex-col items-center">
            {qrDataUrl && isQrValidForToday ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="Entrance Terminal QR"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-2xl"
                />
                <div className="mt-2.5 w-full bg-slate-900 text-slate-200 px-3 py-1.5 rounded-xl text-center flex items-center justify-between text-[11px] font-mono font-bold border border-slate-800">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dynamic Code:</span>
                  </div>
                  <span className="text-emerald-400">Refreshes in {time15sRemaining}s</span>
                </div>
              </>
            ) : (
              <div className="w-64 h-64 sm:w-72 sm:h-72 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                <QrCode className="w-16 h-16 text-slate-400 mb-3" />
                <p className="font-bold text-sm text-slate-900">Today's QR Not Posted Yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  The Academic Manager must post today's QR code before attendance can proceed.
                </p>
                {isManager && onRegenerateQR && (
                  <button
                    onClick={onRegenerateQR}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Post Today's QR Now</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/90 rounded-2xl border border-slate-700">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-medium">Session Closes in:</span>
              <span className="text-sm font-mono font-black text-amber-300">
                {countdownStr}
              </span>
            </div>
            <div className="px-3.5 py-2 bg-blue-950/60 rounded-2xl border border-blue-800/60 text-xs font-bold text-blue-300">
              Limit: 1 Scan / Teacher / Day
            </div>
          </div>

          {/* Direct Link at the bottom of QR */}
          {isQrValidForToday && effectiveToken && (() => {
            const dynamicToken = `${effectiveToken}#15S_SLOT_${slotIndex}`;
            const dynamicLinkUrl = typeof window !== 'undefined'
              ? `${window.location.origin}/attendance?code=${encodeURIComponent(dynamicToken)}`
              : `https://abunegorgorios.edu/attendance?code=${encodeURIComponent(dynamicToken)}`;
            
            const lateMin = broadcastQR?.lateAfterMinutes !== undefined
              ? broadcastQR.lateAfterMinutes
              : (attendanceRules?.lateAfterMinutes ?? 15);
            const lateTimeStr = broadcastQR?.lateTime || attendanceRules?.lateTime || '08:15';
            const stopT = broadcastQR?.stopTime || attendanceRules?.stopTime || '09:30';

            return (
              <div className="mt-4 w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-left shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Attendance Direct Link (15s Dynamic Sync)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(dynamicLinkUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-white" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 break-all select-all">
                  {dynamicLinkUrl}
                </div>

                {/* Timing Rules */}
                <div className="pt-1 text-[10px] space-y-1 text-slate-400 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><strong>Present:</strong> within the first {lateMin} minutes.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span><strong>Late:</strong> after {lateMin} minutes ({lateTimeStr}) but before the session closes ({stopT}).</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span><strong>Absent:</strong> no valid scan before closing ({stopT}).</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Column: Live Terminal Stream */}
        <div className="lg:col-span-6 space-y-4">
          {facultyList.length > 0 && onManualMarkTeacher && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Quick Pick • Check-In Teacher at Station #1
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {facultyList.length} Faculty
                </span>
              </div>

              {justCheckedInTeacher && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-bold animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Checked in {justCheckedInTeacher} as Present at Station #1!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-8">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">-- Select Faculty Member --</option>
                    {facultyList.map((t) => {
                      const isDone = checkedInIds.has(t.id) || checkedInIds.has(t.employeeId);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.employeeId}) - {t.department} {isDone ? ' • (Checked in)' : ' • (Not checked in)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <button
                    type="button"
                    disabled={!selectedTeacherId || !isQrValidForToday}
                    onClick={handleQuickCheckInTeacher}
                    className="w-full h-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Check In Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Terminal Check-In Stream */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Terminal Check-Ins Today</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold">
                {attendanceRecords.length} Logged
              </span>
            </div>

            <div className="overflow-y-auto space-y-2 max-h-[260px] pr-1">
              {attendanceRecords.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-1.5">
                  <QrCode className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs font-semibold">Waiting for teachers to scan...</p>
                  <p className="text-[10px] text-slate-600">
                    New arrivals will immediately pop up here with timestamp confirmation.
                  </p>
                </div>
              ) : (
                attendanceRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 bg-slate-800/70 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-all animate-in slide-in-from-right-2"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {rec.teacherName || 'Faculty Member'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {rec.teacherId || 'TCH'} • {rec.checkInMethod === 'qr' ? 'Entrance Scanner' : 'Manager Manual'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {rec.checkInTime}
                      </span>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Verified
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3 gap-2">
        <p>
          {schoolName} • Main Gate - Entrance Station #1
        </p>
        <p className="font-mono text-slate-400">
          Terminal ID: KIOSK-ENTRANCE-01 • Status: Online
        </p>
      </div>
    </div>
  );
};
