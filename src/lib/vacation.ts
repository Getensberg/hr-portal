import { parseRuDate } from "./date";

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

export function countWorkingDays(start: Date, end: Date, holidayDates: Set<string>): number {
  let count = 0;
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const key = new Date(t).toISOString().slice(0, 10);
    if (!holidayDates.has(key)) count++;
  }
  return count;
}

export function daysInYearExcludingHolidays(
  start: Date,
  end: Date,
  year: number,
  holidayDates: Set<string>
): number {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const s = start.getTime() > yearStart.getTime() ? start : yearStart;
  const e = end.getTime() < yearEnd.getTime() ? end : yearEnd;
  if (s.getTime() > e.getTime()) return 0;
  return countWorkingDays(s, e, holidayDates);
}

export function formatRu(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", { timeZone: "UTC" });
}

export interface ParsedHoliday {
  date: string;
  name: string;
}

// Строки вида "01.01.2027 - Новый год" или "01.01.2027-08.01.2027 Новогодние каникулы"
export function parseHolidayLines(text: string): { items: ParsedHoliday[]; errors: string[] } {
  const items = new Map<string, string>();
  const errors: string[] = [];

  text.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const rangeMatch = line.match(/^(\d{2}\.\d{2}\.\d{4})\s*[-–—]\s*(\d{2}\.\d{2}\.\d{4})\s*[-–—:]?\s*(.*)$/);
    const singleMatch = line.match(/^(\d{2}\.\d{2}\.\d{4})\s*[-–—:]?\s*(.*)$/);

    let startStr = "";
    let endStr = "";
    let name = "";
    if (rangeMatch) {
      startStr = rangeMatch[1];
      endStr = rangeMatch[2];
      name = rangeMatch[3];
    } else if (singleMatch) {
      startStr = singleMatch[1];
      endStr = singleMatch[1];
      name = singleMatch[2];
    } else {
      errors.push(`Строка ${index + 1}: не удалось разобрать «${line}»`);
      return;
    }

    const startISO = parseRuDate(startStr);
    const endISO = parseRuDate(endStr);
    const start = startISO ? parseISODate(startISO) : null;
    const end = endISO ? parseISODate(endISO) : null;

    if (!start || !end || start.getTime() > end.getTime()) {
      errors.push(`Строка ${index + 1}: некорректная дата в «${line}»`);
      return;
    }
    if (countDays(start, end) > 60) {
      errors.push(`Строка ${index + 1}: слишком длинный период, максимум 60 дней`);
      return;
    }

    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      items.set(new Date(t).toISOString().slice(0, 10), name.trim() || "Нерабочий день");
    }
  });

  return {
    items: Array.from(items.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, name]) => ({ date, name })),
    errors,
  };
}

export const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
export const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// Понедельник = 0, воскресенье = 6
export function weekdayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

// Ключ дня вида "2026-09-10". month от 0 до 11
export function dayKey(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function todayKey(): string {
  const d = new Date();
  return dayKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// Переход на соседний месяц с учётом смены года
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  const y = Math.floor(total / 12);
  return { year: y, month: total - y * 12 };
}

// Разворачивает периоды в карту "день -> период" только для одного месяца
export function expandToDayMap<T extends { startDate: string; endDate: string }>(
  items: T[],
  year: number,
  month: number
): Map<string, T> {
  const windowStart = Date.UTC(year, month, 1);
  const windowEnd = Date.UTC(year, month, daysInMonth(year, month));
  const map = new Map<string, T>();

  for (const item of items) {
    const from = Math.max(new Date(item.startDate).getTime(), windowStart);
    const to = Math.min(new Date(item.endDate).getTime(), windowEnd);
    for (let t = from; t <= to; t += DAY_MS) {
      const key = new Date(t).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, item);
    }
  }
  return map;
}
