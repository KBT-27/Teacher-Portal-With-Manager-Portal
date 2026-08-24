import React, { useState } from 'react';
import { 
  FileCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  Star,
  Download,
  Check
} from 'lucide-react';
import { SubmissionItem } from '../types';

interface SubmissionsViewProps {
  submissions: SubmissionItem[];
  onGradeSubmission?: (id: string, score: number, feedback: string) => void;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  submissions,
  onGradeSubmission
}) => {
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(95);
  const [feedback, setFeedback] = useState<string>('Excellent work!');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !onGradeSubmission) return;
    onGradeSubmission(selectedSub.id, Number(gradeScore), feedback);
    showToast(`Graded submission for ${selectedSub.studentName}.`);
    setSelectedSub(null);
  };

  const query = (search || '').toLowerCase();
  const filtered = submissions.filter(s => {
    if (!s) return false;
    return (s.studentName || '').toLowerCase().includes(query) ||
           (s.assignmentTitle || '').toLowerCase().includes(query) ||
           (s.studentId || '').toLowerCase().includes(query);
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
      <div>
        <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
          <FileCheck className="w-4 h-4" />
          <span>Grading Workflow</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Student Submissions & Reviews
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review homework uploads, assign points, and provide constructive feedback.
        </p>
      </div>

      {/* Search */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search submissions by student, assignment, ID..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-5">Assignment</th>
                <th className="py-3 px-5">Submitted Date</th>
                <th className="py-3 px-5">File</th>
                <th className="py-3 px-5">Score</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5">
                    <p className="font-bold text-slate-900">{sub.studentName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{sub.studentId}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-slate-800">{sub.assignmentTitle}</p>
                    <p className="text-[10px] text-slate-400">{sub.className || 'Mathematics'}</p>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-mono">
                    {sub.submittedDate}
                  </td>
                  <td className="py-3.5 px-5 text-blue-600 font-medium">
                    {sub.fileName || 'worksheet_submission.pdf'}
                  </td>
                  <td className="py-3.5 px-5">
                    {sub.score !== undefined ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold font-mono text-xs">
                        <Check className="w-3 h-3" />
                        <span>{sub.score} / 100</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] uppercase">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => {
                        setSelectedSub(sub);
                        setGradeScore(sub.score || 95);
                        setFeedback(sub.feedback || 'Great solution!');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      {sub.score !== undefined ? 'Edit Grade' : 'Score'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Grade Student Submission</h3>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedSub.studentName} ({selectedSub.studentId})</p>
              <p className="text-slate-600">{selectedSub.assignmentTitle}</p>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Score (out of 100) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teacher Feedback</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter constructive remarks..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
