import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Radio, 
  ShieldCheck, 
  Camera,
  Building,
  RefreshCw,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { BroadcastQR, TeacherUser, AttendanceSession } from '../types';

interface BroadcastQRCardProps {
  broadcastQR?: BroadcastQR | null;
  currentUser?: TeacherUser;
  alreadyScannedToday?: boolean;
  onCheckInSuccess?: (session: AttendanceSession) => boolean | void;
  onOpenScanner?: () => void;
  onRevokeQR?: () => void;
  token?: string;
  countdown?: number;
  onManualRefresh?: () => void;
  onOpenEntranceKiosk?: () => void;
  isManager?: boolean;
}

export const BroadcastQRCard: React.FC<BroadcastQRCardProps> = ({
  broadcastQR,
  currentUser,
  alreadyScannedToday = false,
  onCheckInSuccess: _onCheckInSuccess,
  onOpenScanner = () => {},
  onRevokeQR,
  token,
  countdown,
  onManualRefresh,
  onOpenEntranceKiosk,
  isManager = currentUser?.role === 'manager'
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // If in Manager Mode
  if (isManager && (token !== undefined || countdown !== undefined)) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg relative overflow-hidden h-full flex flex-col justify-between">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Broadcast Live to Entrance Kiosk</span>
            </span>
            {countdown !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-300" />
                <span>Next token rotation in: {countdown}s</span>
              </span>
            )}
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Main Gate - Entrance Station #1
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Academic Manager authoritative dynamic QR broadcast transmitted to the station kiosk.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Manager Authoritative Token Active</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{token?.slice(0, 16)}...</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 justify-end">
          {onManualRefresh && isManager && (
            <button
              onClick={onManualRefresh}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Regenerate Today's QR</span>
            </button>
          )}
          {onOpenEntranceKiosk && (
            <button
              onClick={onOpenEntranceKiosk}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Open Kiosk Mode</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Teacher / Station view
  useEffect(() => {
    if (!broadcastQR || !broadcastQR.isActive || broadcastQR.generatedByRole !== 'manager') {
      setIsExpired(true);
      return;
    }
    const checkTime = () => {
      const remainingMs = broadcastQR.expiresAt - Date.now();
      if (remainingMs <= 0) {
        setIsExpired(true);
        setTimeLeftStr('Expired');
      } else {
        setIsExpired(false);
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [broadcastQR]);

  if (!broadcastQR || !broadcastQR.isActive || isExpired) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Main Gate Entrance Station:</span>
              <span className="text-amber-700 font-semibold">Today's QR Not Posted Yet</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              The Academic Manager must generate and post today's QR code before teacher attendance can proceed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Live on Main Gate - Entrance Station #1</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/20 text-[10px] font-mono font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              <span>Closes in {timeLeftStr}</span>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Today's School Entrance QR Check-In Station
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Posted by <strong className="text-white">{broadcastQR.generatedBy || 'Academic Manager'}</strong> for today. Please scan with your phone camera at the school entrance station.
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-center sm:items-end gap-2 w-full md:w-auto">
          {alreadyScannedToday ? (
            <div className="w-full md:w-auto px-5 py-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p>Today's Attendance Verified</p>
                <p className="text-[10px] text-emerald-400 font-normal">1/1 Daily check-in complete</p>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenScanner}
              className="w-full md:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.02]"
            >
              <Camera className="w-4 h-4" />
              <span>Scan QR at Entrance Station</span>
            </button>
          )}

          {onRevokeQR && isManager && (
            <button
              id="revoke-qr-btn"
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to stop and revoke today\'s QR broadcast?')) {
                  onRevokeQR();
                }
              }}
              className="w-full md:w-auto px-3.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Stop / Revoke Broadcast</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
