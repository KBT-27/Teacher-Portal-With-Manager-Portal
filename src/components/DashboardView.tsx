import React from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Camera, 
  ArrowRight, 
  Radio, 
  Building,
  GraduationCap,
  Sparkles,
  MessageSquare,
  FolderOpen
} from 'lucide-react';
import { TeacherUser, AttendanceSession, BroadcastQR } from '../types';

interface DashboardViewProps {
  currentUser: TeacherUser;
  attendanceRecords?: AttendanceSession[];
  broadcastQR?: BroadcastQR | null;
  activeBroadcastQR?: BroadcastQR | null;
  onOpenScanner: () => void;
  alreadyScannedToday: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenFeedback: () => void;
  todayDateFormatted?: string;
  todayDateStr?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  attendanceRecords = [],
  broadcastQR,
  activeBroadcastQR,
  onOpenScanner,
  alreadyScannedToday,
  onNavigateTab,
  onOpenFeedback,
  todayDateFormatted = 'August 21, 2026',
  todayDateStr = '2026-08-21'
}) => {
  const effectiveBroadcastQR = broadcastQR || activeBroadcastQR || null;
  const safeRecords = attendanceRecords || [];

  const isTodayQRBroadcastLive = Boolean(
    effectiveBroadcastQR && 
    effectiveBroadcastQR.isActive && 
    effectiveBroadcastQR.generatedDate === todayDateStr &&
    effectiveBroadcastQR.generatedByRole === 'manager' &&
    effectiveBroadcastQR.expiresAt > Date.now()
  );

  const presentCount = safeRecords.filter(r => r && r.status === 'present').length;
  const lateCount = safeRecords.filter(r => r && r.status === 'late').length;
  const absentCount = safeRecords.filter(r => r && r.status === 'absent').length;
  const total = presentCount + lateCount + absentCount;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 100;

  const todayRecord = safeRecords.find(r => r && r.date === todayDateStr);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            Faculty Member Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {currentUser.name}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Department: <strong>{currentUser.department || 'Science & STEM'}</strong> • Subject: <strong>{currentUser.subject || 'Faculty'}</strong> • ID: <span className="font-mono">{currentUser.employeeId}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          {alreadyScannedToday ? (
            <div className="w-full sm:w-auto px-4 py-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Today's Check-in Complete ({todayRecord?.checkInTime || '08:15 AM'})</span>
            </div>
          ) : isTodayQRBroadcastLive ? (
            <button
              onClick={onOpenScanner}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-50 text-blue-700 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Scan Manager QR to Check In</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto px-4 py-3 bg-black/20 rounded-2xl border border-white/10 text-xs font-medium text-blue-100 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Awaiting Manager QR Post</span>
            </div>
          )}

          <button
            onClick={onOpenFeedback}
            className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Manager</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-blue-600 font-mono">{attendanceRate}%</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              August 2026
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Days</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 font-mono">{presentCount}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              On-Time
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Classes</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">4</span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Grade 10 & 11
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Taught</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">118</span>
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              Active Roster
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Quick Links & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Today's Class Schedule</h3>
              <p className="text-xs text-slate-500">{todayDateFormatted}</p>
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { time: '08:30 AM - 09:45 AM', subject: currentUser.subject || 'Advanced Math', room: 'Room 302', grade: 'Grade 10-A', status: 'Upcoming' },
              { time: '10:00 AM - 11:15 AM', subject: currentUser.subject || 'Advanced Math', room: 'Lab 4', grade: 'Grade 11-B', status: 'Upcoming' },
              { time: '01:00 PM - 02:15 PM', subject: 'Tutorial & Office Hours', room: 'Faculty Lounge', grade: 'All Students', status: 'Upcoming' }
            ].map((slot, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{slot.subject}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{slot.grade} • {slot.room}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-700">{slot.time}</span>
                  <span className="block text-[10px] text-blue-600 font-semibold">{slot.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Nav Actions */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Faculty Quick Actions</h3>
            <p className="text-xs text-slate-500">Jump directly to your classroom utilities</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => onNavigateTab('attendance')}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-left transition-all cursor-pointer group"
              >
                <Clock className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900">Today's Attendance</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">View log & scan QR</p>
              </button>

              <button
                onClick={() => onNavigateTab('classes')}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-left transition-all cursor-pointer group"
              >
                <BookOpen className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900">My Classes</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Rosters & syllabus</p>
              </button>

              <button
                onClick={() => onNavigateTab('timetable')}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-left transition-all cursor-pointer group"
              >
                <Calendar className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900">Schedule</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Timetable & periods</p>
              </button>

              <button
                onClick={() => onNavigateTab('materials')}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-left transition-all cursor-pointer group"
              >
                <FolderOpen className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900">Materials</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Lesson files & notes</p>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Need attendance adjustment?</h4>
                <p className="text-[10px] text-slate-600">Send an inquiry directly to the Manager</p>
              </div>
            </div>
            <button
              onClick={onOpenFeedback}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
