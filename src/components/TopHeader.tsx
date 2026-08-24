import React from 'react';
import { 
  Bell, 
  Search, 
  ShieldCheck, 
  QrCode, 
  LogOut, 
  User, 
  Menu,
  Sparkles,
  Radio,
  Lock
} from 'lucide-react';
import { TeacherUser, BroadcastQR } from '../types';

interface TopHeaderProps {
  currentUser: TeacherUser;
  onLogout: () => void;
  onOpenKiosk: () => void;
  broadcastQR: BroadcastQR | null;
  onOpenMobileMenu?: () => void;
  todayDateFormatted?: string;
  activeTab?: string;
  isStationLocked?: boolean;
  schoolName?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  onLogout,
  onOpenKiosk,
  broadcastQR,
  onOpenMobileMenu,
  todayDateFormatted = 'August 21, 2026',
  activeTab = 'dashboard',
  isStationLocked = false,
  schoolName = 'EduSchool'
}) => {
  const isManager = currentUser.role === 'manager';
  const isStation = currentUser.role === 'qr_station';
  const isTeacher = currentUser.role === 'teacher';
  const isTodayQRActive = Boolean(
    broadcastQR && 
    broadcastQR.isActive && 
    broadcastQR.expiresAt > Date.now()
  );

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu button & Current Context */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Open Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {todayDateFormatted}
              </span>
              <span className="text-slate-300">•</span>
              {isManager && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Academic Manager</span>
                </span>
              )}
              {isStation && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  <QrCode className="w-3 h-3" />
                  <span>Station Terminal</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-slate-900 capitalize tracking-tight">
              {activeTab.replace(/_/g, ' ')}
            </h2>
          </div>
        </div>

        {/* Right Side: QR Status, Kiosk Launcher, User Profile, Logout */}
        <div className="flex items-center space-x-2.5">
          {/* QR Station Status Indicator */}
          {isTodayQRActive ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-pulse">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manager QR Live</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>QR Station Idle</span>
            </div>
          )}

          {/* Station Kiosk Launch Button (Only for Manager / Station) */}
          {!isTeacher && (isManager || isStation) && onOpenKiosk && (
            <button
              onClick={onOpenKiosk}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Open Entrance Station #1 Screen"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Entrance Kiosk</span>
            </button>
          )}

          {/* User Info & Avatar */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
            <img
              src={currentUser.avatarUrl || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-xl object-cover border border-slate-200"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-black text-slate-900 leading-none">{currentUser.name}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-none">
                {currentUser.employeeId} • {currentUser.role}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
