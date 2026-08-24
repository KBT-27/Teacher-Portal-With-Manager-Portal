import { useState, useEffect } from 'react';

/**
 * Automatically computes the current academic year based on date.
 */
export function getAutoAcademicYear(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11 (7 is August)
  if (month >= 7) {
    return `${year}/${year + 1} Academic Year`;
  }
  return `${year - 1}/${year} Academic Year`;
}

/**
 * Automatically calculates current active Semester based on month
 */
export function getAutoSemester(d: Date = new Date()): string {
  const month = d.getMonth(); // 0-11
  if (month >= 7 && month <= 11) {
    return 'First Semester';
  } else if (month >= 0 && month <= 4) {
    return 'Second Semester';
  }
  return 'Summer Term';
}

/**
 * Formats current date string in standard format: "Friday, August 21, 2026"
 */
export function getAutoFormattedDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats standard ISO-like date string "YYYY-MM-DD"
 */
export function getAutoDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats time string: "08:30 AM" or current live time
 */
export function getAutoFormattedTime(d: Date = new Date()): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats full timestamp: "Aug 21, 2026 at 08:30 AM"
 */
export function getAutoFullTimestamp(d: Date = new Date()): string {
  const datePart = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${datePart} at ${timePart}`;
}

/**
 * Real-time hook that ticks every second for live clocks & timestamps
 */
export function useRealTimeClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    now,
    timeFormatted: getAutoFormattedTime(now),
    dateFormatted: getAutoFormattedDate(now),
    dateString: getAutoDateString(now),
    academicYear: getAutoAcademicYear(now),
    semester: getAutoSemester(now),
    fullTimestamp: getAutoFullTimestamp(now)
  };
}
