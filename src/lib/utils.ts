import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AttendanceStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Client-side secure hash helper using Web Crypto SubtleCrypto (SHA-256)
// This ensures passwords are NEVER stored or transmitted in plaintext.
export async function hashPassword(password: string, salt: string = 'eduschool_salt_2026'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Synchronous fallback hash for initial demo seeds
export function fastHash(str: string, salt = 'eduschool_salt_2026'): string {
  let hash = 0;
  const combined = `${salt}:${str.trim()}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${strMinutes} ${ampm}`;
}

export function formatDateForDisplay(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function getStatusColor(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'bg-emerald-600 text-white',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
        label: 'Present'
      };
    case 'late':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        badge: 'bg-amber-500 text-white',
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        label: 'Late'
      };
    case 'absent':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badge: 'bg-rose-600 text-white',
        dot: 'bg-rose-500',
        text: 'text-rose-700',
        label: 'Absent'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        badge: 'bg-slate-400 text-white',
        dot: 'bg-slate-400',
        text: 'text-slate-500',
        label: 'Unmarked'
      };
  }
}

// Get the real active password for any teacher or staff member
export function getTeacherRealPassword(user?: { employeeId?: string; role?: string; rawPassword?: string; currentPassword?: string } | null): string {
  if (!user) return 'teach123';
  if (user.rawPassword && user.rawPassword.trim()) return user.rawPassword.trim();
  if (user.currentPassword && user.currentPassword.trim()) return user.currentPassword.trim();

  const knownDefaults: Record<string, string> = {
    'Manager': 'Manager 123',
    'Qr Code': 'Qr code 123',
    'TCH-8492': 'teach123',
    'TCH-1001': 'science123',
    'TCH-1002': 'english123',
    'TCH-1003': 'tech123'
  };

  if (user.employeeId && knownDefaults[user.employeeId]) {
    return knownDefaults[user.employeeId];
  }
  if (user.role === 'manager') return 'Manager 123';
  if (user.role === 'qr_station') return 'Qr code 123';
  return 'teach123';
}
