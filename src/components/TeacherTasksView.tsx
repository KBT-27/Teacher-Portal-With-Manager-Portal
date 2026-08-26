import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  AlertCircle, 
  Send, 
  Check, 
  X, 
  Star, 
  MessageSquare, 
  Upload,
  Search,
  Filter,
  Info,
  Building
} from 'lucide-react';
import { AssignmentItem, SubmissionItem, TeacherUser } from '../types';

interface TeacherTasksViewProps {
  currentUser: TeacherUser;
  assignments: AssignmentItem[];
  submissions: SubmissionItem[];
  onSubmitTask: (submission: SubmissionItem) => void;
  onUpdateSubmission?: (submission: SubmissionItem) => void;
}

export const TeacherTasksView: React.FC<TeacherTasksViewProps> = ({
  currentUser,
  assignments,
  submissions,
  onSubmitTask,
  onUpdateSubmission
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedTask, setSelectedTask] = useState<AssignmentItem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileName, setFileName] = useState('');
  const [submissionMethod, setSubmissionMethod] = useState<'online' | 'in_person'>('online');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filter tasks targeted to this teacher or to "All"
  const myTasks = assignments.filter(task => {
    if (!task) return false;
    const targetType = task.targetTeacherType || 'all';
    const targetId = (task.targetTeacherId || '').toLowerCase().trim();
    const targetName = (task.targetTeacherName || '').toLowerCase().trim();
    
    const teacherId = (currentUser.employeeId || currentUser.id || '').toLowerCase().trim();
    const teacherName = (currentUser.name || '').toLowerCase().trim();

    if (targetType === 'all' || targetId === 'all' || targetName === 'all' || targetName === 'all teachers') {
      return true;
    }

    const matchesId = targetId && (teacherId.includes(targetId) || targetId.includes(teacherId));
    const matchesName = targetName && (teacherName.includes(targetName) || targetName.includes(teacherName));
    
    return matchesId || matchesName;
  });

  const getMySubmission = (taskId: string) => {
    return submissions.find(s => 
      s.assignmentId === taskId && 
      (s.teacherId === currentUser.employeeId || s.teacherId === currentUser.id || s.teacherName === currentUser.name)
    );
  };

  const handleOpenSubmitModal = (task: AssignmentItem) => {
    const existing = getMySubmission(task.id);
    setSelectedTask(task);
    if (existing) {
      setSubmissionText(existing.submissionText || '');
      setFileName(existing.fileName || '');
      setSubmissionMethod(existing.submissionMethod || 'online');
    } else {
      setSubmissionText('');
      setFileName(`${currentUser.name.replace(/\s+/g, '_')}_${task.title.replace(/\s+/g, '_')}_Doc.pdf`);
      setSubmissionMethod('online');
    }
  };

  const handleSendSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const existing = getMySubmission(selectedTask.id);
    const nowStr = new Date().toLocaleString();

    const subItem: SubmissionItem = {
      id: existing ? existing.id : `sub-${Date.now()}`,
      assignmentId: selectedTask.id,
      assignmentTitle: selectedTask.title,
      teacherId: currentUser.employeeId || currentUser.id,
      teacherName: currentUser.name,
      teacherEmail: currentUser.email,
      teacherDepartment: currentUser.department,
      submittedAt: nowStr,
      submittedDate: new Date().toISOString().split('T')[0],
      submissionText: submissionText.trim(),
      submissionMethod,
      fileName: fileName.trim() || 'Task_Submission_Document.pdf',
      fileUrl: '#',
      evaluationType: selectedTask.evaluationType || (selectedTask.maxPoints ? 'points' : 'accept_reject'),
      status: 'pending',
      score: existing?.score,
      maxScore: selectedTask.maxPoints || selectedTask.totalPoints || 10,
      managerFeedback: existing?.managerFeedback,
      feedback: existing?.feedback
    };

    if (existing && onUpdateSubmission) {
      onUpdateSubmission(subItem);
      showToast('Your submission has been updated and sent to the School Manager.');
    } else {
      onSubmitTask(subItem);
      showToast('Task submitted successfully for School Manager review!');
    }

    setSelectedTask(null);
  };

  const filteredTasks = myTasks.filter(task => {
    const query = search.toLowerCase();
    const matchesSearch = 
      (task.title || '').toLowerCase().includes(query) ||
      (task.description || '').toLowerCase().includes(query) ||
      (task.subject || '').toLowerCase().includes(query);

    const sub = getMySubmission(task.id);
    const isCompleted = sub && (sub.status === 'accepted' || sub.status === 'graded');

    if (filterStatus === 'pending') {
      return matchesSearch && !isCompleted;
    }
    if (filterStatus === 'completed') {
      return matchesSearch && isCompleted;
    }
    return matchesSearch;
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Academic Workflows & Duties</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            My Tasks & Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tasks, administrative duties, and lesson deliverables assigned to you by the School Manager.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({myTasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'pending' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pending / Action Needed
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'completed' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Completed / Graded
          </button>
        </div>
      </div>

      {/* Search & Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your assigned tasks by title, category, keywords..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold text-slate-700 block">Faculty Member</span>
            <span className="text-[11px] text-blue-700 font-bold">{currentUser.name} ({currentUser.employeeId})</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold uppercase">
            Active
          </span>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Tasks Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no tasks matching your filter criteria. New assignments posted by the School Manager for you or all faculty will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTasks.map((task) => {
            const submission = getMySubmission(task.id);
            const isAcceptReject = task.evaluationType === 'accept_reject';
            const maxPts = task.maxPoints || task.totalPoints || 10;

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                          {task.targetTeacherType === 'all' || !task.targetTeacherId || task.targetTeacherId === 'all' 
                            ? 'All Teachers Task' 
                            : `Assigned: ${task.targetTeacherName || task.targetTeacherId}`}
                        </span>
                        {task.subject && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {task.subject}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 mt-2">{task.title}</h3>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAcceptReject ? (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/60 block">
                          Accept / Reject
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 block font-mono">
                          {maxPts} Points
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task Instructions */}
                  {task.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {task.description}
                    </p>
                  )}

                  {/* Due Date & Meta */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Due: <strong className="text-slate-800">{task.dueDate}</strong></span>
                    </div>
                    {task.postedDate && (
                      <span className="text-[10px] text-slate-400">Posted: {task.postedDate}</span>
                    )}
                  </div>

                  {/* Submission Status Box */}
                  <div className="p-3.5 rounded-2xl border transition-all text-xs">
                    {!submission ? (
                      <div className="flex items-center justify-between text-amber-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-bold">Not yet submitted</span>
                        </div>
                        <span className="text-[10px] font-medium text-amber-600">Awaiting your response</span>
                      </div>
                    ) : submission.status === 'accepted' ? (
                      <div className="space-y-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between text-emerald-800">
                          <div className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
                            <span className="font-black">Submission Accepted by Manager</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                            APPROVED
                          </span>
                        </div>
                        {submission.managerFeedback && (
                          <div className="text-[11px] text-emerald-900 bg-white/80 p-2 rounded-lg border border-emerald-100">
                            <strong>Manager Note:</strong> {submission.managerFeedback}
                          </div>
                        )}
                      </div>
                    ) : submission.status === 'rejected' ? (
                      <div className="space-y-2 bg-rose-50/80 p-2.5 rounded-xl border border-rose-200">
                        <div className="flex items-center justify-between text-rose-800">
                          <div className="flex items-center space-x-2">
                            <X className="w-4 h-4 text-rose-600 bg-rose-100 rounded-full p-0.5" />
                            <span className="font-black">Submission Rejected</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                            NEEDS REVISION
                          </span>
                        </div>
                        {submission.managerFeedback && (
                          <div className="text-[11px] text-rose-900 bg-white/80 p-2 rounded-lg border border-rose-100">
                            <strong>Manager Feedback:</strong> {submission.managerFeedback}
                          </div>
                        )}
                      </div>
                    ) : submission.status === 'graded' ? (
                      <div className="space-y-2 bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between text-blue-900">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                            <span className="font-black">Graded: {submission.score} / {submission.maxScore || maxPts} Points</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-mono">
                            {Math.round(((submission.score || 0) / (submission.maxScore || maxPts)) * 100)}%
                          </span>
                        </div>
                        {submission.managerFeedback && (
                          <div className="text-[11px] text-blue-900 bg-white/80 p-2 rounded-lg border border-blue-100">
                            <strong>Manager Review:</strong> {submission.managerFeedback}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-blue-800 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/60">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="font-bold">Submitted ({submission.submittedAt || 'Pending Review'})</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Under Review
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {submission ? `Turned in: ${submission.submissionMethod === 'in_person' ? 'Office Visit' : 'Online Document'}` : 'Online / School Office'}
                  </span>

                  <button
                    onClick={() => handleOpenSubmitModal(task)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submission ? 'Update / Resubmit' : 'Submit Assignment'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMISSION MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Faculty Task Submission</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedTask.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluation: <strong>{selectedTask.evaluationType === 'accept_reject' ? 'Accept / Reject by Manager' : `${selectedTask.maxPoints || 10} Points Scoring`}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedTask(null)} 
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendSubmission} className="space-y-4 text-xs">
              {/* Submission Mode Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Submission Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmissionMethod('online')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      submissionMethod === 'online'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-blue-600 mb-1" />
                    <div className="text-xs font-bold">Online Portal Upload</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Upload file & type response</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmissionMethod('in_person')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      submissionMethod === 'in_person'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold ring-1 ring-purple-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-4 h-4 text-purple-600 mb-1" />
                    <div className="text-xs font-bold">School Manager Office</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">In-person physical delivery</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Submission Notes & Deliverable Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Describe your completed work, attach reference links, or summarize syllabus deliverables for the School Manager..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attached Document / File Name</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Science_Curriculum_Deliverable.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="px-3 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 shrink-0">
                    PDF / DOCX
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-2 text-[11px] text-blue-800">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Once submitted, the School Manager will review your work and evaluate it via 
                  <strong> {selectedTask.evaluationType === 'accept_reject' ? 'Accept / Reject verdict' : `${selectedTask.maxPoints || 10} point scoring`}</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Manager</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
