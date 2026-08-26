import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Users,
  Download,
  Upload,
  UserCheck,
  Check,
  X,
  Star,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { AssignmentItem, ClassItem, TeacherUser } from '../types';
import { exportToCSV, exportToJSON, parseCSV } from '../lib/csvExportImport';

interface AssignmentsViewProps {
  currentUser?: TeacherUser;
  assignments: AssignmentItem[];
  classes: ClassItem[];
  teachers?: TeacherUser[];
  onSaveAssignments: (assignments: AssignmentItem[]) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  currentUser,
  assignments,
  classes,
  teachers = [],
  onSaveAssignments
}) => {
  const isManager = currentUser?.role === 'manager';
  const [search, setSearch] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Form State for Creating Assignment / Task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('General Curriculum');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [customTeacherInput, setCustomTeacherInput] = useState('All');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [evaluationType, setEvaluationType] = useState<'accept_reject' | 'points'>('accept_reject');
  const [maxPoints, setMaxPoints] = useState<number>(10);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setDescription('');
    setSubject('General Curriculum');
    setTargetType('all');
    setCustomTeacherInput('All');
    setSelectedTeacherId('all');
    setEvaluationType('accept_reject');
    setMaxPoints(10);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDueDate(d.toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetTeacherName = 'All Teachers';
    let targetTeacherId = 'All';

    if (targetType === 'specific') {
      if (selectedTeacherId && selectedTeacherId !== 'custom') {
        const found = teachers.find(t => t.employeeId === selectedTeacherId || t.id === selectedTeacherId);
        if (found) {
          targetTeacherName = found.name;
          targetTeacherId = found.employeeId || found.id;
        } else {
          targetTeacherName = customTeacherInput.trim() || 'Specific Teacher';
          targetTeacherId = customTeacherInput.trim() || 'TCH-SPECIFIC';
        }
      } else {
        targetTeacherName = customTeacherInput.trim() || 'Specific Teacher';
        targetTeacherId = customTeacherInput.trim() || 'TCH-SPECIFIC';
      }
    }

    const newAssignment: AssignmentItem = {
      id: `asg-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      dueDate,
      postedDate: new Date().toISOString().split('T')[0],
      targetTeacherType: targetType,
      targetTeacherId,
      targetTeacherName,
      evaluationType,
      maxPoints: evaluationType === 'points' ? Number(maxPoints) || 10 : undefined,
      totalPoints: evaluationType === 'points' ? Number(maxPoints) || 10 : undefined,
      submissionsCount: 0,
      totalStudents: targetType === 'all' ? (teachers.length || 15) : 1,
      status: 'active',
      createdBy: currentUser?.name || 'Academic Manager'
    };

    onSaveAssignments([newAssignment, ...assignments]);
    setIsModalOpen(false);
    showToast(`Posted task for ${targetTeacherName}: "${newAssignment.title}"`);
  };

  const handleDelete = (id: string) => {
    if (!isManager) {
      showToast('Permission Denied: Only Academic Manager can erase tasks.');
      return;
    }
    if (!confirm('Are you sure you want to remove this task?')) return;
    onSaveAssignments(assignments.filter(a => a.id !== id));
    showToast('Task removed.');
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(assignments, `academic_tasks_assignments_${new Date().toISOString().split('T')[0]}`, [
      { key: 'id', label: 'Task ID' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'subject', label: 'Subject/Category' },
      { key: 'targetTeacherType', label: 'Target Type' },
      { key: 'targetTeacherId', label: 'Target Teacher ID' },
      { key: 'targetTeacherName', label: 'Target Teacher Name' },
      { key: 'evaluationType', label: 'Evaluation Type' },
      { key: 'maxPoints', label: 'Max Points' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' }
    ]);
    showToast('Assignments exported to CSV.');
  };

  const handleExportJSON = () => {
    exportToJSON(assignments, `academic_tasks_assignments_${new Date().toISOString().split('T')[0]}`);
    showToast('Assignments exported to JSON.');
  };

  // Import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let importedList: AssignmentItem[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          importedList = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const rows = parseCSV(text);
          importedList = rows.map((r, i) => ({
            id: r['Task ID'] || r['id'] || `asg-imp-${Date.now()}-${i}`,
            title: r['Title'] || r['title'] || 'Imported Task',
            description: r['Description'] || r['description'] || '',
            subject: r['Subject/Category'] || r['subject'] || 'General',
            targetTeacherType: (r['Target Type'] === 'specific' || r['targetTeacherType'] === 'specific') ? 'specific' : 'all',
            targetTeacherId: r['Target Teacher ID'] || r['targetTeacherId'] || 'All',
            targetTeacherName: r['Target Teacher Name'] || r['targetTeacherName'] || 'All Teachers',
            evaluationType: (r['Evaluation Type'] === 'points' || r['evaluationType'] === 'points') ? 'points' : 'accept_reject',
            maxPoints: Number(r['Max Points'] || r['maxPoints']) || 10,
            dueDate: r['Due Date'] || r['dueDate'] || new Date().toISOString().split('T')[0],
            status: r['Status'] || r['status'] || 'active',
            postedDate: new Date().toISOString().split('T')[0],
            createdBy: currentUser?.name || 'Academic Manager'
          }));
        }

        if (importedList.length > 0) {
          onSaveAssignments([...importedList, ...assignments]);
          showToast(`Successfully imported ${importedList.length} tasks!`);
          setIsImportModalOpen(false);
        } else {
          alert('Could not find any valid task records in file.');
        }
      } catch (err) {
        alert('Failed to parse import file. Please check format.');
      }
    };
    reader.readAsText(file);
  };

  const query = (search || '').toLowerCase();
  const filtered = assignments.filter(a => {
    if (!a) return false;
    const matchesQuery = 
      (a.title || '').toLowerCase().includes(query) ||
      (a.description || '').toLowerCase().includes(query) ||
      (a.targetTeacherName || '').toLowerCase().includes(query) ||
      (a.targetTeacherId || '').toLowerCase().includes(query) ||
      (a.subject || '').toLowerCase().includes(query);

    const matchesTeacher = 
      filterTeacher === 'all' || 
      (filterTeacher === 'all_teachers' && (a.targetTeacherType === 'all' || a.targetTeacherId === 'All')) ||
      (filterTeacher === 'specific' && a.targetTeacherType === 'specific') ||
      a.targetTeacherId === filterTeacher ||
      a.targetTeacherName === filterTeacher;

    return matchesQuery && matchesTeacher;
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
            <span>Faculty Assignments & Tasks Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Assignments & Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign duties, curriculum deliverables, and lesson tasks to All Teachers or Specific Teachers with Accept/Reject or Points scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown / Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Import tasks from file"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Task / Assignment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, instructions, target teacher name or ID..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter:</span>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Assignments ({assignments.length})</option>
            <option value="all_teachers">Broadcasted to All Teachers</option>
            <option value="specific">Assigned to Specific Teachers</option>
            {teachers.map(t => (
              <option key={t.id} value={t.employeeId || t.name}>
                {t.name} ({t.employeeId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Tasks Posted</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Post Task / Assignment" to broadcast a deliverable to all faculty or assign a specific teacher.
            </p>
          </div>
        ) : (
          filtered.map((asg) => {
            const isAcceptReject = asg.evaluationType === 'accept_reject';
            const isAll = asg.targetTeacherType === 'all' || asg.targetTeacherId === 'All' || asg.targetTeacherName === 'All Teachers';

            return (
              <div
                key={asg.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isAll 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    }`}>
                      {isAll ? '📢 All Teachers' : `👤 ${asg.targetTeacherName || asg.targetTeacherId}`}
                    </span>

                    {isAcceptReject ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/60 flex items-center gap-1">
                        <Check className="w-3 h-3 text-purple-600" />
                        <span>Accept / Reject</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 flex items-center gap-1 font-mono">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{asg.maxPoints || asg.totalPoints || 10} Points</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">{asg.title}</h3>
                    {asg.subject && (
                      <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                        Category: {asg.subject}
                      </span>
                    )}
                  </div>

                  {/* Instructions */}
                  {asg.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
                      {asg.description}
                    </p>
                  )}

                  {/* Meta details */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-600">
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
                        <span>Recipient</span>
                      </span>
                      <span className="font-bold text-slate-700 truncate max-w-[140px]">
                        {isAll ? 'All Registered Teachers' : (asg.targetTeacherName || asg.targetTeacherId)}
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      title="Manager: Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Manager Task Composer</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Post Task or Assignment to Teachers</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task / Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Term 1 Lesson Plans & Syllabus Submission"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide explicit instructions for the faculty deliverable..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* TARGET TEACHER SELECTION */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block font-bold text-slate-800">
                  Assign To (Teacher Name or ID) *
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('all');
                      setCustomTeacherInput('All');
                      setSelectedTeacherId('all');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      targetType === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📢 All Teachers
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('specific');
                      setSelectedTeacherId(teachers[0]?.employeeId || 'custom');
                      setCustomTeacherInput(teachers[0]?.name || '');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      targetType === 'specific'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    👤 Specific Teacher
                  </button>
                </div>

                {targetType === 'specific' && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-bold text-slate-600">Select Teacher from List or Type ID/Name:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => {
                          setSelectedTeacherId(e.target.value);
                          if (e.target.value !== 'custom') {
                            const found = teachers.find(t => t.employeeId === e.target.value || t.id === e.target.value);
                            if (found) setCustomTeacherInput(found.name);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {teachers.map(t => (
                          <option key={t.id} value={t.employeeId || t.id}>
                            {t.name} ({t.employeeId})
                          </option>
                        ))}
                        <option value="custom">-- Custom Name / ID --</option>
                      </select>

                      <input
                        type="text"
                        value={customTeacherInput}
                        onChange={(e) => {
                          setCustomTeacherInput(e.target.value);
                          setSelectedTeacherId('custom');
                        }}
                        placeholder="Type Teacher Name or ID (e.g. Samuel Asfaw)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* EVALUATION / GRADING TYPE */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block font-bold text-slate-800">
                  Evaluation & Scoring Mode *
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluationType('accept_reject')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      evaluationType === 'accept_reject'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept / Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvaluationType('points')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      evaluationType === 'points'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Points Based</span>
                  </button>
                </div>

                {evaluationType === 'points' ? (
                  <div className="pt-1 flex items-center space-x-3">
                    <label className="font-bold text-slate-700 text-xs">Max Points (e.g. 10 Pts):</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        required
                        value={maxPoints}
                        onChange={(e) => setMaxPoints(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex space-x-1">
                        {[10, 20, 50, 100].map(pt => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => setMaxPoints(pt)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
                          >
                            {pt}p
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-purple-800 font-medium">
                    When teachers submit their deliverable online or visit the School Manager's office, you can mark it as <strong>Accepted ✅</strong> or <strong>Rejected ❌</strong>.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category / Department</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Science & STEM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Task</span>
                </button>
              </div>
            </form>
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
                <h3 className="text-base font-bold text-slate-900">Import Assignments & Tasks</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Upload a <strong>.csv</strong> or <strong>.json</strong> file containing assignments data to import tasks into the system.
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
