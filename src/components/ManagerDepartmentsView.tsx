import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2,
  BookOpen,
  X
} from 'lucide-react';
import { Department } from '../types';

interface ManagerDepartmentsViewProps {
  departments: Department[];
  onSaveDepartments: (departments: Department[]) => void;
}

export const ManagerDepartmentsView: React.FC<ManagerDepartmentsViewProps> = ({
  departments,
  onSaveDepartments
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [headTeacher, setHeadTeacher] = useState('Elena Vance');
  const [description, setDescription] = useState('');
  const [subjectsText, setSubjectsText] = useState('Core Course, Elective');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setName('');
    setHeadTeacher('Elena Vance');
    setDescription('');
    setSubjectsText('General Studies, Core Course');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setHeadTeacher(dept.headTeacher || dept.headOfDepartment || '');
    setDescription(dept.description || '');
    setSubjectsText(dept.subjects ? dept.subjects.join(', ') : (dept.subjectList ? dept.subjectList.join(', ') : ''));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedSubjects = subjectsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingDept) {
      const updated = departments.map(d => {
        if (d.id === editingDept.id) {
          return {
            ...d,
            name: name.trim(),
            headTeacher: headTeacher.trim(),
            description: description.trim(),
            subjects: parsedSubjects.length > 0 ? parsedSubjects : ['General Studies']
          };
        }
        return d;
      });
      onSaveDepartments(updated);
      showToast(`Updated department ${name}.`);
    } else {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: name.trim(),
        headTeacher: headTeacher.trim(),
        teacherCount: 4,
        subjects: parsedSubjects.length > 0 ? parsedSubjects : ['General Studies'],
        description: description.trim()
      };
      onSaveDepartments([...departments, newDept]);
      showToast(`Added new department ${name}.`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteSubject = (deptId: string, subjectToDelete: string) => {
    const updated = departments.map(d => {
      if (d.id === deptId) {
        const remainingSubjects = (d.subjects || []).filter(s => s !== subjectToDelete);
        return {
          ...d,
          subjects: remainingSubjects.length > 0 ? remainingSubjects : ['General Studies']
        };
      }
      return d;
    });
    onSaveDepartments(updated);
    showToast(`Removed subject "${subjectToDelete}".`);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to remove this academic department and its subjects?')) {
      return;
    }
    onSaveDepartments(departments.filter(d => d.id !== id));
    showToast('Department removed.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
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
            <Building2 className="w-4 h-4" />
            <span>Academic Structure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Department & Subject Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize faculty division heads, subject specializations, and departmental curricula.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          id="add-department-btn"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const subjects = dept.subjects || (dept.subjectList ? dept.subjectList : ['General']);
          return (
            <div
              key={dept.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {dept.teacherCount || 0} Faculty Members
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-3">{dept.name}</h3>
                {dept.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{dept.description}</p>
                )}
                
                <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Department Head</span>
                    <span className="font-bold text-slate-800">{dept.headTeacher || dept.headOfDepartment || 'Unassigned'}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-500" />
                        <span>Subjects & Curricula</span>
                      </span>
                      <span className="text-[10px] text-slate-400">({subjects.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.map((subj, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                        >
                          <span>{subj}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(dept.id, subj)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-xs transition-colors cursor-pointer"
                            title={`Delete subject ${subj}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Department</span>
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  title="Delete Department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingDept ? 'Edit Academic Department' : 'Create Department'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Science & Physics"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Head Teacher / Chair</label>
                <input
                  type="text"
                  required
                  value={headTeacher}
                  onChange={(e) => setHeadTeacher(e.target.value)}
                  placeholder="e.g. Dr. Robert Martinez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={subjectsText}
                  onChange={(e) => setSubjectsText(e.target.value)}
                  placeholder="e.g. Physics, Chemistry, Biology, Lab Science"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separate individual subjects with commas to enable individual subject management.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Focus</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter department scope, labs, and objectives..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
