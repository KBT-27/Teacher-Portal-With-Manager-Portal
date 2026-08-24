import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Building2, 
  QrCode, 
  MessageSquare, 
  Megaphone, 
  BarChart3, 
  Settings, 
  User, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  FileText, 
  Award, 
  FolderOpen,
  LogOut,
  ShieldCheck,
  Radio,
  Lock,
  School
} from 'lucide-react';
import { TeacherUser, BroadcastQR } from '../types';

interface SidebarProps {
  currentUser: TeacherUser;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onLogout: () => void;
  broadcastQR: BroadcastQR | null;
  onOpenKiosk?: () => void;
  pendingFeedbackCount?: number;
  pendingPasswordResetCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isStationLocked?: boolean;
  schoolName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  broadcastQR,
  onOpenKiosk,
  pendingFeedbackCount = 0,
  pendingPasswordResetCount = 0,
  isOpenMobile = false,
  onCloseMobile = () => {},
  isStationLocked = false,
  schoolName = 'EduSchool'
}) => {
  const isManager = currentUser.role === 'manager';
  const isStation = currentUser.role === 'qr_station';
  const isTeacher = currentUser.role === 'teacher';

  const isTodayQRPosted = Boolean(
    broadcastQR && 
    broadcastQR.isActive && 
    broadcastQR.expiresAt > Date.now()
  );

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col justify-between
        border-r border-slate-800 transition-transform duration-300 ease-in-out shrink-0
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header & Branding */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-black text-sm text-white tracking-tight leading-tight truncate" title={schoolName}>
                  {schoolName}
                </h1>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Attendance System</p>
              </div>
            </div>
            {isManager && (
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30" title="Academic Manager Mode">
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] text-xs font-semibold">
            {/* 1. Academic Manager Links */}
            {isManager && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Manager Controls
                </div>

                <button
                  onClick={() => handleTabClick('manager_dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'manager_dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Manager Overview</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('manager_attendance')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'manager_attendance' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <CalendarCheck className="w-4 h-4" />
                    <span>Today Attendance & QR</span>
                  </div>
                  {isTodayQRPosted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => handleTabClick('manager_teachers')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'manager_teachers' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4" />
                    <span>Teacher Passwords & IDs</span>
                  </div>
                  {pendingPasswordResetCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {pendingPasswordResetCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabClick('manager_departments')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'manager_departments' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Building2 className="w-4 h-4" />
                    <span>Departments</span>
                  </div>
                </button>

                <div className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Administration
                </div>

                <button
                  onClick={() => handleTabClick('feedback_view')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'feedback_view' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>Teacher Inquiries</span>
                  </div>
                  {pendingFeedbackCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black">
                      {pendingFeedbackCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* 2. QR Attendance Station Mentor Links */}
            {isStation && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Entrance Station Portal
                </div>

                <button
                  onClick={() => handleTabClick('qr_station')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'qr_station' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <QrCode className="w-4 h-4" />
                    <span>Entrance Station #1</span>
                  </div>
                  {isStationLocked && (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              </>
            )}

            {/* 3. Faculty Teacher Links */}
            {isTeacher && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Teacher Portal
                </div>

                <button
                  onClick={() => handleTabClick('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('attendance')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <CalendarCheck className="w-4 h-4" />
                    <span>Today's Attendance</span>
                  </div>
                  {isTodayQRPosted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => handleTabClick('classes')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'classes' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Classes</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('students')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'students' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Students</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('timetable')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'timetable' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-4 h-4" />
                    <span>Schedule</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('assignments')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'assignments' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Assignments</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('submissions')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'submissions' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Submissions</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('grades')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'grades' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Award className="w-4 h-4" />
                    <span>Grades</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabClick('materials')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'materials' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FolderOpen className="w-4 h-4" />
                    <span>Materials</span>
                  </div>
                </button>
              </>
            )}

            {/* Common System Links */}
            <div className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              System
            </div>

            <button
              onClick={() => handleTabClick('announcements')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'announcements' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Megaphone className="w-4 h-4" />
                <span>Announcements</span>
              </div>
            </button>

            <button
              onClick={() => handleTabClick('reports')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </div>
            </button>

            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={() => handleTabClick('profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom User Card & Station Quick Access */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {onOpenKiosk && (
            <button
              onClick={onOpenKiosk}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Launch Entrance Kiosk</span>
            </button>
          )}

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src={currentUser.avatarUrl || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.employeeId}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
