import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  KeyRound, 
  CheckCircle2, 
  ShieldCheck, 
  Lock,
  Camera,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  EyeOff,
  IdCard,
  Sparkles,
  Info,
  Copy
} from 'lucide-react';
import { TeacherUser } from '../types';
import { hashPassword, fastHash, getTeacherRealPassword } from '../lib/utils';

interface ProfileViewProps {
  currentUser: TeacherUser;
  onUpdateProfile: (updated: Partial<TeacherUser>) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1580894732470-3453b3425cfd?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250'
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile
}) => {
  const isManager = currentUser.role === 'manager';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Photo States
  const [currentPhoto, setCurrentPhoto] = useState<string>(
    currentUser.avatarUrl || currentUser.avatar || PRESET_AVATARS[0]
  );
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState(false);

  // Password States
  const realActivePassword = getTeacherRealPassword(currentUser);
  const [currentPassword, setCurrentPassword] = useState(realActivePassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRealPasswordBadge, setShowRealPasswordBadge] = useState(false);

  // Toast / Feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Photo size exceeds 3MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCurrentPhoto(dataUrl);
        onUpdateProfile({
          avatarUrl: dataUrl,
          avatar: dataUrl
        });
        setPhotoSuccess('Profile photo updated successfully from local upload.');
        showToast('Profile photo updated.');
        setTimeout(() => setPhotoSuccess(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Select Preset Photo
  const handleSelectPreset = (url: string) => {
    setCurrentPhoto(url);
    onUpdateProfile({
      avatarUrl: url,
      avatar: url
    });
    setPhotoSuccess('Profile photo updated from faculty preset gallery.');
    showToast('Profile photo updated.');
    setTimeout(() => setPhotoSuccess(null), 3500);
  };

  // Handle Custom Photo URL
  const handleSaveCustomPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhotoUrl.trim()) return;
    const url = customPhotoUrl.trim();
    setCurrentPhoto(url);
    onUpdateProfile({
      avatarUrl: url,
      avatar: url
    });
    setCustomPhotoUrl('');
    setIsCustomUrlOpen(false);
    setPhotoSuccess('Custom photo URL applied successfully.');
    showToast('Profile photo updated.');
    setTimeout(() => setPhotoSuccess(null), 3500);
  };

  // Handle Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmNewPassword.trim();

    if (!trimmedCurrent) {
      setPwdError('Please enter your current password to authenticate.');
      return;
    }

    if (!trimmedNew) {
      setPwdError('Please enter your desired new password.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setPwdError('New passwords do not match. Please re-type carefully.');
      return;
    }

    if (trimmedNew.length < 4) {
      setPwdError('New password must be at least 4 characters long.');
      return;
    }

    // Verify current password against realActivePassword, currentUser hash or defaults
    const currentFast = fastHash(trimmedCurrent);
    const currentFull = await hashPassword(trimmedCurrent);
    const expectedHash = currentUser.passwordHash;

    const validSeeds: Record<string, string> = {
      'Manager': 'Manager 123',
      'Qr Code': 'Qr code 123',
      'TCH-8492': 'teach123',
      'TCH-1001': 'science123',
      'TCH-1002': 'english123',
      'TCH-1003': 'tech123'
    };

    const realMatch = trimmedCurrent === realActivePassword || trimmedCurrent === currentUser.rawPassword || trimmedCurrent === currentUser.currentPassword;
    const seedMatch = validSeeds[currentUser.employeeId] && validSeeds[currentUser.employeeId] === trimmedCurrent;
    const hashMatch = expectedHash && (expectedHash === currentFast || expectedHash === currentFull);
    const isStationMatch = currentUser.role === 'qr_station' && trimmedCurrent === 'Qr code 123';
    const isManagerMatch = currentUser.role === 'manager' && trimmedCurrent === 'Manager 123';

    if (!realMatch && !expectedHash && !seedMatch && !isStationMatch && !isManagerMatch) {
      // If no stored hash, proceed with seed or new
    } else if (!realMatch && expectedHash && !hashMatch && !seedMatch && !isStationMatch && !isManagerMatch) {
      setPwdError('Current password is incorrect. Please verify your current credentials.');
      return;
    }

    const newHash = await hashPassword(trimmedNew);
    onUpdateProfile({
      passwordHash: newHash,
      rawPassword: trimmedNew,
      currentPassword: trimmedNew
    });

    setCurrentPassword(trimmedNew);
    setNewPassword('');
    setConfirmNewPassword('');
    setPwdSuccess('Your password has been changed successfully. Use your new password on next sign-in.');
    showToast('Password updated securely.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {toastMsg && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
          <User className="w-4 h-4" />
          <span>Personal Portal Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Profile Photo & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Update your profile photo and secure your account password. Core institutional credentials are locked by administration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Profile Card & Photo Editor */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <img
                src={currentPhoto}
                alt={currentUser.name}
                className="w-28 h-28 rounded-3xl object-cover border-4 border-blue-500 shadow-lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Change Photo</span>
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">{currentUser.name}</h2>
              <p className="text-xs font-bold text-blue-600">{currentUser.subject || currentUser.department || 'Faculty'}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-mono font-bold">
                <IdCard className="w-3.5 h-3.5 text-slate-400" />
                <span>ID: {currentUser.employeeId}</span>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Role</span>
                <span className="font-bold text-slate-900 capitalize px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Department</span>
                <span className="font-semibold text-slate-800">{currentUser.department || 'General Faculty'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Email</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">{currentUser.email}</span>
              </div>
            </div>
          </div>

          {/* Photo Management Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Change Profile Photo</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload your picture or pick a standard avatar
                </p>
              </div>
            </div>

            {photoSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{photoSuccess}</span>
              </div>
            )}

            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomUrlOpen(!isCustomUrlOpen)}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image Link</span>
              </button>
            </div>

            {/* Custom URL Input Accordion */}
            {isCustomUrlOpen && (
              <form onSubmit={handleSaveCustomPhotoUrl} className="pt-2 space-y-2 animate-in fade-in">
                <input
                  type="url"
                  required
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Apply Photo URL
                </button>
              </form>
            )}

            {/* Preset Avatar Gallery */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-2">
                Or Select an Official Avatar:
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(url)}
                    className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                      currentPhoto === url ? 'border-blue-600 ring-2 ring-blue-400/50 scale-105' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    {currentPhoto === url && (
                      <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Institutional Info (Locked) & Change Password Form */}
        <div className="lg:col-span-7 space-y-6">

          {/* Institutional Records (Strictly Locked for Teachers and Mentors) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-700" />
                  <span>Institutional Records</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Core identity fields managed and verified by the Academic Manager.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Admin Locked</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                {isManager 
                  ? 'As the Academic Manager, you have full authority to modify faculty records and institutional rosters via the Academic Manager Portal.'
                  : 'Faculty Name, Employee ID, Institutional Email, and Department assignments cannot be modified directly in the teacher portal. To request a correction, please contact your Academic Manager.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Full Name</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.name}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Employee / Account ID</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.employeeId}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 font-bold cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Institutional Email</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Department</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.department || 'Academic Faculty'}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>Current Active Password</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">Real Credential</span>
                </label>
                <div className="relative">
                  <input
                    type={showRealPasswordBadge ? 'text' : 'password'}
                    disabled
                    value={realActivePassword}
                    className="w-full pl-3.5 pr-16 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-900 font-bold cursor-default select-all"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowRealPasswordBadge(!showRealPasswordBadge)}
                      className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                      title={showRealPasswordBadge ? 'Hide Password' : 'Show Real Password'}
                    >
                      {showRealPasswordBadge ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(realActivePassword);
                        showToast('Real password copied to clipboard!');
                      }}
                      className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                      title="Copy Real Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Form (Available to All Teachers, Station Mentors & Manager) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <span>Change Password</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update your real password at any time. Your current active password is verified below.
                </p>
              </div>
            </div>

            {/* Current Real Password Active Info Banner */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Active Institutional Password</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-blue-950 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                    {showRealPasswordBadge ? realActivePassword : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRealPasswordBadge(!showRealPasswordBadge)}
                    className="p-1 text-blue-600 hover:text-blue-900 cursor-pointer"
                    title={showRealPasswordBadge ? 'Hide Password' : 'Show Real Password'}
                  >
                    {showRealPasswordBadge ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(realActivePassword);
                      showToast('Real password copied to clipboard!');
                    }}
                    className="p-1 text-blue-600 hover:text-blue-900 cursor-pointer"
                    title="Copy Real Password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentPassword(realActivePassword);
                  showToast('Real password autofilled into Current Password input.');
                }}
                className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Autofill Current ({realActivePassword})
              </button>
            </div>

            {pwdError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Current Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentPassword(realActivePassword)}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Reset to Real Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current real password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="profile-update-password-btn"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
