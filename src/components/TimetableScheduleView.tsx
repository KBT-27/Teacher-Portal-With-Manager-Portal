import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Download,
  Upload,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { TimetableSlot, TeacherUser } from '../types';
import { exportToCSV, exportToJSON, parseCSV } from '../lib/csvExportImport';

interface TimetableScheduleViewProps {
  currentUser: TeacherUser;
  timetable: TimetableSlot[];
  onSaveTimetable?: (slots: TimetableSlot[]) => void;
}

export const TimetableScheduleView: React.FC<TimetableScheduleViewProps> = ({
  currentUser,
  timetable,
  onSaveTimetable
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportCSV = () => {
    exportToCSV(timetable, `weekly_teaching_schedule_${new Date().toISOString().split('T')[0]}`, [
      { key: 'id', label: 'Slot ID' },
      { key: 'dayOfWeek', label: 'Day' },
      { key: 'period', label: 'Period' },
      { key: 'subject', label: 'Subject' },
      { key: 'grade', label: 'Grade' },
      { key: 'section', label: 'Section' },
      { key: 'room', label: 'Room' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
      { key: 'teacherName', label: 'Teacher' }
    ]);
    showToast('Schedule exported to CSV.');
  };

  const handleExportJSON = () => {
    exportToJSON(timetable, `weekly_teaching_schedule_${new Date().toISOString().split('T')[0]}`);
    showToast('Schedule exported to JSON.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let importedList: TimetableSlot[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          importedList = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const rows = parseCSV(text);
          importedList = rows.map((r, i) => ({
            id: r['Slot ID'] || r['id'] || `slot-imp-${Date.now()}-${i}`,
            dayOfWeek: r['Day'] || r['dayOfWeek'] || 'Monday',
            period: Number(r['Period'] || r['period']) || (i % 6 + 1),
            subject: r['Subject'] || r['subject'] || currentUser.subject || 'Academic Lesson',
            grade: r['Grade'] || r['grade'] || 'Grade 10',
            section: r['Section'] || r['section'] || 'A',
            room: r['Room'] || r['room'] || 'Room 101',
            startTime: r['Start Time'] || r['startTime'] || '08:30 AM',
            endTime: r['End Time'] || r['endTime'] || '09:45 AM',
            teacherId: currentUser.employeeId || currentUser.id,
            teacherName: r['Teacher'] || r['teacherName'] || currentUser.name
          }));
        }

        if (importedList.length > 0 && onSaveTimetable) {
          onSaveTimetable([...timetable, ...importedList]);
          showToast(`Successfully imported ${importedList.length} schedule periods!`);
          setIsImportModalOpen(false);
        }
      } catch (err) {
        alert('Failed to parse file. Please verify CSV or JSON structure.');
      }
    };
    reader.readAsText(file);
  };

  const slotsForDay = timetable.filter(s => s.dayOfWeek === selectedDay);

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
            <Calendar className="w-4 h-4" />
            <span>Academic Timetable</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Weekly Teaching Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Period timings, lab assignments, and assigned classroom locations.
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
            title="Import Schedule"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Days Selector */}
      <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDay === day ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Timeline Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900">{selectedDay} Schedule</h3>
          <span className="text-xs font-bold text-slate-500">{slotsForDay.length} Periods</span>
        </div>

        {slotsForDay.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No periods scheduled for {selectedDay}.
          </div>
        ) : (
          <div className="space-y-3">
            {slotsForDay.map((slot, index) => (
              <div
                key={slot.id || index}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
                    P{slot.period || index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{slot.subject}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {slot.grade} - {slot.section}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1.5 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{slot.room}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-bold text-slate-700">{slot.startTime} - {slot.endTime}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                    {slot.teacherName || currentUser.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Import Weekly Schedule</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Upload a <strong>.csv</strong> or <strong>.json</strong> file containing timetable slots to import schedule.
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
