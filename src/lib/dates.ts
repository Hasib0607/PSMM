/** Format a Date as YYYY-MM-DD in local timezone (not UTC). */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return toLocalDateString(new Date());
}

export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toLocalDateString(tomorrow);
}

/** Parse YYYY-MM-DD as local midnight. */
export function parseLocalDate(dateStr: string): Date {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getLocalDayBounds(dateStr: string): { start: Date; end: Date } {
  const start = parseLocalDate(dateStr);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
