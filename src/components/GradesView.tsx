import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Download, 
  TrendingUp, 
  CheckCircle2,
  Filter
} from 'lucide-react';
import { StudentItem, ClassItem } from '../types';

interface GradesViewProps {
  students: StudentItem[];
  classes: ClassItem[];
}

export const GradesView: React.FC<GradesViewProps> = ({
  students,
  classes
}) => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = 'Student ID,Student Name,Class,Attendance %,Overall Grade\n';
    const rows = students.map(s => `"${s.studentId}","${s.name}","${s.className}","${s.attendanceRate || 98}%","${s.averageGrade || 'A'}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gradebook_summary.csv';
    a.click();
    showToast('Exported gradebook to CSV.');
  };

  const query = (search || '').toLowerCase();
  const filtered = students.filter(s => {
    if (!s) return false;
    const matchSearch = (s.name || '').toLowerCase().includes(query) ||
                        (s.studentId || '').toLowerCase().includes(query);
    const matchClass = selectedClass === 'All' || s.className === selectedClass;
    return matchSearch && matchClass;
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
            <Award className="w-4 h-4" />
            <span>Academic Performance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Gradebook & Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Student marks, term averages, attendance correlation, and performance percentiles.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Gradebook CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student grade records..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedClass('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              selectedClass === 'All' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Classes
          </button>
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedClass === c.name ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-5">Class Section</th>
                <th className="py-3.5 px-5">Attendance Rate</th>
                <th className="py-3.5 px-5">Exam 1 (30%)</th>
                <th className="py-3.5 px-5">Homework (30%)</th>
                <th className="py-3.5 px-5 text-right">Term Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5">
                    <p className="font-bold text-slate-900">{st.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{st.studentId}</p>
                  </td>
                  <td className="py-3.5 px-5 text-slate-700 font-medium">
                    {st.className}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-bold text-emerald-600">{st.attendanceRate || 98}%</span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-700">92 / 100</td>
                  <td className="py-3.5 px-5 font-mono text-slate-700">96 / 100</td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                      {st.averageGrade || 'A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
