import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Plus, 
  Search, 
  MoreVertical,
  CheckCircle2,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { ClassItem, TeacherUser } from '../types';
import { exportToCSV, exportToJSON, parseCSV } from '../lib/csvExportImport';

interface ClassesViewProps {
  currentUser: TeacherUser;
  classes: ClassItem[];
  onSaveClasses: (classes: ClassItem[]) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  currentUser,
  classes,
  onSaveClasses
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Grade 10');
  const [section, setSection] = useState('A');
  const [room, setRoom] = useState('Room 302');
  const [schedule, setSchedule] = useState('Mon, Wed, Fri 08:30 AM');
  const [studentCount, setStudentCount] = useState(28);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportCSV = () => {
    exportToCSV(classes, `assigned_classes_${new Date().toISOString().split('T')[0]}`, [
      { key: 'id', label: 'Class ID' },
      { key: 'name', label: 'Class Name' },
      { key: 'grade', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'room', label: 'Room' },
      { key: 'subject', label: 'Subject' },
      { key: 'schedule', label: 'Schedule' },
      { key: 'studentCount', label: 'Enrolled Students' }
    ]);
    showToast('Classes exported to CSV.');
  };

  const handleExportJSON = () => {
    exportToJSON(classes, `assigned_classes_${new Date().toISOString().split('T')[0]}`);
    showToast('Classes exported to JSON.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let importedList: ClassItem[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          importedList = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const rows = parseCSV(text);
          importedList = rows.map((r, i) => ({
            id: r['Class ID'] || r['id'] || `cls-imp-${Date.now()}-${i}`,
            name: r['Class Name'] || r['name'] || 'New Section',
            grade: r['Grade'] || r['grade'] || 'Grade 10',
            section: r['Section'] || r['section'] || 'A',
            room: r['Room'] || r['room'] || 'Room 101',
            subject: r['Subject'] || r['subject'] || currentUser.subject || 'Faculty Subject',
            schedule: r['Schedule'] || r['schedule'] || 'Mon, Wed 08:30 AM',
            studentCount: Number(r['Enrolled Students'] || r['studentCount']) || 25,
            teacherId: currentUser.employeeId || currentUser.id,
            teacherName: currentUser.name
          }));
        }

        if (importedList.length > 0) {
          onSaveClasses([...classes, ...importedList]);
          showToast(`Successfully imported ${importedList.length} classes!`);
          setIsImportModalOpen(false);
        }
      } catch (err) {
        alert('Failed to parse file. Please verify CSV or JSON structure.');
      }
    };
    reader.readAsText(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClass: ClassItem = {
      id: `cls-${Date.now()}`,
      name: name.trim(),
      grade: grade.trim(),
      section: section.trim(),
      room: room.trim(),
      schedule: schedule.trim(),
      studentCount: Number(studentCount) || 25,
      subject: currentUser.subject || 'Faculty Subject',
      teacherId: currentUser.employeeId || currentUser.id,
      teacherName: currentUser.name
    };

    onSaveClasses([...classes, newClass]);
    setName('');
    setIsModalOpen(false);
    showToast(`Added new class: ${newClass.name}`);
  };

  const query = (search || '').toLowerCase();
  const filtered = classes.filter(c => {
    if (!c) return false;
    return (c.name || '').toLowerCase().includes(query) ||
           (c.grade || '').toLowerCase().includes(query) ||
           (c.room || '').toLowerCase().includes(query) ||
           (c.subject || '').toLowerCase().includes(query);
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
            <BookOpen className="w-4 h-4" />
            <span>Academic Curriculum</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Assigned Classes & Sections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your class rosters, periods, classrooms, and student groups.
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
            title="Import Classes"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search classes by name, grade, room..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold font-mono">
                  {cls.grade} - Sec {cls.section}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {cls.room}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-3">{cls.name}</h3>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">{cls.subject}</p>

              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>Roster Size:</span>
                  </span>
                  <span className="font-bold text-slate-900">{cls.studentCount || 28} Students</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Meeting Time:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{cls.schedule || 'MWF 09:00 AM'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Teacher: <strong className="text-slate-800">{cls.teacherName || currentUser.name}</strong>
              </span>
              <button
                onClick={() => {
                  onSaveClasses(classes.filter(c => c.id !== cls.id));
                  showToast('Class removed.');
                }}
                className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Class</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AP Calculus BC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade Level</label>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Grade 10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room / Lab</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Room 302"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Count</label>
                  <input
                    type="number"
                    required
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Weekly Schedule</label>
                <input
                  type="text"
                  required
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Mon, Wed, Fri 08:30 AM - 09:45 AM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Create Class
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
                <h3 className="text-base font-bold text-slate-900">Import Classes & Sections</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Upload a <strong>.csv</strong> or <strong>.json</strong> file containing class records to import.
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
