import React, { useState, useRef } from 'react';
import { 
  FileCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  Star,
  Download, 
  Upload,
  Check,
  X,
  Trash2,
  Filter,
  Building,
  User,
  MessageSquare,
  FileSpreadsheet,
  PlusCircle
} from 'lucide-react';
import { SubmissionItem, TeacherUser, AssignmentItem } from '../types';
import { exportToCSV, exportToJSON, parseCSV } from '../lib/csvExportImport';

interface SubmissionsViewProps {
  currentUser?: TeacherUser;
  submissions: SubmissionItem[];
  assignments?: AssignmentItem[];
  teachers?: TeacherUser[];
  onGradeSubmission?: (id: string, score: number, feedback: string) => void;
  onAcceptSubmission?: (id: string, feedback: string) => void;
  onRejectSubmission?: (id: string, feedback: string) => void;
  onDeleteSubmission?: (id: string) => void;
  onSaveSubmissions?: (submissions: SubmissionItem[]) => void;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  currentUser,
  submissions,
  assignments = [],
  teachers = [],
  onGradeSubmission,
  onAcceptSubmission,
  onRejectSubmission,
  onDeleteSubmission,
  onSaveSubmissions
}) => {
  const isManager = currentUser?.role === 'manager';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  
  // Scoring state
  const [gradeScore, setGradeScore] = useState<number>(10);
  const [feedback, setFeedback] = useState<string>('Well done, deliverables approved!');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenReview = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    const max = sub.maxScore || 10;
    setGradeScore(sub.score !== undefined ? sub.score : max);
    setFeedback(sub.managerFeedback || sub.feedback || 'Deliverable reviewed and approved.');
  };

  const handleAccept = (sub: SubmissionItem) => {
    if (onAcceptSubmission) {
      onAcceptSubmission(sub.id, feedback);
    } else if (onSaveSubmissions) {
      onSaveSubmissions(submissions.map(s => s.id === sub.id ? { 
        ...s, 
        status: 'accepted', 
        managerFeedback: feedback,
        feedback,
        reviewedAt: new Date().toLocaleString(),
        reviewedBy: currentUser?.name || 'Academic Manager'
      } : s));
    }
    showToast(`Accepted submission by ${sub.teacherName || sub.studentName}.`);
    setSelectedSub(null);
  };

  const handleReject = (sub: SubmissionItem) => {
    if (onRejectSubmission) {
      onRejectSubmission(sub.id, feedback);
    } else if (onSaveSubmissions) {
      onSaveSubmissions(submissions.map(s => s.id === sub.id ? { 
        ...s, 
        status: 'rejected', 
        managerFeedback: feedback,
        feedback,
        reviewedAt: new Date().toLocaleString(),
        reviewedBy: currentUser?.name || 'Academic Manager'
      } : s));
    }
    showToast(`Marked submission by ${sub.teacherName || sub.studentName} as Rejected / Needs Revision.`);
    setSelectedSub(null);
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    const finalScore = Number(gradeScore);

    if (onGradeSubmission) {
      onGradeSubmission(selectedSub.id, finalScore, feedback);
    } else if (onSaveSubmissions) {
      onSaveSubmissions(submissions.map(s => s.id === selectedSub.id ? { 
        ...s, 
        score: finalScore,
        status: 'graded', 
        managerFeedback: feedback,
        feedback,
        reviewedAt: new Date().toLocaleString(),
        reviewedBy: currentUser?.name || 'Academic Manager'
      } : s));
    }
    showToast(`Graded submission for ${selectedSub.teacherName || selectedSub.studentName}: ${finalScore}/${selectedSub.maxScore || 10} Points.`);
    setSelectedSub(null);
  };

  const handleDeleteSubmission = (sub: SubmissionItem) => {
    if (!isManager) {
      showToast('Permission Denied: Only Academic Manager can remove submissions.');
      return;
    }
    if (!confirm(`Are you sure you want to remove submission by ${sub.teacherName || sub.studentName}?`)) return;
    if (onDeleteSubmission) {
      onDeleteSubmission(sub.id);
    } else if (onSaveSubmissions) {
      onSaveSubmissions(submissions.filter(s => s.id !== sub.id));
    }
    showToast('Submission removed.');
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(submissions, `teacher_submissions_${new Date().toISOString().split('T')[0]}`, [
      { key: 'id', label: 'Submission ID' },
      { key: 'assignmentTitle', label: 'Task Title' },
      { key: 'teacherName', label: 'Teacher Name' },
      { key: 'teacherId', label: 'Teacher ID' },
      { key: 'submittedAt', label: 'Submitted Date' },
      { key: 'submissionMethod', label: 'Method' },
      { key: 'evaluationType', label: 'Evaluation Type' },
      { key: 'status', label: 'Status' },
      { key: 'score', label: 'Score' },
      { key: 'maxScore', label: 'Max Score' },
      { key: 'managerFeedback', label: 'Manager Feedback' },
      { key: 'submissionText', label: 'Submission Text' }
    ]);
    showToast('Exported submissions to CSV.');
  };

  const handleExportJSON = () => {
    exportToJSON(submissions, `teacher_submissions_${new Date().toISOString().split('T')[0]}`);
    showToast('Exported submissions to JSON.');
  };

  // Import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let importedList: SubmissionItem[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          importedList = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const rows = parseCSV(text);
          importedList = rows.map((r, i) => ({
            id: r['Submission ID'] || r['id'] || `sub-imp-${Date.now()}-${i}`,
            assignmentId: r['assignmentId'] || 'asg-generic',
            assignmentTitle: r['Task Title'] || r['assignmentTitle'] || 'Faculty Task',
            teacherName: r['Teacher Name'] || r['teacherName'] || r['studentName'] || 'Faculty Teacher',
            teacherId: r['Teacher ID'] || r['teacherId'] || 'TCH-001',
            submittedAt: r['Submitted Date'] || r['submittedAt'] || new Date().toLocaleString(),
            submissionMethod: (r['Method'] === 'in_person' || r['submissionMethod'] === 'in_person') ? 'in_person' : 'online',
            evaluationType: (r['Evaluation Type'] === 'points' || r['evaluationType'] === 'points') ? 'points' : 'accept_reject',
            status: r['Status'] || r['status'] || 'pending',
            score: r['Score'] ? Number(r['Score']) : undefined,
            maxScore: Number(r['Max Score'] || r['maxScore']) || 10,
            managerFeedback: r['Manager Feedback'] || r['managerFeedback'] || '',
            submissionText: r['Submission Text'] || r['submissionText'] || ''
          }));
        }

        if (importedList.length > 0) {
          if (onSaveSubmissions) {
            onSaveSubmissions([...importedList, ...submissions]);
          }
          showToast(`Imported ${importedList.length} submissions!`);
          setIsImportModalOpen(false);
        } else {
          alert('Could not find valid submission records in file.');
        }
      } catch (err) {
        alert('Failed to parse import file. Please check format.');
      }
    };
    reader.readAsText(file);
  };

  const query = (search || '').toLowerCase();
  const filtered = submissions.filter(s => {
    if (!s) return false;
    const name = s.teacherName || s.studentName || '';
    const title = s.assignmentTitle || '';
    const id = s.teacherId || s.studentId || '';

    const matchQuery = 
      name.toLowerCase().includes(query) ||
      title.toLowerCase().includes(query) ||
      id.toLowerCase().includes(query);

    const matchStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && (s.status === 'pending' || !s.status)) ||
      (filterStatus === 'accepted' && s.status === 'accepted') ||
      (filterStatus === 'rejected' && s.status === 'rejected') ||
      (filterStatus === 'graded' && (s.status === 'graded' || s.score !== undefined));

    const matchType = 
      filterType === 'all' ||
      (filterType === 'accept_reject' && s.evaluationType === 'accept_reject') ||
      (filterType === 'points' && s.evaluationType === 'points');

    return matchQuery && matchStatus && matchType;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
            <FileCheck className="w-4 h-4" />
            <span>Faculty Evaluations & Deliverables</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Teacher Submissions & Reviews
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review completed assignments from faculty, evaluate Accept/Reject decisions, or fill and adjust points scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Import Submissions"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submissions by teacher, assignment, ID..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Status ({submissions.length})</option>
            <option value="pending">Pending Review</option>
            <option value="accepted">Accepted ✅</option>
            <option value="rejected">Rejected ❌</option>
            <option value="graded">Graded / Points ⭐</option>
          </select>
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Evaluation Types</option>
            <option value="accept_reject">Accept / Reject</option>
            <option value="points">Points Scoring</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Teacher Submissions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When teachers complete and submit their assigned tasks, their responses, notes, and file deliverables will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-5">Teacher / Faculty</th>
                  <th className="py-3.5 px-5">Task / Assignment</th>
                  <th className="py-3.5 px-5">Submitted Date & Mode</th>
                  <th className="py-3.5 px-5">Deliverable Note</th>
                  <th className="py-3.5 px-5">Evaluation / Score</th>
                  <th className="py-3.5 px-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sub) => {
                  const teacherDisplayName = sub.teacherName || sub.studentName || 'Faculty Teacher';
                  const teacherDisplayId = sub.teacherId || sub.studentId || 'TCH-FACULTY';
                  const isAcceptReject = sub.evaluationType === 'accept_reject';
                  const maxPts = sub.maxScore || 10;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {teacherDisplayName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{teacherDisplayName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{teacherDisplayId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-800 block">{sub.assignmentTitle}</span>
                        <span className="text-[10px] text-slate-400">
                          {isAcceptReject ? 'Mode: Accept/Reject' : `Mode: Points (Max ${maxPts} Pts)`}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="text-slate-700 font-mono text-[11px] block">{sub.submittedAt || sub.submittedDate || 'Recent'}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                          sub.submissionMethod === 'in_person'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sub.submissionMethod === 'in_person' ? 'Office Hand-in' : 'Online Document'}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 text-[11px]">
                          {sub.submissionText || sub.fileName || 'Completed syllabus deliverable submitted.'}
                        </p>
                      </td>

                      <td className="py-3.5 px-5">
                        {sub.status === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            <span>Accepted</span>
                          </span>
                        ) : sub.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-[10px] font-bold">
                            <X className="w-3 h-3" />
                            <span>Rejected / Revision</span>
                          </span>
                        ) : sub.status === 'graded' || sub.score !== undefined ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 text-[11px] font-black font-mono">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                            <span>{sub.score} / {maxPts} Pts</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenReview(sub)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          {sub.status === 'pending' || !sub.status ? 'Review & Grade' : 'Edit Review'}
                        </button>
                        
                        {isManager && (
                          <button
                            onClick={() => handleDeleteSubmission(sub)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                            title="Erase submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* REVIEW & EVALUATION MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">School Manager Review Console</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedSub.assignmentTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by: <strong>{selectedSub.teacherName || selectedSub.studentName}</strong> ({selectedSub.teacherId || selectedSub.studentId})
                </p>
              </div>
              <button 
                onClick={() => setSelectedSub(null)} 
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Submission Content Review */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Teacher Deliverable Notes:</span>
                <span className="text-[10px] text-slate-400 font-mono">{selectedSub.submittedAt || 'Recent'}</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                {selectedSub.submissionText || 'No text note provided.'}
              </p>
              {selectedSub.fileName && (
                <div className="flex items-center space-x-2 text-xs text-blue-700 font-bold bg-blue-50 p-2 rounded-xl border border-blue-100">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{selectedSub.fileName}</span>
                </div>
              )}
            </div>

            {/* Evaluation Form */}
            {selectedSub.evaluationType === 'accept_reject' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manager Review Notes & Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback or instructions for the teacher..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-purple-700" />
                    <span>Accept / Reject Verdict</span>
                  </div>
                  <p className="text-[11px] text-purple-800">
                    If approved, click "Accept Deliverable". If the teacher needs to revise or redo, click "Reject / Request Revision".
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleReject(selectedSub)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject / Request Revision</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept(selectedSub)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Deliverable ✅</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">Assign Score (Out of {selectedSub.maxScore || 10} Points) *</label>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      Score: {gradeScore} / {selectedSub.maxScore || 10}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="0"
                      max={selectedSub.maxScore || 1000}
                      step="0.5"
                      required
                      value={gradeScore}
                      onChange={(e) => setGradeScore(Number(e.target.value))}
                      className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Auto-fill quick buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGradeScore(selectedSub.maxScore || 10)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Full ({selectedSub.maxScore || 10}p)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeScore(Math.round((selectedSub.maxScore || 10) * 0.9 * 10) / 10)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        90% ({Math.round((selectedSub.maxScore || 10) * 0.9 * 10) / 10}p)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeScore(Math.round((selectedSub.maxScore || 10) * 0.8 * 10) / 10)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        80% ({Math.round((selectedSub.maxScore || 10) * 0.8 * 10) / 10}p)
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manager Constructive Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Feedback notes, strengths, and areas for improvement..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSub(null)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Save Points & Feedback</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Import Teacher Submissions</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Upload a <strong>.csv</strong> or <strong>.json</strong> file of teacher submissions to import records.
            </p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl text-center bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer space-y-2"
            >
              <Upload className="w-8 h-8 text-blue-600 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Click to browse or drag file here</div>
              <div className="text-[10px] text-slate-400">Supports .csv or .json files</div>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.json" 
              onChange={handleFileUpload} 
              className="hidden" 
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
