import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Clock,
  Mail,
  Building2,
  HelpCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { TeacherUser, Department, PasswordResetRequest } from '../types';
import { hashPassword, fastHash, getTeacherRealPassword } from '../lib/utils';
import { ConfirmDialog, ConfirmDialogState } from './ConfirmDialog';

interface ManagerTeachersViewProps {
  teachers: TeacherUser[];
  departments: Department[];
  onSaveTeachers: (teachers: TeacherUser[]) => void;
  passwordResets?: PasswordResetRequest[];
  onApprovePasswordReset?: (requestId: string, approvedPassword?: string, managerNotes?: string) => void;
  onRejectPasswordReset?: (requestId: string, managerNotes?: string) => void;
}

export const ManagerTeachersView: React.FC<ManagerTeachersViewProps> = ({
  teachers,
  departments,
  onSaveTeachers,
  passwordResets: _passwordResets = [],
  onApprovePasswordReset: _onApprovePasswordReset,
  onRejectPasswordReset: _onRejectPasswordReset
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activePasswordModalTeacher, setActivePasswordModalTeacher] = useState<TeacherUser | null>(null);
  const [directNewPassword, setDirectNewPassword] = useState('');
  const [visiblePasswordTeacherIds, setVisiblePasswordTeacherIds] = useState<Record<string, boolean>>({});

  const toggleTeacherPasswordVisibility = (teacherId: string) => {
    setVisiblePasswordTeacherIds(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('password123');
  const [department, setDepartment] = useState('Mathematics & STEM');
  const [subject, setSubject] = useState('Mathematics');
  const [role, setRole] = useState<'teacher' | 'manager' | 'qr_station'>('teacher');

  const pendingResets = passwordResets.filter(r => r.status === 'pending');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setEmail('');
    setEmployeeId(`TCH-${Math.floor(1000 + Math.random() * 9000)}`);
    setPassword('password123');
    setDepartment(departments[0]?.name || 'Mathematics & STEM');
    setSubject('Mathematics');
    setRole('teacher');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (tch: TeacherUser) => {
    setEditingTeacher(tch);
    setName(tch.name);
    setEmail(tch.email);
    setEmployeeId(tch.employeeId);
    setPassword(getTeacherRealPassword(tch));
    setDepartment(tch.department || departments[0]?.name || 'Mathematics & STEM');
    setSubject(tch.subject || 'Faculty');
    setRole(tch.role === 'manager' ? 'manager' : 'teacher');
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim()) return;

    if (editingTeacher) {
      let pwdHash = editingTeacher.passwordHash;
      const rawPwd = password.trim();
      if (rawPwd) {
        pwdHash = await hashPassword(rawPwd);
      }
      const updated = teachers.map(t => {
        if (t.id === editingTeacher.id) {
          return {
            ...t,
            name: name.trim(),
            email: email.trim(),
            employeeId: employeeId.trim(),
            passwordHash: pwdHash,
            rawPassword: rawPwd || t.rawPassword || getTeacherRealPassword(t),
            currentPassword: rawPwd || t.currentPassword || t.rawPassword || getTeacherRealPassword(t),
            role,
            department: department.trim(),
            subject: subject.trim()
          };
        }
        return t;
      });
      onSaveTeachers(updated);
      showToast(`Updated credentials & profile for ${name}.`);
    } else {
      const rawPwd = password.trim() || 'password123';
      const pwdHash = await hashPassword(rawPwd);
      const newTeacher: TeacherUser = {
        id: `tch-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        employeeId: employeeId.trim(),
        passwordHash: pwdHash,
        rawPassword: rawPwd,
        currentPassword: rawPwd,
        role,
        department: department.trim(),
        subject: subject.trim(),
        status: 'active',
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      };
      onSaveTeachers([...teachers, newTeacher]);
      showToast(`Added new teacher ${name} (${department.trim()}) to faculty.`);
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteTeacher = (tch: TeacherUser) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Erase Teacher Account',
      message: `Are you sure you want to completely erase ${tch.name} (${tch.employeeId}) from the faculty directory? This action cannot be undone.`,
      confirmText: 'Erase Faculty Account',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        onSaveTeachers(teachers.filter(t => t.id !== tch.id));
        showToast(`Erased ${tch.name} from faculty database.`);
      }
    });
  };

  const handleOpenDirectPasswordModal = (tch: TeacherUser) => {
    setActivePasswordModalTeacher(tch);
    setDirectNewPassword(handleGeneratePassword());
  };

  const handleSaveDirectPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePasswordModalTeacher || !directNewPassword.trim()) return;

    const rawPwd = directNewPassword.trim();
    const newHash = await hashPassword(rawPwd);
    const updated = teachers.map(t => {
      if (t.id === activePasswordModalTeacher.id) {
        return { 
          ...t, 
          passwordHash: newHash,
          rawPassword: rawPwd,
          currentPassword: rawPwd
        };
      }
      return t;
    });

    onSaveTeachers(updated);
    showToast(`Password updated for ${activePasswordModalTeacher.name}: "${rawPwd}"`);
    setActivePasswordModalTeacher(null);
  };

  const query = (search || '').toLowerCase();
  const filteredTeachers = teachers.filter(t => {
    if (!t) return false;
    const matchSearch = 
      (t.name || '').toLowerCase().includes(query) || 
      (t.employeeId || '').toLowerCase().includes(query) || 
      (t.subject || (Array.isArray(t.subjects) ? t.subjects.join(' ') : '') || '').toLowerCase().includes(query) ||
      (t.department || '').toLowerCase().includes(query);
    const matchDept = selectedDept === 'All' || t.department === selectedDept;
    return matchSearch && matchDept;
  });

  // Get distinct departments from both teachers and departments list
  const allDepartmentNames = Array.from(
    new Set([
      ...departments.map(d => d.name),
      ...teachers.map(t => t.department).filter(Boolean)
    ])
  );

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
            <Users className="w-4 h-4" />
            <span>Faculty Directory & Staff Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Teacher Accounts & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision ID cards, set unique passwords for each faculty member, and type any custom department.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Teacher</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers by name, ID, subject, or department..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDept('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              selectedDept === 'All' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Departments
          </button>
          {allDepartmentNames.map(deptName => (
            <button
              key={deptName}
              onClick={() => setSelectedDept(deptName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedDept === deptName ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {deptName}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((t) => {
          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.role === 'manager' ? 'Academic Manager' : (t.role === 'qr_station' ? 'Entrance Station' : 'Faculty Teacher')}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    {t.employeeId}
                  </span>
                </div>

                <div className="flex items-center space-x-3 mt-4">
                  <img
                    src={t.avatarUrl || t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={t.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{t.name}</h3>
                    <p className="text-xs font-bold text-blue-600">{t.subject || 'Faculty'}</p>
                    <p className="text-[11px] text-slate-500">{t.department}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">Email:</span>
                    <span className="font-medium text-slate-800 truncate" title={t.email}>{t.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">Department:</span>
                    <span className="font-medium text-slate-800 truncate" title={t.department}>{t.department}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Real Password:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {visiblePasswordTeacherIds[t.id] ? getTeacherRealPassword(t) : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleTeacherPasswordVisibility(t.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title={visiblePasswordTeacherIds[t.id] ? "Hide Password" : "Show Real Password"}
                      >
                        {visiblePasswordTeacherIds[t.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getTeacherRealPassword(t));
                          showToast(`Copied real password for ${t.name}`);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title="Copy Real Password"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">Security:</span>
                    <button
                      onClick={() => handleOpenDirectPasswordModal(t)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                {t.role !== 'manager' && (
                  <button
                    onClick={() => handleDeleteTeacher(t)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Erase Teacher Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPREHENSIVE AUTHORIZE PASSWORD RESET MODAL */}
      {selectedResetReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Authorize Password Reset
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review faculty identity, requested wish/reason, and assign password
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedResetReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Complete Teacher Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 font-black flex items-center justify-center border border-blue-200 text-sm">
                    {String(selectedResetReq.teacherName || 'T').charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedResetReq.teacherName}</h4>
                    <p className="font-mono text-indigo-700 font-bold">{selectedResetReq.teacherId}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase">
                  Pending Approval
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email:
                  </span>
                  <p className="text-slate-800 truncate font-medium" title={selectedResetReq.email}>{selectedResetReq.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Department:
                  </span>
                  <p className="text-slate-800 font-medium">{selectedResetReq.department || 'Faculty'}</p>
                </div>
              </div>

              {/* Wish / Reason Provided by Teacher */}
              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-amber-600" /> Teacher's Reason / Note:
                </span>
                <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 italic">
                  "{selectedResetReq.reason || 'Password reset requested via School Entrance Portal'}"
                </p>
              </div>

              {/* Teacher's Desired Password if specified */}
              {selectedResetReq.requestedNewPassword && (
                <div className="pt-1 flex items-center justify-between bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/70">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Teacher's Desired Password:</span>
                    <p className="font-mono font-bold text-blue-900 text-xs">{selectedResetReq.requestedNewPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickApprovedPass(selectedResetReq.requestedNewPassword || '')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Use This Password
                  </button>
                </div>
              )}
            </div>

            {/* Form to Assign Approved Password */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Authorized Password to Assign to Profile *
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickApprovedPass(handleGeneratePassword())}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordInModal ? "text" : "text"}
                    required
                    value={quickApprovedPass}
                    onChange={(e) => setQuickApprovedPass(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(quickApprovedPass);
                      showToast('Password copied to clipboard!');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    title="Copy Password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  When authorized, this password will immediately become active in the teacher's profile.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onRejectPasswordReset) {
                      onRejectPasswordReset(selectedResetReq.id, 'Declined by Academic Manager');
                    }
                    setSelectedResetReq(null);
                    showToast(`Rejected password reset for ${selectedResetReq.teacherName}`);
                  }}
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Decline Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!quickApprovedPass.trim()) {
                      alert('Please provide a valid password to assign.');
                      return;
                    }
                    if (onApprovePasswordReset) {
                      onApprovePasswordReset(selectedResetReq.id, quickApprovedPass.trim(), 'Authorized by Academic Manager');
                    }
                    setSelectedResetReq(null);
                    showToast(`Approved! New password "${quickApprovedPass.trim()}" is now active for ${selectedResetReq.teacherName}.`);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Authorize & Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT CHANGE PASSWORD MODAL */}
      {activePasswordModalTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
              </div>
              <button 
                onClick={() => setActivePasswordModalTeacher(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <div>
                <p className="font-bold text-slate-900">{activePasswordModalTeacher.name} ({activePasswordModalTeacher.employeeId})</p>
                <p className="text-slate-600">{activePasswordModalTeacher.department} • {activePasswordModalTeacher.email}</p>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-xs">
                <span className="text-[11px] font-bold text-slate-500">Current Real Password:</span>
                <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {getTeacherRealPassword(activePasswordModalTeacher)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveDirectPassword} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">New Password for Profile</label>
                  <button
                    type="button"
                    onClick={() => setDirectNewPassword(handleGeneratePassword())}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={directNewPassword}
                    onChange={(e) => setDirectNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(directNewPassword);
                      showToast('Password copied to clipboard!');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    title="Copy Password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePasswordModalTeacher(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Save to Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT TEACHER MODAL (WITH WRITEABLE DEPARTMENT INPUT) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingTeacher ? 'Edit Teacher Credentials' : 'Add New Faculty Member'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="TCH-1005"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingTeacher ? 'Current / New Password *' : 'Account Password *'}
                  </label>
                  <input
                    type="text"
                    required={!editingTeacher}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingTeacher ? 'Enter real password' : 'password123'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@eduschool.edu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'teacher' | 'manager' | 'qr_station')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="teacher">Faculty Teacher</option>
                    <option value="manager">Academic Manager</option>
                    <option value="qr_station">QR Attendance Desk (Station)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Write Department *</label>
                    <span className="text-[10px] text-blue-600 font-semibold">Custom Type</span>
                  </div>
                  {/* Writeable custom department input with datalist suggestions */}
                  <input
                    type="text"
                    list="available-departments-list"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Type department name..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="available-departments-list">
                    {allDepartmentNames.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingTeacher ? 'Save Credentials' : 'Create Teacher Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

