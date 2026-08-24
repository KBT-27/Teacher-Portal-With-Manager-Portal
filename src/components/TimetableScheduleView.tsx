import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { TimetableSlot, TeacherUser } from '../types';

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
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const slotsForDay = timetable.filter(s => s.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
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

        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDay === day ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Timeline Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900">{selectedDay} Classes</h3>
          <span className="text-xs font-bold text-slate-500">{slotsForDay.length} Periods Scheduled</span>
        </div>

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
      </div>
    </div>
  );
};
