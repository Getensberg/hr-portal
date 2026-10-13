"use client";
import { useState } from "react";
import {
  useGetMyVacationsQuery,
  useCreateVacationMutation,
  useDeleteVacationMutation,
  useGetHolidaysQuery,
  useGetBlockedPeriodsQuery,
} from "@/store/api";
import { VACATION_LIMITS, daysInYear, daysInYearExcludingHolidays, countWorkingDays, countDays, parseISODate, rangesOverlap, formatRu } from "@/lib/vacation";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { ProgressBar } from "@/components/ProgressBar";
import { FormError } from "@/components/FormError";
import { getErrorMessage } from "@/lib/errors";
import { MonthGrid } from "@/components/MonthGrid";
import styles from "./calendar.module.css";

const TYPE_LABELS: Record<string, string> = { VACATION: "Отпуск", DAY_OFF: "Отгул" };
const TYPE_OPTIONS = [
  { value: "VACATION", label: "Отпуск" },
  { value: "DAY_OFF", label: "Отгул" },
];
const BALANCE_STYLE: Record<string, { tile: string; bar: string }> = {
  VACATION: { tile: "tileLilac", bar: "var(--color-accent)" },
  DAY_OFF: { tile: "tileMint", bar: "#2FA36B" },
};

export default function CalendarPage() {
  const { data, isLoading } = useGetMyVacationsQuery();
  const { data: holidays } = useGetHolidaysQuery();
  const { data: blocked } = useGetBlockedPeriodsQuery();
  const [createVacation, { isLoading: saving }] = useCreateVacationMutation();
  const [deleteVacation] = useDeleteVacationMutation();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [type, setType] = useState("VACATION");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const entries = data ?? [];
  const holidaySet = new Set((holidays ?? []).map((h) => h.date.slice(0, 10)));

function usedDays(kind: string) {
  return entries
    .filter((e) => e.type === kind)
    .reduce((sum, e) => sum + daysInYearExcludingHolidays(new Date(e.startDate), new Date(e.endDate), year, holidaySet), 0);
}

  const yearEntries = entries.filter(
    (e) => daysInYear(new Date(e.startDate), new Date(e.endDate), year) > 0
  );
  const yearHolidays = (holidays ?? []).filter((h) => new Date(h.date).getUTCFullYear() === year);
  const yearBlocked = (blocked ?? []).filter(
    (b) => daysInYear(new Date(b.startDate), new Date(b.endDate), year) > 0
  );

  const startISO = parseRuDate(startInput);
  const endISO = parseRuDate(endInput);
  const startDate = startISO ? parseISODate(startISO) : null;
  const endDate = endISO ? parseISODate(endISO) : null;
  const validRange = startDate && endDate && startDate.getTime() <= endDate.getTime();
  const previewDays = validRange ? countWorkingDays(startDate, endDate, holidaySet) : null;

  const overlappingBlocked = validRange
    ? (blocked ?? []).filter((b) => rangesOverlap(startDate, endDate, new Date(b.startDate), new Date(b.endDate)))
    : [];

  function handleMonthChange(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!startISO || !endISO || !startDate || !endDate) {
      setError("Введите обе даты в формате дд.мм.гггг");
      return;
    }
    try {
      await createVacation({ type, startDate: startISO, endDate: endISO, comment: comment || undefined }).unwrap();
      setStartInput("");
      setEndInput("");
      setComment("");
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить период"));
    }
  }

  function handleDelete(id: string) {
    if (confirm("Удалить этот период?")) deleteVacation(id);
  }

  return (
    <PageShell title="Календарь отпусков">
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
            onChange={handleMonthChange}
            entries={entries}
            holidays={holidays ?? []}
            blocked={blocked ?? []}
          />
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Новый период</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <span className={styles.label}>Тип</span>
              <Select value={type} onChange={setType} options={TYPE_OPTIONS} ariaLabel="Тип периода" />
            </div>
            <div className={styles.dates}>
              <label className={styles.field}>
                <span className={styles.label}>Начало</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={startInput}
                  onChange={(e) => setStartInput(autoFormatRuDate(e.target.value))}
                  placeholder="дд.мм.гггг"
                  maxLength={10}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Конец</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={endInput}
                  onChange={(e) => setEndInput(autoFormatRuDate(e.target.value))}
                  placeholder="дд.мм.гггг"
                  maxLength={10}
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>Комментарий</span>
              <input
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Необязательно"
              />
            </label>
            {previewDays !== null && (
              <p className={styles.preview}>Дней в периоде (без учёта праздников): <strong>{previewDays}</strong></p>
            )}
            {overlappingBlocked.length > 0 && (
              <p className={styles.warning}>
                В эти даты брать отпуск не рекомендуется:{" "}
                {overlappingBlocked
                  .map((b) => `${b.reason} (${formatRu(b.startDate)} – ${formatRu(b.endDate)})`)
                  .join("; ")}
                . Период внести можно, но согласовать его будет сложнее.
              </p>
            )}
            <FormError message={error} />
            <Button type="submit" variant="accent" disabled={saving} className={styles.submit}>
              {saving ? "Сохраняем…" : "Добавить период"}
            </Button>
          </form>
        </section>
      </div>

      <h2 className={styles.sectionTitle}>Мои периоды за {year} год</h2>
      {isLoading && <p className="text-s">Загрузка...</p>}
      <div className={styles.periods}>
        {yearEntries.map((e) => (
          <div key={e.id} className={styles.period}>
            <span className={`${styles.dot} ${e.type === "VACATION" ? styles.dotVacation : styles.dotDayOff}`} aria-hidden="true" />
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
                {e.status === "CONFIRMED" ? "Подтверждено" : "Запланировано"}
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
          <span>Праздники и ограничения, {year}</span>
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
                  <li key={h.id}>{formatRu(h.date)} · {h.name}</li>
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
    </PageShell>
  );
}
