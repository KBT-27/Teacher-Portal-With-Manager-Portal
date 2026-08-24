import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Users
} from 'lucide-react';
import { AssignmentItem, ClassItem, TeacherUser } from '../types';

interface AssignmentsViewProps {
  currentUser?: TeacherUser;
  assignments: AssignmentItem[];
  classes: ClassItem[];
  onSaveAssignments: (assignments: AssignmentItem[]) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  currentUser,
  assignments,
  classes,
  onSaveAssignments
}) => {
  const isManager = currentUser?.role === 'manager';
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [className, setClassName] = useState(classes[0]?.name || 'Mathematics Grade 10');
  const [dueDate, setDueDate] = useState('2026-08-28');
  const [totalPoints, setTotalPoints] = useState(100);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAssignment: AssignmentItem = {
      id: `asg-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      className: className.trim(),
      subject: 'Mathematics',
      dueDate,
      totalPoints: Number(totalPoints) || 100,
      submissionsCount: 0,
      totalStudents: 28,
      status: 'active'
    };

    onSaveAssignments([newAssignment, ...assignments]);
    setTitle('');
    setDescription('');
    setIsModalOpen(false);
    showToast(`Created assignment: ${newAssignment.title}`);
  };

  const handleDelete = (id: string) => {
    if (!isManager) {
      showToast('Permission Denied: Teachers and QR Code Mentors cannot erase assignments.');
      return;
    }
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    onSaveAssignments(assignments.filter(a => a.id !== id));
    showToast('Assignment removed.');
  };

  const query = (search || '').toLowerCase();
  const filtered = assignments.filter(a => {
    if (!a) return false;
    return (a.title || '').toLowerCase().includes(query) ||
           (a.className || '').toLowerCase().includes(query) ||
           (a.subject || '').toLowerCase().includes(query);
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
            <FileText className="w-4 h-4" />
            <span>Coursework & Homework</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Assignments & Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create tasks, set due dates, collect submissions, and track student completion.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assignments by title, class, subject..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((asg) => (
          <div
            key={asg.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  {asg.className}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">
                  {asg.totalPoints || 100} Pts
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 mt-3">{asg.title}</h3>
              {asg.description && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{asg.description}</p>
              )}

              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Due Date</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">{asg.dueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>Submissions</span>
                  </span>
                  <span className="font-bold text-emerald-600">
                    {asg.submissionsCount || 0} / {asg.totalStudents || 28} Turn-ins
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                asg.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {asg.status || 'Active'}
              </span>
              {isManager && (
                <button
                  onClick={() => handleDelete(asg.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                  title="Manager: Erase Assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Assignment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Calculus Problem Set #4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Points</label>
                  <input
                    type="number"
                    required
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter problem set details..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Post Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
