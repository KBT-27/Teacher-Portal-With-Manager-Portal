import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Lock, 
  CheckCircle2, 
  Moon, 
  Sun,
  School,
  QrCode,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { TeacherUser } from '../types';

interface SettingsViewProps {
  currentUser: TeacherUser;
  onOpenKiosk?: () => void;
  schoolName?: string;
  onChangeSchoolName?: (name: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onOpenKiosk,
  schoolName = 'EduSchool International Academy',
  onChangeSchoolName
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [editSchoolName, setEditSchoolName] = useState(schoolName);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveSchoolName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editSchoolName.trim();
    if (!trimmed) {
      showToast('School name cannot be empty.');
      return;
    }
    if (onChangeSchoolName) {
      onChangeSchoolName(trimmed);
    }
    setIsSaved(true);
    showToast(`School name updated to "${trimmed}".`);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handlePresetSelect = (preset: string) => {
    setEditSchoolName(preset);
    if (onChangeSchoolName) {
      onChangeSchoolName(preset);
    }
    showToast(`School name set to "${preset}".`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
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
      <div>
        <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>System & Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Settings & School Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure institutional identity, notification preferences, station kiosk modes, and security controls.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-5">
        {/* 1. Institutional Identity & School Name */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Institutional Identity & School Name</h3>
                <p className="text-xs text-slate-500">
                  Globally customizes the school title across portals, QR stations, reports, and headers.
                </p>
              </div>
            </div>
            {currentUser.role === 'manager' && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] uppercase border border-blue-200">
                Manager Authorization
              </span>
            )}
          </div>

          {currentUser.role === 'manager' ? (
            <form onSubmit={handleSaveSchoolName} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official School / Academy Name *
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editSchoolName}
                    onChange={(e) => {
                      setEditSchoolName(e.target.value);
                      setIsSaved(false);
                    }}
                    placeholder="e.g. EduSchool International Academy"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaved ? 'Saved!' : 'Save School Name'}</span>
                  </button>
                </div>
              </div>

              {/* Quick preset suggestions */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Presets:
                </span>
                {[
                  'EduSchool International Academy',
                  'Oakridge Science & Arts Academy',
                  'Metropolitan STEM High School',
                  'St. Jude Preparatory College'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                      editSchoolName === preset 
                        ? 'bg-blue-50 border-blue-300 text-blue-800' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </form>
          ) : (
            <div className="pt-2 space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Registered School Name</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{schoolName}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                  Read Only
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Institutional Identity & School Name is locked. Only the <strong>Academic Manager</strong> is authorized to edit or change the institutional name.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. General Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900">Notification & Sound Alerts</h3>
          <p className="text-xs text-slate-500">Manage audio beeps and desktop alerts on QR scans</p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-900">QR Check-in Sound Chime</h4>
                <p className="text-[11px] text-slate-500">Play confirmation audio feedback upon valid scan</p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => {
                  setSoundEnabled(e.target.checked);
                  showToast('Sound settings updated.');
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Push Notifications</h4>
                <p className="text-[11px] text-slate-500">Receive alerts when new bulletins or feedback are posted</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => {
                  setNotificationsEnabled(e.target.checked);
                  showToast('Notification settings updated.');
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Security & Access Policies */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900">Security & Role Enforcements</h3>
          <p className="text-xs text-slate-500">Overview of institutional security rules</p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>QR Generation Authority:</strong> Restricted exclusively to the Academic Manager role.</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Sign Up / Add Portal:</strong> Gated and authorized solely by the Academic Manager.</span>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Entrance Station Lock:</strong> Main Gate - Entrance Station #1 locks settings with persistent passcode authorization.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
