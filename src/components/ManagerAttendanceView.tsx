import React, { useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  QrCode, 
  Radio, 
  RefreshCw, 
  Eye, 
  XCircle,
  Sliders,
  Timer,
  Play,
  Pause
} from 'lucide-react';
import { AttendanceSession, TeacherUser, BroadcastQR, AttendanceTimeSettings } from '../types';
import { ConfirmDialog, ConfirmDialogState } from './ConfirmDialog';
import { QRTimeAdjustmentModal } from './QRTimeAdjustmentModal';

interface ManagerAttendanceViewProps {
  teachers?: TeacherUser[];
  users?: TeacherUser[];
  attendanceRecords?: AttendanceSession[];
  onManualMark: (teacherId: string, status: 'present' | 'late' | 'absent') => void;
  onClearAttendance: () => void;
  broadcastQR?: BroadcastQR | null;
  activeBroadcastQR?: BroadcastQR | null;
  onPostTodayQR: () => void;
  onRegenerateTodayQR: () => void;
  onStopQR?: () => void;
  onOpenKiosk?: () => void;
  todayDateStr?: string;
  attendanceRules?: AttendanceTimeSettings;
  onSaveAttendanceRules?: (rules: AttendanceTimeSettings) => void;
  onUpdateBroadcastQR?: (qr: BroadcastQR) => void;
  currentUser?: TeacherUser | null;
}

export const ManagerAttendanceView: React.FC<ManagerAttendanceViewProps> = ({
  teachers = [],
  users = [],
  attendanceRecords = [],
  onManualMark,
  onClearAttendance,
  broadcastQR,
  activeBroadcastQR,
  onPostTodayQR,
  onRegenerateTodayQR,
  onStopQR,
  onOpenKiosk,
  todayDateStr = '2026-08-21',
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
  currentUser
}) => {
  const safeTeachers = (teachers && teachers.length > 0 ? teachers : users) || [];
  const effectiveBroadcastQR = broadcastQR || activeBroadcastQR || null;
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  // Confirmation dialog for clearing records
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const activeTeachers = safeTeachers.filter(t => t && t.role === 'teacher');
  const recordsForDate = (attendanceRecords || []).filter(r => r && r.date === selectedDate);
  const presentCount = recordsForDate.filter(r => r && r.status === 'present').length;
  const lateCount = recordsForDate.filter(r => r && r.status === 'late').length;
  const absentCount = recordsForDate.filter(r => r && r.status === 'absent').length;
  const totalFaculty = activeTeachers.length;
  const unrecordedCount = Math.max(0, totalFaculty - recordsForDate.length);
  const totalAbsent = absentCount + unrecordedCount;

  const isTodayQRPosted = Boolean(
    effectiveBroadcastQR && 
    effectiveBroadcastQR.isActive && 
    effectiveBroadcastQR.generatedDate === todayDateStr &&
    effectiveBroadcastQR.generatedByRole === 'manager' &&
    effectiveBroadcastQR.expiresAt > Date.now()
  );

  const handleExportCSV = () => {
    const headers = 'Teacher ID,Teacher Name,Date,Check-In Time,Status,Verification Gate,Note\n';
    const rows = activeTeachers.map(tch => {
      const log = recordsForDate.find(r => r.teacherId === tch.employeeId || r.teacherName === tch.name);
      const status = log?.status || 'absent';
      const time = log?.checkInTime || '--:--';
      const method = log?.checkInMethod === 'qr' ? 'Entrance QR Terminal #1' : log ? 'Manager Manual Override' : 'Unrecorded';
      return `"${tch.employeeId}","${tch.name}","${selectedDate}","${time}","${status}","${method}","${log?.note || ''}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faculty-attendance-${selectedDate}.csv`;
    a.click();
    showToast('Exported faculty attendance log to CSV.');
  };

  const query = (search || '').toLowerCase();
  const filteredTeachers = activeTeachers.filter(t => {
    if (!t) return false;
    const matchesSearch = 
      (t.name || '').toLowerCase().includes(query) ||
      (t.employeeId || '').toLowerCase().includes(query) ||
      (t.subject || (Array.isArray(t.subjects) ? t.subjects.join(' ') : '') || '').toLowerCase().includes(query) ||
      (t.department || '').toLowerCase().includes(query);
    
    if (!matchesSearch) return false;
    const log = recordsForDate.find(r => r.teacherId === t.employeeId || r.teacherName === t.name);
    const status = log?.status || 'absent';
    if (statusFilter === 'all') return true;
    return status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Confirm Dialog */}
      <ConfirmDialog
        state={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {toastMsg && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-xs text-slate-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Academic Manager Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Today Teachers Attendance & Post QR
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sole authority to create, post, and regenerate today's entrance QR codes, inspect live teacher attendance, and record manual overrides.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onOpenKiosk && (
            <button
              onClick={onOpenKiosk}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Open Terminal #1 Kiosk</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Clear Attendance Verification Records',
                message: 'Are you sure you want to clear all teacher attendance verification logs? This will erase all check-in entries across the system.',
                confirmText: 'Yes, Clear All Records',
                cancelText: 'Cancel',
                variant: 'danger',
                onConfirm: () => {
                  onClearAttendance();
                  showToast('Attendance log cleared.');
                }
              });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Records</span>
          </button>
        </div>
      </div>

      {/* QR Code Creation & Posting Control Box (Manager Authority Only) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              {isTodayQRPosted ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Today's QR Code is Posted & Live</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Today's QR Not Posted Yet</span>
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20 text-[10px] font-mono font-bold">
                Date: {todayDateStr}
              </span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              Academic Manager QR Creation & Broadcast Control
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Only the Academic Manager can generate and post today's QR code. Station Mentors and Faculty Teachers can only view and scan the code you post.
            </p>

            {isTodayQRPosted && (
              <div className="flex items-center gap-3 pt-1">
                <span className="font-mono text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-blue-300 font-bold">
                  Token: {broadcastQR?.token.slice(0, 32)}...
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons for Academic Manager */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            {!isTodayQRPosted ? (
              <button
                onClick={() => {
                  onPostTodayQR();
                  showToast("Today's official attendance QR code created and posted!");
                }}
                id="manager-post-today-qr-btn"
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Create & Post Today's QR Code</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onRegenerateTodayQR();
                    showToast("Today's QR code regenerated and updated!");
                  }}
                  id="manager-regenerate-today-qr-btn"
                  className="w-full sm:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Replace / Regenerate Today's QR</span>
                </button>

                {onStopQR && (
                  <button
                    onClick={() => {
                      onStopQR();
                      showToast("Today's QR code has been stopped and deactivated.");
                    }}
                    id="manager-stop-today-qr-btn"
                    className="w-full sm:w-auto px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Stop QR Code</span>
                  </button>
                )}
              </div>
            )}

            {onOpenKiosk && (
              <button
                onClick={onOpenKiosk}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Kiosk Display</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Timing & Threshold Adjustment Strip inside Manager Box */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Create / Post Time:</span>
              <strong className="text-emerald-300 font-mono">
                {effectiveBroadcastQR?.createTime || effectiveBroadcastQR?.postTime || attendanceRules.createTime || '07:30'}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">Late After:</span>
              <strong className="text-amber-300 font-mono">
                {effectiveBroadcastQR?.lateAfterMinutes !== undefined ? effectiveBroadcastQR.lateAfterMinutes : (attendanceRules.lateAfterMinutes ?? 15)} min
              </strong>
              <span className="text-slate-500 font-mono text-[11px]">
                ({effectiveBroadcastQR?.lateTime || attendanceRules.lateTime || '08:15'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-slate-400">Stop Time:</span>
              <strong className="text-rose-300 font-mono">
                {effectiveBroadcastQR?.stopTime || attendanceRules.stopTime || '09:30'}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTimeModalOpen(true)}
            id="manager-adjust-qr-times-btn"
            className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-blue-400/30 shadow-xs hover:scale-[1.02]"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust Create, Late & Stop Times</span>
          </button>
        </div>
      </div>

      {/* QR Time Adjustment Modal */}
      <QRTimeAdjustmentModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        currentUser={currentUser}
        attendanceRules={attendanceRules}
        onSaveRules={(newRules) => {
          onSaveAttendanceRules(newRules);
          showToast('Attendance timing & late threshold settings updated successfully!');
        }}
        broadcastQR={effectiveBroadcastQR}
        onUpdateBroadcastQR={onUpdateBroadcastQR}
        roleContext="manager"
      />

      {/* KPI Cards: Present, Late, Absent, Total */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 font-mono">{presentCount}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              On-Time
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600 font-mono">{lateCount}</span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Delayed
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absent</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600 font-mono">{totalAbsent}</span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              Unverified
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Faculty</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{totalFaculty}</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Active Roster
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty teacher by name, ID, or subject..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activeTeachers.length})
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setStatusFilter('late')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'late' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700'
              }`}
            >
              Late ({lateCount})
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'
              }`}
            >
              Absent ({totalAbsent})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Date:</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-5">Faculty Member</th>
                <th className="py-3.5 px-5">Department & Subject</th>
                <th className="py-3.5 px-5">Check-in Status</th>
                <th className="py-3.5 px-5">Verified Time</th>
                <th className="py-3.5 px-5">Method / Gate</th>
                <th className="py-3.5 px-5 text-right">Manager Attendance Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((tch) => {
                const log = recordsForDate.find(r => r.teacherId === tch.employeeId || r.teacherName === tch.name);
                const status = log?.status || 'absent';
                return (
                  <tr key={tch.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={tch.avatarUrl || tch.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={tch.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{tch.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {tch.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-800">{tch.subject || tch.subjects?.[0] || 'Faculty'}</p>
                      <p className="text-[10px] text-slate-400">{tch.department || 'General Faculty'}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      {status === 'present' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Present</span>
                        </span>
                      ) : status === 'late' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Late</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                          <XCircle className="w-3 h-3" />
                          <span>Absent</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-600">
                      {log?.checkInTime || '--:--'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {log?.checkInMethod === 'qr' ? 'Terminal #1 (Entrance QR)' : log ? 'Manager Manual Override' : 'Unrecorded / Absent'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            onManualMark(tch.employeeId, 'present');
                            showToast(`Marked ${tch.name} as Present.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            status === 'present' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => {
                            onManualMark(tch.employeeId, 'late');
                            showToast(`Marked ${tch.name} as Late.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            status === 'late' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => {
                            onManualMark(tch.employeeId, 'absent');
                            showToast(`Marked ${tch.name} as Absent.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            status === 'absent' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
