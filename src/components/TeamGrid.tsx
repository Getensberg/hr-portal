"use client";
import { Fragment, useState } from "react";
import type { AdminVacationItem, BlockedPeriodItem, HolidayItem, UserOption } from "@/store/api";
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  daysInMonth,
  weekdayIndex,
  shiftMonth,
  dayKey,
  expandToDayMap,
  formatRu,
} from "@/lib/vacation";
import { useToday } from "@/lib/useToday";
import { colors, entryClass } from "./calendarStyles";
import { CalendarLegend } from "./CalendarLegend";
import styles from "./TeamGrid.module.css";

const TYPE_LABELS: Record<string, string> = { VACATION: "Отпуск", DAY_OFF: "Отгул" };

interface TeamGridProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  users: UserOption[];
  entries: AdminVacationItem[];
  holidays: HolidayItem[];
  blocked: BlockedPeriodItem[];
}

export function TeamGrid({ year, month, onChange, users, entries, holidays, blocked }: TeamGridProps) {
  const today = useToday();
  const [hideAbsent, setHideAbsent] = useState(false);

  const total = daysInMonth(year, month);
  const first = weekdayIndex(new Date(Date.UTC(year, month, 1)));
  const holidayMap = new Map<string, string>(holidays.map((h) => [h.date.slice(0, 10), h.name]));
  const blockedMap = expandToDayMap(blocked, year, month);

  // Общая раскраска колонок: праздник, запретный период, выходной
  const dayList = Array.from({ length: total }, (_, i) => {
    const day = i + 1;
    const key = dayKey(year, month, day);
    const weekday = (first + i) % 7;
    const holiday = holidayMap.get(key);
    const block = blockedMap.get(key);

    let cls = weekday >= 5 ? colors.weekend : colors.normal;
    if (block) cls = colors.blocked;
    if (holiday) cls = colors.holiday;

    const hints: string[] = [];
    if (holiday) hints.push(holiday);
    if (block) hints.push(`Не рекомендуется: ${block.reason}`);

    return { day, key, weekday, cls, hint: hints.join(" · ") || undefined };
  });

  const byUser = new Map<string, AdminVacationItem[]>();
  entries.forEach((e) => {
    const list = byUser.get(e.user.id) ?? [];
    list.push(e);
    byUser.set(e.user.id, list);
  });

  const rows = users.map((user) => ({
    user,
    map: expandToDayMap(byUser.get(user.id) ?? [], year, month),
  }));
  const visibleRows = hideAbsent ? rows.filter((r) => r.map.size > 0) : rows;

  const counts = dayList.map((d) => visibleRows.reduce((sum, r) => sum + (r.map.has(d.key) ? 1 : 0), 0));

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
        <label className={styles.option}>
          <input type="checkbox" checked={hideAbsent} onChange={(e) => setHideAbsent(e.target.checked)} />
          Только те, кто отсутствует в этом месяце
        </label>
      </div>

      <div className={styles.scroll}>
        <div className={styles.grid} style={{ gridTemplateColumns: `220px repeat(${total}, 30px)` }}>
          <div className={styles.corner} />
          {dayList.map((d) => (
            <div
              key={`head-${d.key}`}
              className={`${styles.dayHead} ${d.cls} ${d.key === today ? colors.today : ""}`}
              title={d.hint}
            >
              <strong>{d.day}</strong>
              <span>{WEEKDAY_SHORT[d.weekday]}</span>
            </div>
          ))}

          {visibleRows.map(({ user, map }) => (
            <Fragment key={user.id}>
              <div className={styles.nameCell} title={`${user.fullName}${user.department ? ` · ${user.department}` : ""}`}>
                {user.fullName}
              </div>
              {dayList.map((d) => {
                const entry = map.get(d.key);
                const cls = entry ? entryClass(entry.type, entry.status) : d.cls;
                const hint = entry
                  ? `${user.fullName}: ${TYPE_LABELS[entry.type]} ${formatRu(entry.startDate)} – ${formatRu(entry.endDate)}, ${
                      entry.status === "CONFIRMED" ? "подтверждено" : "запланировано"
                    }`
                  : undefined;
                return <div key={`${user.id}-${d.key}`} className={`${styles.dayCell} ${cls}`} title={hint} />;
              })}
            </Fragment>
          ))}

          <div className={styles.footLabel}>Отсутствуют</div>
          {counts.map((c, i) => (
            <div key={`count-${i}`} className={styles.countCell}>{c > 0 ? c : ""}</div>
          ))}
        </div>
      </div>

      {visibleRows.length === 0 && <p className="text-s">Нет сотрудников по выбранным фильтрам</p>}
      <CalendarLegend />
    </div>
  );
}