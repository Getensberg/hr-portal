"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetHolidaysQuery,
  useAddHolidaysMutation,
  useDeleteHolidayMutation,
  useGetBlockedPeriodsQuery,
  useCreateBlockedPeriodMutation,
  useDeleteBlockedPeriodMutation,
} from "@/store/api";
import { parseHolidayLines, formatRu } from "@/lib/vacation";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { MonthGrid } from "@/components/MonthGrid";
import { FormError } from "@/components/FormError";
import { getErrorMessage } from "@/lib/errors";
import styles from "./settings.module.css";

type Mode = "HOLIDAY" | "BLOCKED";

function isoToRu(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export default function CalendarSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: holidays } = useGetHolidaysQuery();
  const { data: blocked } = useGetBlockedPeriodsQuery();
  const [addHolidays, { isLoading: addingHolidays }] = useAddHolidaysMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();
  const [createBlocked, { isLoading: addingBlocked }] = useCreateBlockedPeriodMutation();
  const [deleteBlocked] = useDeleteBlockedPeriodMutation();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const [mode, setMode] = useState<Mode>("HOLIDAY");
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  function handlePick(iso: string) {
    setSuccess("");
    setError("");
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

  function clearSelection() {
    setSelStart(null);
    setSelEnd(null);
    setPicking(false);
    setLabel("");
    setError("");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSuccess("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selStart || !selEnd) {
      setError("Выберите дату или период в календаре");
      return;
    }
    try {
      if (mode === "HOLIDAY") {
        const line = `${isoToRu(selStart)}${selStart !== selEnd ? `-${isoToRu(selEnd)}` : ""} ${label.trim()}`;
        const { items, errors } = parseHolidayLines(line);
        if (errors.length > 0) {
          setError(errors[0]);
          return;
        }
        const res = await addHolidays({ items }).unwrap();
        setSuccess(
          res.created > 0
            ? `Добавлено дней: ${res.created}${items.length - res.created > 0 ? `, уже были: ${items.length - res.created}` : ""}`
            : "Эти дни уже отмечены как праздничные"
        );
      } else {
        if (!label.trim()) {
          setError("Укажите причину");
          return;
        }
        await createBlocked({ startDate: selStart, endDate: selEnd, reason: label.trim() }).unwrap();
        setSuccess("Запретный период добавлен");
      }
      clearSelection();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить"));
    }
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    setBulkResult("");
    const { items, errors } = parseHolidayLines(bulkText);
    if (errors.length > 0) return setBulkErrors(errors);
    if (items.length === 0) return setBulkErrors(["Не найдено ни одной даты"]);
    setBulkErrors([]);
    try {
      const res = await addHolidays({ items }).unwrap();
      setBulkResult(`Добавлено: ${res.created}, уже были в списке: ${items.length - res.created}`);
      setBulkText("");
    } catch (err) {
      setBulkErrors([getErrorMessage(err, "Не удалось сохранить")]);
    }
  }

  async function handleDeleteHolidayGroup(g: { ids: string[]; start: string; end: string }) {
    const text = g.ids.length > 1 ? `Удалить период ${formatRu(g.start)} – ${formatRu(g.end)} из праздников?` : "Удалить этот день из календаря праздников?";
    if (!confirm(text)) return;
    for (const id of g.ids) {
      try {
        await deleteHoliday(id).unwrap();
      } catch (err) {
        setError(getErrorMessage(err, "Не удалось удалить день"));
        break;
      }
    }
  }
  function handleDeleteBlocked(id: string) {
    if (confirm("Удалить этот запретный период?")) deleteBlocked(id);
  }

  const yearHolidays = (holidays ?? [])
    .filter((h) => new Date(h.date).getUTCFullYear() === year)
    .sort((a, b) => a.date.localeCompare(b.date));
  // В базе каждый праздничный день хранится отдельно, а в списке подряд идущие дни с одним названием показываем одним периодом
  const holidayGroups: { ids: string[]; start: string; end: string; name: string }[] = [];
  for (const h of yearHolidays) {
    const day = h.date.slice(0, 10);
    const last = holidayGroups[holidayGroups.length - 1];
    const nextDay = last ? new Date(Date.parse(last.end) + 86400000).toISOString().slice(0, 10) : "";
    if (last && last.name === h.name && nextDay === day) {
      last.ids.push(h.id);
      last.end = day;
    } else {
      holidayGroups.push({ ids: [h.id], start: day, end: day, name: h.name });
    }
  }
  const yearBlocked = (blocked ?? [])
    .filter((b) => new Date(b.startDate).getUTCFullYear() <= year && new Date(b.endDate).getUTCFullYear() >= year)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const hasSel = Boolean(selStart && selEnd);
  const lo = selStart && selEnd && selStart > selEnd ? selEnd : selStart;
  const hi = selStart && selEnd && selStart > selEnd ? selStart : selEnd;
  const selText = !hasSel || !lo || !hi ? "" : lo === hi ? isoToRu(lo) : `${isoToRu(lo)} – ${isoToRu(hi)}`;

  return (
    <PageShell title="Праздники и запретные периоды" wide>
      <div className={styles.layout}>
        <section className={styles.panel}>
          <MonthGrid
            year={year}
            month={month}
            onChange={(y, m) => { setYear(y); setMonth(m); }}
            entries={[]}
            holidays={holidays ?? []}
            blocked={blocked ?? []}
            selStart={selStart}
            selEnd={selEnd}
            onPick={handlePick}
          />
        </section>

        <form onSubmit={handleSave} className={styles.panel}>
          <h2 className={styles.h2}>Что отметить</h2>
          <div className={styles.segment} role="tablist">
            <button type="button" role="tab" aria-selected={mode === "HOLIDAY"} className={`${styles.seg} ${mode === "HOLIDAY" ? styles.segHoliday : ""}`} onClick={() => switchMode("HOLIDAY")}>
              Праздник
            </button>
            <button type="button" role="tab" aria-selected={mode === "BLOCKED"} className={`${styles.seg} ${mode === "BLOCKED" ? styles.segBlocked : ""}`} onClick={() => switchMode("BLOCKED")}>
              Запретный период
            </button>
          </div>
          <p className={styles.hint}>
            {mode === "HOLIDAY"
              ? "Нерабочие дни: в них не считаются дни отпуска. Это может быть один день или период, например новогодние каникулы."
              : "В эти даты сотрудники увидят предупреждение, что отпуск лучше не планировать. Внести период при этом всё равно можно."}
          </p>

          <div className={styles.selBox}>
            <span className={styles.selLabel}>Выбрано</span>
            {hasSel ? (
              <span className={styles.selValue}>{selText}</span>
            ) : (
              <span className={styles.selEmpty}>Нажмите на дату в календаре, для периода нажмите на вторую дату</span>
            )}
            {hasSel && <button type="button" className={styles.clear} onClick={clearSelection}>Сбросить</button>}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>{mode === "HOLIDAY" ? "Название (необязательно)" : "Причина"}</span>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={mode === "HOLIDAY" ? "Например, Новый год" : "Например, закрытие квартала"}
            />
          </label>

          <FormError message={error || null} />
          {success && <p className={styles.success}>{success}</p>}
          <Button type="submit" disabled={addingHolidays || addingBlocked || !hasSel}>
            {mode === "HOLIDAY" ? "Добавить праздник" : "Добавить запретный период"}
          </Button>
        </form>
      </div>

      <div className={styles.lists}>
        <section>
          <h2 className={styles.listTitle}>Праздники {year} <span className={styles.count}>{holidayGroups.length}</span></h2>
          {holidayGroups.map((g) => (
            <div key={g.ids[0]} className={styles.row}>
              <span className={styles.rowText}>
                <span className={`${styles.rowDate} ${styles.dateHoliday}`}>
                  {g.start === g.end ? formatRu(g.start) : `${formatRu(g.start)} – ${formatRu(g.end)}`}
                </span>
                {g.name}
              </span>
              <Button size="sm" variant="danger" onClick={() => handleDeleteHolidayGroup(g)}>Удалить</Button>
            </div>
          ))}
          {yearHolidays.length === 0 && <p className={styles.empty}>На {year} год праздников пока нет</p>}
        </section>

        <section>
          <h2 className={styles.listTitle}>Запретные периоды <span className={styles.count}>{yearBlocked.length}</span></h2>
          {yearBlocked.map((b) => (
            <div key={b.id} className={styles.row}>
              <span className={styles.rowText}>
                <span className={`${styles.rowDate} ${styles.dateBlocked}`}>{formatRu(b.startDate)} – {formatRu(b.endDate)}</span>
                {b.reason}
              </span>
              <Button size="sm" variant="danger" onClick={() => handleDeleteBlocked(b.id)}>Удалить</Button>
            </div>
          ))}
          {yearBlocked.length === 0 && <p className={styles.empty}>Запретных периодов пока нет</p>}
        </section>
      </div>

      <details className={styles.bulk}>
        <summary>Добавить праздники списком</summary>
        <form onSubmit={handleBulk} className={styles.bulkForm}>
          <p className={styles.hint}>
            По одной записи на строку: дата или диапазон, название необязательно. Например: 01.01.2027 Новый год
            или 01.01.2027-08.01.2027 Новогодние каникулы. Даты, которые уже есть, будут пропущены.
          </p>
          <textarea
            className="textarea"
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"01.01.2027-08.01.2027 Новогодние каникулы\n23.02.2027 День защитника Отечества"}
          />
          {bulkErrors.length > 0 && <ul className={styles.errors}>{bulkErrors.map((err, i) => <li key={i}>{err}</li>)}</ul>}
          {bulkResult && <p className={styles.success}>{bulkResult}</p>}
          <div><Button type="submit" disabled={addingHolidays}>Добавить списком</Button></div>
        </form>
      </details>
    </PageShell>
  );
}
