import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Building2, 
  QrCode, 
  Plus, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Search, 
  ArrowRight, 
  ShieldCheck,
  KeyRound,
  Check,
  X,
  User,
  RefreshCw
} from 'lucide-react';
import { 
  TeacherUser, 
  AttendanceSession, 
  Department, 
  ManagerFeedback, 
  Announcement,
  PasswordResetRequest,
  BroadcastQR
} from '../types';
import { BroadcastQRCard } from './BroadcastQRCard';

interface ManagerDashboardViewProps {
  currentUser: TeacherUser;
  teachers: TeacherUser[];
  attendanceRecords: AttendanceSession[];
  departments: Department[];
  feedbacks: ManagerFeedback[];
  announcements: Announcement[];
  passwordResets?: PasswordResetRequest[];
  onApprovePasswordReset?: (requestId: string, approvedPassword?: string, managerNotes?: string) => void;
  onRejectPasswordReset?: (requestId: string, managerNotes?: string) => void;
  broadcastQR: BroadcastQR | null;
  onPostTodayQR: () => void;
  onRegenerateTodayQR: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenKiosk: () => void;
  onManualMarkTeacher: (teacherId: string, status: 'present' | 'late' | 'absent') => void;
  todayDateStr?: string;
}

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({
  currentUser,
  teachers,
  attendanceRecords,
  departments,
  feedbacks,
  announcements: _announcements,
  passwordResets = [],
  onApprovePasswordReset,
  onRejectPasswordReset,
  broadcastQR,
  onPostTodayQR,
  onRegenerateTodayQR,
  onNavigateTab,
  onOpenKiosk,
  onManualMarkTeacher,
  todayDateStr = '2026-08-21'
}) => {
  const [searchTeacher, setSearchTeacher] = useState('');
  const [selectedResetRequest, setSelectedResetRequest] = useState<PasswordResetRequest | null>(null);
  const [customApprovalPassword, setCustomApprovalPassword] = useState('');
  const [managerActionNotes, setManagerActionNotes] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const activeTeachers = teachers.filter(t => t.role === 'teacher' && t.status === 'active');
  const todayLogs = attendanceRecords.filter(r => r.date === todayDateStr);
  const presentTeachersCount = todayLogs.filter(r => r.status === 'present').length;
  const lateTeachersCount = todayLogs.filter(r => r.status === 'late').length;
  const verifiedCount = presentTeachersCount + lateTeachersCount;
  const totalFacultyCount = activeTeachers.length;
  const facultyAttendanceRate = totalFacultyCount > 0 
    ? Math.round((verifiedCount / totalFacultyCount) * 100) 
    : 100;

  const pendingPasswordResets = passwordResets.filter(r => r.status === 'pending');

  const query = (searchTeacher || '').toLowerCase();
  const filteredTeachers = activeTeachers.filter(t => {
    if (!t) return false;
    const nameMatch = (t.name || '').toLowerCase().includes(query);
    const subjectMatch = (t.subject || (Array.isArray(t.subjects) ? t.subjects.join(' ') : '') || '').toLowerCase().includes(query);
    const idMatch = (t.employeeId || '').toLowerCase().includes(query);
    const deptMatch = (t.department || '').toLowerCase().includes(query);
    return nameMatch || subjectMatch || idMatch || deptMatch;
  });

  const handleOpenReview = (request: PasswordResetRequest) => {
    setSelectedResetRequest(request);
    setCustomApprovalPassword(request.requestedNewPassword || 'faculty_pass2026');
    setManagerActionNotes('');
    setActionSuccessMsg(null);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResetRequest || !onApprovePasswordReset) return;
    onApprovePasswordReset(
      selectedResetRequest.id, 
      customApprovalPassword.trim(), 
      managerActionNotes.trim() || 'Approved by Academic Manager'
    );
    setActionSuccessMsg(`Credential reset approved for ${selectedResetRequest.teacherName}. New password assigned: "${customApprovalPassword.trim()}".`);
    setSelectedResetRequest(null);
  };

  const isTodayQRPosted = Boolean(
    broadcastQR && 
    broadcastQR.isActive && 
    broadcastQR.generatedDate === todayDateStr &&
    broadcastQR.generatedByRole === 'manager' &&
    broadcastQR.expiresAt > Date.now()
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Action Notification Banner */}
      {actionSuccessMsg && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-700 animate-in slide-in-from-top">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-xs text-emerald-300 hover:text-white cursor-pointer px-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Academic Manager Control Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Manager Overview & QR Generation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create and post today's attendance QR code, authorize teacher credentials, and monitor faculty attendance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('manager_teachers')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Teacher Credentials & Passwords</span>
          </button>

          <button
            onClick={onOpenKiosk}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Open Entrance Kiosk</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Headcount</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{activeTeachers.length}</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {departments.length} Depts
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today Checked-in</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 font-mono">{verifiedCount}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {presentTeachersCount} On-Time
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-indigo-600 font-mono">{facultyAttendanceRate}%</span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Today Active
            </span>
          </div>
        </div>

        {/* Password Reset Requests Queue Metric */}
        <div 
          onClick={() => onNavigateTab('manager_password_resets')}
          className={`p-5 rounded-2xl border shadow-xs transition-all cursor-pointer hover:shadow-md ${
            pendingPasswordResets.length > 0 
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20 hover:bg-rose-100/70' 
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forgetting Requests</span>
            <KeyRound className={`w-4 h-4 ${pendingPasswordResets.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-3xl font-black font-mono ${pendingPasswordResets.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {pendingPasswordResets.length}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              pendingPasswordResets.length > 0 ? 'text-rose-700 bg-rose-100' : 'text-slate-500 bg-slate-100'
            }`}>
              {pendingPasswordResets.length > 0 ? 'Approval Needed' : 'All Clear'}
            </span>
          </div>
        </div>
      </div>

      {/* QR Generation & Broadcast Component (Manager Exclusive Authority) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                  Academic Manager Sole QR Authority
                </span>
                {isTodayQRPosted ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Live Today
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Not Posted
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-white tracking-tight mt-3">
                Today's Entrance Attendance QR Code
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Generate and post today's QR code to <strong>Main Gate - Entrance Station #1</strong>. Teachers will only be able to check in when this QR code is active.
              </p>

              {isTodayQRPosted && (
                <div className="mt-4 p-3 bg-white/5 rounded-2xl border border-white/10 text-xs font-mono text-blue-200">
                  Active Token: {broadcastQR?.token.slice(0, 28)}...
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3 justify-end">
              {!isTodayQRPosted ? (
                <button
                  type="button"
                  onClick={onPostTodayQR}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate & Post Today's QR</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRegenerateTodayQR}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Regenerate / Replace Today's QR</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenKiosk}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Open Station Kiosk View
              </button>
            </div>
          </div>
        </div>

        {/* Live Attendance List */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Faculty Live Attendance Status</h3>
                <p className="text-xs text-slate-500">Real-time attendance for {todayDateStr}</p>
              </div>
              <button
                onClick={() => onNavigateTab('manager_attendance')}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <span>Full Attendance Roster</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTeacher}
                onChange={(e) => setSearchTeacher(e.target.value)}
                placeholder="Search teacher by name, ID, or department..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredTeachers.map((tch) => {
                const log = todayLogs.find(l => l.teacherId === tch.employeeId || l.teacherName === tch.name);
                const isCheckedIn = !!log;
                const status = log?.status || 'absent';

                return (
                  <div
                    key={tch.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={tch.avatarUrl || tch.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={tch.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{tch.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {tch.subject || 'Faculty'} • <span className="font-mono">{tch.employeeId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isCheckedIn ? (
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                            status === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{status}</span>
                          </span>
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            {log.checkInTime}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onManualMarkTeacher(tch.employeeId, 'present')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => onManualMarkTeacher(tch.employeeId, 'late')}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Late
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Review & Authorize Password Reset Modal */}
      {selectedResetRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Authorize Password Reset
                  </h3>
                  <p className="text-xs text-slate-500">
                    Academic Manager Sole Approval Authorization
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedResetRequest(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-black flex items-center justify-center border border-blue-200 text-sm">
                    {String(selectedResetRequest.teacherName || 'T').charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{typeof selectedResetRequest.teacherName === 'string' ? selectedResetRequest.teacherName : 'Faculty'}</h4>
                    <p className="font-mono text-indigo-700 font-bold">{typeof selectedResetRequest.teacherId === 'string' ? selectedResetRequest.teacherId : ''}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase">
                  Pending Authorization
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Email:</span>
                  <p className="text-slate-800 truncate font-medium" title={typeof selectedResetRequest.email === 'string' ? selectedResetRequest.email : ''}>
                    {typeof selectedResetRequest.email === 'string' ? selectedResetRequest.email : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Department:</span>
                  <p className="text-slate-800 font-medium">
                    {typeof selectedResetRequest.department === 'string' ? selectedResetRequest.department : 'Faculty'}
                  </p>
                </div>
              </div>

              {/* Wish Note / Reason provided by Teacher */}
              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Teacher's Reason / Note:</span>
                <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 italic">
                  "{selectedResetRequest.reason || 'Password reset requested via School Entrance Portal'}"
                </p>
              </div>

              {/* Teacher's Desired Password if specified */}
              {selectedResetRequest.requestedNewPassword && (
                <div className="pt-1 flex items-center justify-between bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/70">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Teacher's Desired Password:</span>
                    <p className="font-mono font-bold text-blue-900 text-xs">{selectedResetRequest.requestedNewPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomApprovalPassword(selectedResetRequest.requestedNewPassword || '')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Use Teacher Password
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Approved Password to Assign to Profile *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                      let res = '';
                      for (let i = 0; i < 10; i++) {
                        res += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setCustomApprovalPassword(res);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  >
                    ✨ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={customApprovalPassword}
                  onChange={(e) => setCustomApprovalPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This password will be updated directly in the faculty member's profile.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onRejectPasswordReset && selectedResetRequest) {
                      onRejectPasswordReset(selectedResetRequest.id, 'Declined by Academic Manager');
                      setActionSuccessMsg(`Declined password reset for ${selectedResetRequest.teacherName}.`);
                      setSelectedResetRequest(null);
                    }
                  }}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold rounded-xl cursor-pointer"
                >
                  Decline Request
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedResetRequest(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Approve & Save Password
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
