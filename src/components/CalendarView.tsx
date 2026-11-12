"use client";
import { useState } from "react";
import {
  useGetMyVacationsQuery,
  useDeleteVacationMutation,
  useGetHolidaysQuery,
  useGetBlockedPeriodsQuery,
} from "@/store/api";
import { VACATION_LIMITS, daysInYear, daysInYearExcludingHolidays, countWorkingDays, countDays, parseISODate, rangesOverlap, formatRu, todayKey } from "@/lib/vacation";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { MonthGrid } from "@/components/MonthGrid";
import { RequestModal } from "@/components/RequestModal";
import styles from "./CalendarView.module.css";

const TYPE_LABELS: Record<string, string> = { VACATION: "Отпуск", DAY_OFF: "Отгул", BUSINESS_TRIP: "Командировка" };
const BALANCE_STYLE: Record<string, { tile: string; bar: string }> = {
  VACATION: { tile: "tileLilac", bar: "var(--color-accent)" },
  DAY_OFF: { tile: "tileMint", bar: "#2FA36B" },
};

export function CalendarView() {
  const { data, isLoading } = useGetMyVacationsQuery();
  const { data: holidays } = useGetHolidaysQuery();
  const { data: blocked } = useGetBlockedPeriodsQuery();
  const [deleteVacation] = useDeleteVacationMutation();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const entries = data ?? [];
  const holidaySet = new Set((holidays ?? []).map((h) => h.date.slice(0, 10)));

  function usedDays(kind: string) {
    return entries
      .filter((e) => e.type === kind)
      .reduce((sum, e) => sum + daysInYearExcludingHolidays(new Date(e.startDate), new Date(e.endDate), year, holidaySet), 0);
  }

  const yearEntries = entries.filter((e) => daysInYear(new Date(e.startDate), new Date(e.endDate), year) > 0);
  const yearHolidays = (holidays ?? []).filter((h) => new Date(h.date).getUTCFullYear() === year);
  const yearBlocked = (blocked ?? []).filter((b) => daysInYear(new Date(b.startDate), new Date(b.endDate), year) > 0);

  // Ближайшие праздники и ограничения от сегодняшнего дня
  const today = todayKey();
  const upcoming = [
    ...(holidays ?? []).map((h) => ({ key: `h-${h.id}-${h.date}`, from: h.date.slice(0, 10), to: h.date.slice(0, 10), text: h.name, kind: "holiday" as const })),
    ...(blocked ?? []).map((b) => ({ key: `b-${b.id}`, from: b.startDate.slice(0, 10), to: b.endDate.slice(0, 10), text: b.reason, kind: "blocked" as const })),
  ]
    .filter((x) => x.to >= today)
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(0, 5);

  // Выбор дат кликом: 1-й клик — один день, 2-й — конец периода, 3-й — начать заново
  function handlePick(iso: string) {
    if (!picking) {
      setSelStart(iso);
      setSelEnd(iso);
      setPicking(true);
      return;
    }
    if (selStart && iso < selStart) {
      setSelEnd(selStart);
      setSelStart(iso);
    } else {
      setSelEnd(iso);
    }
    setPicking(false);
  }

  function reset() {
    setSelStart(null);
    setSelEnd(null);
    setPicking(false);
  }

  const start = selStart ? parseISODate(selStart) : null;
  const end = selEnd ? parseISODate(selEnd) : null;
  const validRange = start && end && start.getTime() <= end.getTime();
  const previewDays = validRange ? countWorkingDays(start, end, holidaySet) : null;
  const overlappingBlocked = validRange ? (blocked ?? []).filter((b) => rangesOverlap(start, end, new Date(b.startDate), new Date(b.endDate))) : [];

  function handleDelete(id: string) {
    if (confirm("Удалить этот период? Заявка по нему тоже будет удалена.")) deleteVacation(id);
  }

  return (
    <>
      <div className={styles.topBar}>
        <div className={styles.yearPicker}>
          <button type="button" className={styles.yearBtn} onClick={() => setYear(year - 1)} aria-label="Предыдущий год">‹</button>
          <span className={styles.yearValue}>{year}</span>
          <button type="button" className={styles.yearBtn} onClick={() => setYear(year + 1)} aria-label="Следующий год">›</button>
        </div>
      </div>

      <div className={styles.balances}>
        {(Object.keys(VACATION_LIMITS) as (keyof typeof VACATION_LIMITS)[]).map((kind) => {
          const limit = VACATION_LIMITS[kind];
          const used = usedDays(kind);
          const left = Math.max(limit - used, 0);
          const look = BALANCE_STYLE[kind];
          return (
            <div key={kind} className={`${styles.balance} ${styles[look.tile]}`}>
              <div className={styles.balanceTop}>
                <span className={styles.balanceName}>{TYPE_LABELS[kind]}</span>
                <span className={styles.balanceUsed}>внесено {used}</span>
              </div>
              <div className={styles.balanceNumber}>{left}<span className={styles.balanceOf}> из {limit} дн.</span></div>
              <ProgressBar percent={limit ? (used / limit) * 100 : 0} color={look.bar} />
            </div>
          );
        })}
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          <MonthGrid
            year={year}
            month={month}
            onChange={(y, m) => { setYear(y); setMonth(m); }}
            entries={entries}
            holidays={holidays ?? []}
            blocked={blocked ?? []}
            selStart={selStart}
            selEnd={selEnd}
            onPick={handlePick}
          />
        </section>

        <div className={styles.side}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Оформить заявку</h2>
            {validRange && selStart && selEnd ? (
              <div className={styles.form}>
                <p className={styles.selected}>
                  {formatRu(selStart)}{selEnd !== selStart ? ` – ${formatRu(selEnd)}` : ""}
                </p>
                <p className={styles.preview}>Дней в периоде (без праздников): <strong>{previewDays}</strong></p>
                {overlappingBlocked.length > 0 && (
                  <p className={styles.warning}>
                    В эти даты брать отпуск не рекомендуется:{" "}
                    {overlappingBlocked.map((b) => `${b.reason} (${formatRu(b.startDate)} – ${formatRu(b.endDate)})`).join("; ")}.
                    Заявку подать можно, но согласовать её будет сложнее.
                  </p>
                )}
                <Button variant="accent" className={styles.submit} onClick={() => setModalOpen(true)}>Оформить заявку</Button>
                <Button variant="secondary" className={styles.submit} onClick={reset}>Сбросить выбор</Button>
              </div>
            ) : (
              <p className={styles.muted}>Нажмите на дату в календаре, затем на последний день периода. Отпуск, отгул и командировку можно оформить в окне заявки.</p>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Ближайшие праздники и ограничения</h2>
            {upcoming.length > 0 ? (
              <ul className={styles.upcoming}>
                {upcoming.map((u) => (
                  <li key={u.key} className={u.kind === "blocked" ? styles.upBlocked : styles.upHoliday}>
                    <span className={styles.upDate}>{formatRu(u.from)}{u.to !== u.from ? ` – ${formatRu(u.to)}` : ""}</span>
                    <span>{u.kind === "blocked" ? `Не рекомендуется: ${u.text}` : u.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Ближайших праздников и ограничений нет</p>
            )}
          </section>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Мои периоды за {year} год</h2>
      {isLoading && <p className="text-s">Загрузка...</p>}
      <div className={styles.periods}>
        {yearEntries.map((e) => (
          <div key={e.id} className={styles.period}>
            <span className={`${styles.dot} ${e.type === "VACATION" ? styles.dotVacation : e.type === "BUSINESS_TRIP" ? styles.dotTrip : styles.dotDayOff}`} aria-hidden="true" />
            <div className={styles.periodBody}>
              <div className={styles.periodTitle}>
                {TYPE_LABELS[e.type]} · {formatRu(e.startDate)} – {formatRu(e.endDate)}
              </div>
              <div className={styles.periodMeta}>
                {countDays(new Date(e.startDate), new Date(e.endDate))} дн.
                {e.comment ? ` · ${e.comment}` : ""}
              </div>
            </div>
            <div className={styles.periodActions}>
              <span className={`${styles.badge} ${e.status === "CONFIRMED" ? styles.confirmed : styles.planned}`}>
                {e.status === "CONFIRMED" ? "Подтверждено" : "На рассмотрении у HR"}
              </span>
              {e.status === "PLANNED" ? (
                <Button size="sm" variant="danger" onClick={() => handleDelete(e.id)}>Удалить</Button>
              ) : (
                <span className={styles.hrOnly}>Изменить может только HR</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {yearEntries.length === 0 && !isLoading && <p className="text-s">В этом году пока ничего не внесено</p>}

      <details className={styles.extra}>
        <summary className={styles.extraSummary}>
          <span>Все праздники и ограничения, {year}</span>
          <svg className={styles.extraChevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className={styles.extraBody}>
          <div className={styles.extraCol}>
            <h3 className={styles.extraTitle}>Праздники и нерабочие дни</h3>
            {yearHolidays.length > 0 ? (
              <ul className={styles.holidayList}>
                {yearHolidays.map((h) => (
                  <li key={`${h.id}-${h.date}`}>{formatRu(h.date)} · {h.name}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>На этот год праздники ещё не добавлены</p>
            )}
          </div>
          <div className={styles.extraCol}>
            <h3 className={styles.extraTitle}>Не рекомендуется брать отпуск</h3>
            {yearBlocked.length > 0 ? (
              <ul className={styles.holidayList}>
                {yearBlocked.map((b) => (
                  <li key={b.id}>{formatRu(b.startDate)} – {formatRu(b.endDate)} · {b.reason}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Ограничений на этот год нет</p>
            )}
          </div>
        </div>
      </details>

      <RequestModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        initialType="LEAVE"
        initialValues={selStart && selEnd ? { startDate: selStart, endDate: selEnd } : undefined}
      />
    </>
  );
}
