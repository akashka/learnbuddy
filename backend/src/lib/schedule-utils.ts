/**
 * Utilities for generating ClassSessions from enrollment slots.
 * Slots: { day: 'Mon'|'Tue'|..., startTime: '14:00', endTime: '15:00' }
 */

const DAY_TO_JS: Record<string, number> = {
  Sun: 0, Sunday: 0,
  Mon: 1, Monday: 1,
  Tue: 2, Tuesday: 2,
  Wed: 3, Wednesday: 3,
  Thu: 4, Thursday: 4,
  Fri: 5, Friday: 5,
  Sat: 6, Saturday: 6,
};

export interface Slot {
  day: string;
  startTime: string;
  endTime: string;
}

/** Parse "14:00" or "2:00 PM" to minutes since midnight */
function parseTimeToMinutes(timeStr: string): number {
  const t = String(timeStr).trim();
  const match12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const ampm = match12[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const match24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    return h * 60 + m;
  }
  return 60; // default 1:00
}

/** Get duration in minutes from slot */
export function getSlotDurationMinutes(slot: Slot): number {
  const start = parseTimeToMinutes(slot.startTime);
  const end = parseTimeToMinutes(slot.endTime);
  return Math.max(30, end - start);
}

/** Get JS day number (0=Sun, 1=Mon, ...) from slot day string */
export function getSlotDayNumber(dayStr: string): number {
  const key = String(dayStr).trim().slice(0, 3);
  return DAY_TO_JS[key] ?? DAY_TO_JS[dayStr] ?? 1;
}

/** Generate dates for a slot within [fromDate, toDate] */
export function getDatesForSlot(slot: Slot, fromDate: Date, toDate: Date): Date[] {
  const targetDay = getSlotDayNumber(slot.day);
  const parsed = parseTimeToMinutes(slot.startTime);
  const hours = Math.floor(parsed / 60);
  const mins = parsed % 60;

  const dates: Date[] = [];
  const cur = new Date(fromDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    if (cur.getDay() === targetDay) {
      const d = new Date(cur);
      d.setHours(hours, mins, 0, 0);
      dates.push(d);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
