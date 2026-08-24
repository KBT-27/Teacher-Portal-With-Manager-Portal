import React, { useState } from 'react';
import { 
  ArrowRight, 
  School,
  Lock,
  IdCard,
  LogIn,
  Mail,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { TeacherUser, NavTab, PasswordResetRequest } from '../types';
import { hashPassword, fastHash, getTeacherRealPassword } from '../lib/utils';

interface LoginViewProps {
  teachers?: TeacherUser[];
  users?: TeacherUser[];
  onLoginSuccess: (user: TeacherUser, defaultTab?: NavTab) => void;
  onOpenKiosk?: () => void;
  schoolName?: string;
  onRegisterUser?: (newUser: TeacherUser) => void;
  onSignUpTeacher?: (newUser: TeacherUser) => void;
  passwordResets?: PasswordResetRequest[];
  onSubmitPasswordReset?: (request: PasswordResetRequest) => void;
  onRequestPasswordReset?: (request: PasswordResetRequest) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  teachers,
  users,
  onLoginSuccess,
  onOpenKiosk: _onOpenKiosk,
  schoolName = 'EduSchool International Academy',
  onRegisterUser: _onRegisterUser,
  onSignUpTeacher: _onSignUpTeacher,
  passwordResets: _passwordResets = [],
  onSubmitPasswordReset,
  onRequestPasswordReset
}) => {
  const safeTeachers: TeacherUser[] = (teachers && teachers.length > 0 ? teachers : users) || [];
  const handleResetCallback = onSubmitPasswordReset || onRequestPasswordReset;

  const [authMode, setAuthMode] = useState<'signin' | 'forgot_password'>('signin');
  
  // Sign In Form States
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Form States
  const [resetEmail, setResetEmail] = useState('');
  const [resetTeacherId, setResetTeacherId] = useState('');
  const [resetRequestedPassword, setResetRequestedPassword] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [submittedResetRequest, setSubmittedResetRequest] = useState<PasswordResetRequest | null>(null);

  const managerUser = safeTeachers.find(t => t.role === 'manager') || {
    id: 'mgr-admin-01',
    name: 'Academic Manager',
    employeeId: 'Manager',
    passwordHash: fastHash('Manager 123'),
    email: 'academic.manager@eduschool.edu',
    department: 'Academic Administration',
    mentorName: 'School Principal',
    role: 'manager' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    phone: '+1 (555) 901-4422',
    roomNumber: 'Office 101 - Admin Suite',
    subjects: ['Institutional Leadership', 'Curriculum Oversight'],
    subject: 'Academic Administration',
    shiftTiming: '07:30 AM - 05:00 PM',
    status: 'active' as const
  };

  const defaultQrStationUser = safeTeachers.find(t => t.role === 'qr_station') || {
    id: 'qr-station-01',
    name: 'Station Mentor Officer',
    employeeId: 'Qr Code',
    passwordHash: fastHash('Qr code 123'),
    email: 'entrance.kiosk@eduschool.edu',
    department: 'Main Gate - Entrance Station #1',
    mentorName: 'Academic Manager',
    role: 'qr_station' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    phone: '+1 (555) 901-4422',
    roomNumber: 'Entrance Kiosk Terminal #1',
    subjects: ['QR Display', 'Badge Verification'],
    subject: 'Attendance Station',
    shiftTiming: '07:00 AM - 05:00 PM',
    status: 'active' as const
  };

  // Handle Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const trimmedId = employeeId.trim();
    const trimmedPwd = password.trim();

    if (!trimmedId || !trimmedPwd) {
      setErrorMsg('Please enter both your Employee/Account ID and password.');
      setIsSubmitting(false);
      return;
    }

    try {
      const inputHash = await hashPassword(trimmedPwd);
      const inputFastHash = fastHash(trimmedPwd);

      // 1. Check Station Mentor Login
      const isQRStation = 
        trimmedId.toLowerCase() === 'qr code' ||
        trimmedId.toLowerCase() === 'qrcode' ||
        trimmedId.toLowerCase() === 'qr station' ||
        trimmedId.toLowerCase() === 'station';

      if (isQRStation) {
        const targetStation = safeTeachers.find(t => t.role === 'qr_station') || defaultQrStationUser;
        const realPwd = getTeacherRealPassword(targetStation);
        const expectedHash = targetStation.passwordHash || fastHash('Qr code 123');
        const directMatch = trimmedPwd === realPwd || trimmedPwd === 'Qr code 123' || trimmedPwd.toLowerCase() === 'qr code 123' || (targetStation.rawPassword && trimmedPwd === targetStation.rawPassword) || (targetStation.currentPassword && trimmedPwd === targetStation.currentPassword);
        const hashMatch = expectedHash === inputHash || expectedHash === inputFastHash;

        if (directMatch || hashMatch) {
          onLoginSuccess(targetStation, 'qr_station');
          return;
        } else {
          setErrorMsg('Incorrect password for Mentor QR Attendance Station.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Check Academic Manager Login
      const isManager = 
        trimmedId.toLowerCase() === (managerUser.employeeId || 'manager').toLowerCase() ||
        trimmedId.toLowerCase() === 'manager';

      if (isManager) {
        const targetMgr = safeTeachers.find(t => t.role === 'manager') || managerUser;
        const realPwd = getTeacherRealPassword(targetMgr);
        const expectedHash = targetMgr.passwordHash || fastHash('Manager 123');
        const directMatch = trimmedPwd === realPwd || trimmedPwd === 'Manager 123' || trimmedPwd.toLowerCase() === 'manager 123' || (targetMgr.rawPassword && trimmedPwd === targetMgr.rawPassword) || (targetMgr.currentPassword && trimmedPwd === targetMgr.currentPassword);
        const hashMatch = expectedHash === inputHash || expectedHash === inputFastHash;

        if (directMatch || hashMatch) {
          onLoginSuccess(targetMgr, 'manager_dashboard');
          return;
        } else {
          setErrorMsg('Incorrect password for Academic Manager Portal.');
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Check Individual Faculty Teachers
      const foundTeacher = safeTeachers.find(
        (t) => (t?.employeeId || '').toLowerCase() === trimmedId.toLowerCase()
      );

      if (foundTeacher) {
        const realPwd = getTeacherRealPassword(foundTeacher);
        const expectedHash = foundTeacher.passwordHash;
        const validSeeds: Record<string, string> = {
          'TCH-8492': 'teach123',
          'TCH-1001': 'science123',
          'TCH-1002': 'english123',
          'TCH-1003': 'tech123'
        };

        const seedPass = validSeeds[foundTeacher.employeeId];
        const directSeedMatch = (seedPass && trimmedPwd === seedPass) || trimmedPwd === realPwd || (foundTeacher.rawPassword && trimmedPwd === foundTeacher.rawPassword) || (foundTeacher.currentPassword && trimmedPwd === foundTeacher.currentPassword);
        const hashMatch = expectedHash && (expectedHash === inputHash || expectedHash === inputFastHash || expectedHash === fastHash(trimmedPwd));

        if (directSeedMatch || hashMatch) {
          onLoginSuccess(foundTeacher, 'dashboard');
          return;
        } else {
          setErrorMsg(`Incorrect password for ${foundTeacher.name} (${foundTeacher.employeeId}).`);
          setIsSubmitting(false);
          return;
        }
      }

      setErrorMsg(`Account ID "${trimmedId}" was not recognized. Please check your credentials or contact your Academic Manager.`);
    } catch {
      setErrorMsg('An error occurred during authentication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password Form Submission
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrimmed = resetEmail.trim().toLowerCase();
    const idTrimmed = resetTeacherId.trim();

    if (!emailTrimmed && !idTrimmed) {
      setErrorMsg('Please provide either your institutional email or your Employee ID.');
      return;
    }

    const matchedTeacher = safeTeachers.find(
      t => (t.email || '').toLowerCase() === emailTrimmed ||
           (idTrimmed && (t.employeeId || '').toLowerCase() === idTrimmed.toLowerCase())
    );

    if (!matchedTeacher) {
      setErrorMsg('No faculty or staff account found matching that email or ID. Please check with your Academic Manager.');
      return;
    }

    const newRequest: PasswordResetRequest = {
      id: `rst-${Date.now()}`,
      teacherId: matchedTeacher.employeeId,
      teacherName: matchedTeacher.name,
      email: matchedTeacher.email,
      department: matchedTeacher.department,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      requestedNewPassword: resetRequestedPassword.trim() || undefined,
      reason: resetReason.trim() || 'Password reset requested via Login Portal'
    };

    if (handleResetCallback) {
      handleResetCallback(newRequest);
    }

    setSubmittedResetRequest(newRequest);
    setSuccessMsg(`Recovery request successfully dispatched for ${matchedTeacher.name}. The Academic Manager will review and reset your credentials.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <School className="w-9 h-9" />
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
          {schoolName}
        </h1>
        <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
          Sign in with your assigned ID and password to access your portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl shadow-xl border border-slate-200/80 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Employee ID / Account ID
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter ID (Faculty ID, Manager, or Qr Code)"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot_password');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      const matched = safeTeachers.find(t => t.employeeId.toLowerCase() === employeeId.trim().toLowerCase());
                      if (matched) {
                        setResetEmail(matched.email);
                        setResetTeacherId(matched.employeeId);
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-3 disabled:opacity-70"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
                <LogIn className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              {submittedResetRequest ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Request Submitted
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                      Your reset ticket for <strong>{typeof submittedResetRequest.teacherName === 'string' ? submittedResetRequest.teacherName : 'Faculty Member'}</strong> ({typeof submittedResetRequest.teacherId === 'string' ? submittedResetRequest.teacherId : ''}) has been routed to the Academic Manager for approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setSubmittedResetRequest(null);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer py-1"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Reset Password</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Submit a ticket to the Academic Manager to reset your portal password.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Institutional Email or Employee ID *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter institutional email or Teacher ID"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Desired New Password (Optional)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={resetRequestedPassword}
                        onChange={(e) => setResetRequestedPassword(e.target.value)}
                        placeholder="Enter desired new password"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="forgot-password-submit-btn"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Reset Request</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
                    >
                      Remembered password? Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
