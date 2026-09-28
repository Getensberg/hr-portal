export const VACATION_LIMITS = { VACATION: 28, DAY_OFF: 3 } as const;

const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-09-10" -> Date (полночь UTC). Вернёт null для неверной даты, например 31 февраля
export function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10) === value ? d : null;
}

// Количество календарных дней включительно
export function countDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

// Сколько дней периода попадает в конкретный год (период может переходить через 31 декабря)
export function daysInYear(start: Date, end: Date, year: number): number {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const s = start.getTime() > yearStart.getTime() ? start : yearStart;
  const e = end.getTime() < yearEnd.getTime() ? end : yearEnd;
  if (s.getTime() > e.getTime()) return 0;
  return countDays(s, e);
}

export function formatRu(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", { timeZone: "UTC" });
}