import React, { useState } from 'react';
import { 
  KeyRound, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  Sparkles, 
  Copy, 
  Eye, 
  EyeOff, 
  Filter, 
  ShieldCheck, 
  Plus, 
  UserCheck, 
  Building2,
  Trash2,
  Lock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { PasswordResetRequest, TeacherUser } from '../types';
import { hashPassword, getTeacherRealPassword } from '../lib/utils';
import { ConfirmDialog, ConfirmDialogState } from './ConfirmDialog';

interface ManagerPasswordResetsViewProps {
  requests: PasswordResetRequest[];
  teachers: TeacherUser[];
  onApproveRequest: (requestId: string, approvedPassword?: string, managerNotes?: string) => void;
  onRejectRequest: (requestId: string, managerNotes?: string) => void;
  onSaveRequests?: (requests: PasswordResetRequest[]) => void;
  onRequestPasswordReset?: (req: PasswordResetRequest) => void;
}

export const ManagerPasswordResetsView: React.FC<ManagerPasswordResetsViewProps> = ({
  requests = [],
  teachers = [],
  onApproveRequest,
  onRejectRequest,
  onSaveRequests,
  onRequestPasswordReset
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Authorize / Approve modal
  const [selectedReq, setSelectedReq] = useState<PasswordResetRequest | null>(null);
  const [approvedPass, setApprovedPass] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reject modal
  const [rejectingReq, setRejectingReq] = useState<PasswordResetRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Create manual request modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [manualRequestedPass, setManualRequestedPass] = useState('');
  const [manualReason, setManualReason] = useState('Verbal / in-person teacher request to Academic Manager');

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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

  const handleOpenApprove = (req: PasswordResetRequest) => {
    setSelectedReq(req);
    setApprovedPass(req.requestedNewPassword || handleGeneratePassword());
    setManagerNotes(`Authorized by Academic Manager on ${new Date().toLocaleDateString()}`);
    setShowPassword(false);
  };

  const handleConfirmApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    const finalPass = approvedPass.trim() || 'faculty123';
    onApproveRequest(selectedReq.id, finalPass, managerNotes);
    showToast(`Approved password reset for ${selectedReq.teacherName}. New password: "${finalPass}"`);
    setSelectedReq(null);
  };

  const handleOpenReject = (req: PasswordResetRequest) => {
    setRejectingReq(req);
    setRejectReason('Identity unverified or superseded by regular login.');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;
    onRejectRequest(rejectingReq.id, rejectReason);
    showToast(`Rejected request for ${rejectingReq.teacherName}.`);
    setRejectingReq(null);
  };

  const handleCreateManualRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const tch = teachers.find(t => t.employeeId === selectedTeacherId || t.id === selectedTeacherId);
    if (!tch) return;

    if (onRequestPasswordReset) {
      const newReq: PasswordResetRequest = {
        id: `reset-${Date.now()}`,
        teacherId: tch.employeeId,
        teacherName: tch.name,
        email: tch.email,
        department: tch.department,
        requestedAt: new Date().toISOString(),
        requestedNewPassword: manualRequestedPass.trim() || undefined,
        reason: manualReason.trim() || 'Manual request logged by Academic Manager',
        status: 'pending'
      };
      onRequestPasswordReset(newReq);
      showToast(`Logged forgetting request for ${tch.name}.`);
    }
    setIsManualModalOpen(false);
    setSelectedTeacherId('');
    setManualRequestedPass('');
  };

  const handleClearResolved = () => {
    if (!onSaveRequests) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Resolved History',
      message: 'Are you sure you want to remove all approved and rejected history records? Pending requests will be preserved.',
      confirmText: 'Clear Resolved',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const keepPending = requests.filter(r => r.status === 'pending');
        onSaveRequests(keepPending);
        showToast('Cleared resolved history.');
      }
    });
  };

  // Filtered list
  const query = (search || '').toLowerCase();
  const filtered = requests.filter(r => {
    if (!r) return false;
    const matchSearch = 
      (r.teacherName || '').toLowerCase().includes(query) ||
      (r.teacherId || '').toLowerCase().includes(query) ||
      (r.email || '').toLowerCase().includes(query) ||
      (r.department || '').toLowerCase().includes(query) ||
      (r.reason || '').toLowerCase().includes(query);

    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
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
            <KeyRound className="w-4 h-4" />
            <span>Academic Manager Credential Authorization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Forgetting Requests & Password Resets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage teacher forgot-password inquiries, authorize new credentials, and inspect reset logs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRequestPasswordReset && (
            <button
              onClick={() => {
                if (teachers.length > 0) {
                  setSelectedTeacherId(teachers[0].employeeId);
                  setManualRequestedPass(handleGeneratePassword());
                }
                setIsManualModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Forgetting Request</span>
            </button>
          )}

          {onSaveRequests && (approvedCount > 0 || rejectedCount > 0) && (
            <button
              onClick={handleClearResolved}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Clear Approved/Rejected History"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all' ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Requests</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{totalCount}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">All Logs</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Pending Action</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600 font-mono">{pendingCount}</span>
            {pendingCount > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">Needs Review</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Clear</span>
            )}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('approved')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'approved' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Approved & Reset</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 font-mono">{approvedCount}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Authorized</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'rejected' ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rejected</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-700 font-mono">{rejectedCount}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Dismissed</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by teacher name, employee ID, email, or request reason..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st === 'all' ? 'All' : st} {st === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Forgetting Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search || statusFilter !== 'all' 
                ? 'No password reset requests match your search or filter.' 
                : 'There are currently no forgotten password requests pending for faculty members.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Faculty Member</th>
                  <th className="py-3.5 px-4">Department & Email</th>
                  <th className="py-3.5 px-4">Request Time & Note</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => {
                  const teacher = teachers.find(t => t.employeeId === req.teacherId || t.email === req.email);
                  const currentRealPwd = teacher ? getTeacherRealPassword(teacher) : 'teach123';
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Faculty Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                            {(req.teacherName || 'T').charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{req.teacherName || 'Faculty Member'}</span>
                            <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-semibold">
                              {req.teacherId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Email */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 block">{req.department || teacher?.department || 'General Faculty'}</span>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{req.email || teacher?.email || 'N/A'}</span>
                      </td>

                      {/* Time & Reason */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : req.requestDate || 'Recent'}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 max-w-xs line-clamp-2">
                          {req.reason || 'Forgot account credentials; requesting manager reset.'}
                        </p>
                        {req.requestedNewPassword && (
                          <span className="inline-block mt-1 text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                            Requested pass: {req.requestedNewPassword}
                          </span>
                        )}
                        {req.managerNotes && (
                          <p className="text-[10px] text-emerald-700 font-medium mt-1">
                            Note: {req.managerNotes}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-rose-500" />
                            <span>Pending</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenApprove(req)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Authorize</span>
                            </button>
                            <button
                              onClick={() => handleOpenReject(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              title="Reject Request"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            {teacher && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(currentRealPwd);
                                  showToast(`Copied real password for ${teacher.name}`);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                                title="Copy Current Real Password"
                              >
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Copy Pass</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenApprove(req)}
                              className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Re-Reset
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Authorize Password Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5 text-slate-900 font-black text-base">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span>Authorize & Reset Password</span>
              </div>
              <button 
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1 text-xs">
              <p className="font-bold text-blue-950">
                Faculty Member: {selectedReq.teacherName} ({selectedReq.teacherId})
              </p>
              <p className="text-blue-800">
                Department: {selectedReq.department || 'Faculty'} • Email: {selectedReq.email}
              </p>
              {selectedReq.reason && (
                <p className="text-slate-600 text-[11px] mt-1 pt-1 border-t border-blue-200/50">
                  Reason: "{selectedReq.reason}"
                </p>
              )}
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    New Active Real Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setApprovedPass(handleGeneratePassword())}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={approvedPass}
                    onChange={(e) => setApprovedPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                    placeholder="Enter new password"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(approvedPass);
                        showToast('Password copied to clipboard!');
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manager Approval Note (Optional)
                </label>
                <input
                  type="text"
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Identity confirmed in faculty office"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize & Set Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600 font-black text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Reject Forgetting Request</span>
              </div>
              <button 
                onClick={() => setRejectingReq(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to reject the password reset request for <strong>{rejectingReq.teacherName}</strong> ({rejectingReq.teacherId})?
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Explain why this request is rejected..."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Request Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900 font-black text-base">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Log New Forgetting Request</span>
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualRequest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Faculty Teacher *
                </label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.employeeId}>
                      {t.name} ({t.employeeId}) - {t.department || 'Faculty'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason / Notes *
                </label>
                <input
                  type="text"
                  required
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Teacher requested reset via phone"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Suggested Temporary Password (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setManualRequestedPass(handleGeneratePassword())}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={manualRequestedPass}
                  onChange={(e) => setManualRequestedPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty or enter suggested pass"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Log Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
