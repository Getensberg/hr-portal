"use client";
import type { VacationEntryItem, HolidayItem, BlockedPeriodItem } from "@/store/api";
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  daysInMonth,
  weekdayIndex,
  shiftMonth,
  dayKey,
  expandToDayMap,
} from "@/lib/vacation";
import { useToday } from "@/lib/useToday";
import { colors, entryClass } from "./calendarStyles";
import { CalendarLegend } from "./CalendarLegend";
import styles from "./MonthGrid.module.css";

const TYPE_LABELS: Record<string, string> = { VACATION: "Отпуск", DAY_OFF: "Отгул" };

interface MonthGridProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  entries: VacationEntryItem[];
  holidays: HolidayItem[];
  blocked: BlockedPeriodItem[];
}

export function MonthGrid({ year, month, onChange, entries, holidays, blocked }: MonthGridProps) {
  const today = useToday();

  const leading = weekdayIndex(new Date(Date.UTC(year, month, 1)));
  const total = daysInMonth(year, month);
  const entryMap = expandToDayMap(entries, year, month);
  const blockedMap = expandToDayMap(blocked, year, month);
  const holidayMap = new Map<string, string>(holidays.map((h) => [h.date.slice(0, 10), h.name]));

  function go(delta: number) {
    const next = shiftMonth(year, month, delta);
    onChange(next.year, next.month);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={() => go(-1)} aria-label="Предыдущий месяц">‹</button>
        <span className={styles.title}>{MONTH_NAMES[month]} {year}</span>
        <button className={styles.navBtn} onClick={() => go(1)} aria-label="Следующий месяц">›</button>
      </div>

      <div className={styles.grid}>
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} className={styles.weekday}>{w}</div>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const key = dayKey(year, month, day);
          const weekday = (leading + i) % 7;
          const entry = entryMap.get(key);
          const holiday = holidayMap.get(key);
          const block = blockedMap.get(key);

          let cls = weekday >= 5 ? colors.weekend : colors.normal;
          if (block) cls = colors.blocked;
          if (holiday) cls = colors.holiday;
          if (entry) cls = entryClass(entry.type, entry.status);

          const hints: string[] = [];
          if (entry) {
            hints.push(`${TYPE_LABELS[entry.type]}, ${entry.status === "CONFIRMED" ? "подтверждено" : "запланировано"}`);
          }
          if (holiday) hints.push(holiday);
          if (block) hints.push(`Не рекомендуется: ${block.reason}`);

          return (
            <div
              key={key}
              className={`${styles.cell} ${cls} ${key === today ? colors.today : ""}`}
              title={hints.join(" · ") || undefined}
            >
              {day}
            </div>
          );
        })}
      </div>

      <CalendarLegend />
    </div>
  );
}