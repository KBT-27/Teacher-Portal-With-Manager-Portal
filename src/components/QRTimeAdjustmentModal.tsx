import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Sliders, 
  X, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  Layers,
  Timer,
  Play,
  Pause
} from 'lucide-react';
import { AttendanceTimeSettings, BroadcastQR, TeacherUser } from '../types';

interface QRTimeAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: TeacherUser | null;
  attendanceRules: AttendanceTimeSettings;
  onSaveRules: (newRules: AttendanceTimeSettings) => void;
  broadcastQR?: BroadcastQR | null;
  onUpdateBroadcastQR?: (updatedQR: BroadcastQR) => void;
  roleContext?: 'manager' | 'qr_station' | 'mentor';
}

export const QRTimeAdjustmentModal: React.FC<QRTimeAdjustmentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  attendanceRules,
  onSaveRules,
  broadcastQR,
  onUpdateBroadcastQR,
  roleContext = currentUser?.role || 'manager'
}) => {
  const [createTime, setCreateTime] = useState<string>(
    broadcastQR?.createTime || broadcastQR?.postTime || attendanceRules.createTime || '07:30'
  );
  const [lateTime, setLateTime] = useState<string>(
    broadcastQR?.lateTime || attendanceRules.lateTime || attendanceRules.lateThreshold || '08:15'
  );
  const [lateAfterMinutes, setLateAfterMinutes] = useState<number>(
    broadcastQR?.lateAfterMinutes !== undefined ? broadcastQR.lateAfterMinutes : (attendanceRules.lateAfterMinutes ?? 15)
  );
  const [stopTime, setStopTime] = useState<string>(
    broadcastQR?.stopTime || attendanceRules.stopTime || attendanceRules.morningEnd || '09:30'
  );
  const [isSaved, setIsSaved] = useState(false);

  // Sync state when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setCreateTime(broadcastQR?.createTime || broadcastQR?.postTime || attendanceRules.createTime || '07:30');
      setLateTime(broadcastQR?.lateTime || attendanceRules.lateTime || attendanceRules.lateThreshold || '08:15');
      setLateAfterMinutes(
        broadcastQR?.lateAfterMinutes !== undefined ? broadcastQR.lateAfterMinutes : (attendanceRules.lateAfterMinutes ?? 15)
      );
      setStopTime(broadcastQR?.stopTime || attendanceRules.stopTime || attendanceRules.morningEnd || '09:30');
      setIsSaved(false);
    }
  }, [isOpen, broadcastQR, attendanceRules]);

  if (!isOpen) return null;

  const handleApplyNow = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedRules: AttendanceTimeSettings = {
      ...attendanceRules,
      createTime,
      morningStart: createTime.includes(':') && !createTime.includes('M') ? `${createTime}` : createTime,
      lateTime,
      lateThreshold: lateTime,
      lateAfterMinutes: Number(lateAfterMinutes),
      stopTime,
      morningEnd: stopTime.includes(':') && !stopTime.includes('M') ? `${stopTime}` : stopTime
    };

    onSaveRules(updatedRules);

    // If there is an active broadcast QR, update its timing attributes too
    if (broadcastQR && onUpdateBroadcastQR) {
      const updatedQR: BroadcastQR = {
        ...broadcastQR,
        createTime,
        postTime: createTime,
        lateTime,
        lateAfterMinutes: Number(lateAfterMinutes),
        stopTime
      };
      onUpdateBroadcastQR(updatedQR);
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const quickMinutesPresets = [5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Adjust Attendance QR Times
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                  {roleContext === 'manager' ? 'Manager & Mentor Control' : 'Station Mentor Adjustment'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Customize Create Time, Late Cutoff Time, and Session Stop Time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleApplyNow} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Section 1: Create Time & Stop Time in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Create Time */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Create / Post Time</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Session Opens
                </span>
              </div>
              <input
                type="text"
                value={createTime}
                onChange={(e) => setCreateTime(e.target.value)}
                placeholder="07:30 or 07:30 AM"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {['07:00', '07:30', '08:00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCreateTime(preset)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                      createTime === preset
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Stop Time */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Pause className="w-3.5 h-3.5 text-rose-600" />
                  <span>3. Stop / Close Time</span>
                </label>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  Session Closes
                </span>
              </div>
              <input
                type="text"
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                placeholder="09:30 or 09:30 AM"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {['09:00', '09:30', '10:00', '11:00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStopTime(preset)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                      stopTime === preset
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Late Time & Late After Minutes (The exact user request) */}
          <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-amber-600" />
                <span>2. Late Time & Threshold Adjustment</span>
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-300">
                After {lateAfterMinutes} min → Late
              </span>
            </div>

            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              Define the exact minute threshold from session start (or clock time) when teacher status transitions from <strong>Present</strong> to <strong>Late</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Minutes from start:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={lateAfterMinutes}
                    onChange={(e) => setLateAfterMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-600">minutes</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Or Clock Late Cutoff:
                </label>
                <input
                  type="text"
                  value={lateTime}
                  onChange={(e) => setLateTime(e.target.value)}
                  placeholder="08:15 or 08:15 AM"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Quick minute presets */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-amber-900 block mb-1.5">
                Quick Select Late Threshold:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {quickMinutesPresets.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setLateAfterMinutes(mins)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      lateAfterMinutes === mins
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Live Rule Preview */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-300 border-b border-slate-800 pb-1.5">
              <span>Active Attendance Rule Preview:</span>
              <span className="text-slate-400 font-normal">Real-time verification calculation</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  <strong>Present:</strong> within the first <strong>{lateAfterMinutes} minutes</strong> (from {createTime} before {lateTime}).
                </span>
              </div>
              <div className="flex items-center gap-2 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>
                  <strong>Late:</strong> after <strong>{lateAfterMinutes} minutes</strong> but before the session closes at <strong>{stopTime}</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2 text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>
                  <strong>Absent:</strong> no valid scan before closing at <strong>{stopTime}</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Times Applied!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Timing Adjustment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
