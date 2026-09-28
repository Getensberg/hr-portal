"use client";
import { useState } from "react";
import { useGetMyVacationsQuery, useCreateVacationMutation, useDeleteVacationMutation } from "@/store/api";
import { VACATION_LIMITS, daysInYear, countDays, parseISODate, formatRu } from "@/lib/vacation";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./calendar.module.css";

const TYPE_LABELS: Record<string, string> = { VACATION: "Отпуск", DAY_OFF: "Отгул" };

export default function CalendarPage() {
  const { data, isLoading } = useGetMyVacationsQuery();
  const [createVacation, { isLoading: saving }] = useCreateVacationMutation();
  const [deleteVacation] = useDeleteVacationMutation();

  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState("VACATION");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const entries = data ?? [];

  function usedDays(kind: string) {
    return entries
      .filter((e) => e.type === kind)
      .reduce((sum, e) => sum + daysInYear(new Date(e.startDate), new Date(e.endDate), year), 0);
  }

  const yearEntries = entries.filter(
    (e) => daysInYear(new Date(e.startDate), new Date(e.endDate), year) > 0
  );

  const startISO = parseRuDate(startInput);
  const endISO = parseRuDate(endInput);
  const startDate = startISO ? parseISODate(startISO) : null;
  const endDate = endISO ? parseISODate(endISO) : null;
  const previewDays = startDate && endDate && startDate.getTime() <= endDate.getTime()
    ? countDays(startDate, endDate)
    : null;

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
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось сохранить период");
    }
  }

  function handleDelete(id: string) {
    if (confirm("Удалить этот период?")) deleteVacation(id);
  }

  return (
    <PageShell title="Календарь отпусков">
      <div className={styles.yearRow}>
        <button className={styles.yearBtn} onClick={() => setYear(year - 1)} aria-label="Предыдущий год">‹</button>
        <span className="text-h3">{year}</span>
        <button className={styles.yearBtn} onClick={() => setYear(year + 1)} aria-label="Следующий год">›</button>
      </div>

      <div className={styles.balances}>
        {(Object.keys(VACATION_LIMITS) as (keyof typeof VACATION_LIMITS)[]).map((kind) => {
          const limit = VACATION_LIMITS[kind];
          const used = usedDays(kind);
          return (
            <Card key={kind}>
              <CardTitle>{TYPE_LABELS[kind]}</CardTitle>
              <div className={styles.balanceNumber}>{Math.max(limit - used, 0)}</div>
              <p className="text-xs">осталось из {limit} дн. · внесено {used}</p>
            </Card>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="VACATION">Отпуск</option>
            <option value="DAY_OFF">Отгул</option>
          </select>
          <input
            className="input"
            value={startInput}
            onChange={(e) => setStartInput(autoFormatRuDate(e.target.value))}
            placeholder="Начало: дд.мм.гггг"
            maxLength={10}
          />
          <input
            className="input"
            value={endInput}
            onChange={(e) => setEndInput(autoFormatRuDate(e.target.value))}
            placeholder="Конец: дд.мм.гггг"
            maxLength={10}
          />
        </div>
        <input
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий (необязательно)"
        />
        {previewDays !== null && <p className={styles.preview}>Дней в периоде: {previewDays}</p>}
        {error && <p className={styles.error}>{error}</p>}
        <div>
          <Button type="submit" disabled={saving}>Добавить период</Button>
        </div>
      </form>

      <h2 className="text-h2">Мои периоды за {year} год</h2>
      {isLoading && <p className="text-s">Загрузка...</p>}
      {yearEntries.map((e) => (
        <Card key={e.id}>
          <div className={styles.entryRow}>
            <div>
              <span className="text-s">
                <strong>{TYPE_LABELS[e.type]}</strong> · {formatRu(e.startDate)} – {formatRu(e.endDate)} ·{" "}
                {countDays(new Date(e.startDate), new Date(e.endDate))} дн.
              </span>
              {e.comment && <p className="text-xs">{e.comment}</p>}
            </div>
            <div className={styles.entryActions}>
              <span className={`${styles.badge} ${e.status === "CONFIRMED" ? styles.confirmed : styles.planned}`}>
                {e.status === "CONFIRMED" ? "Подтверждено" : "Запланировано"}
              </span>
              {e.status === "PLANNED" ? (
                <Button variant="danger" onClick={() => handleDelete(e.id)}>Удалить</Button>
              ) : (
                <span className="text-xs">Изменить может только HR</span>
              )}
            </div>
          </div>
        </Card>
      ))}
      {yearEntries.length === 0 && !isLoading && <p className="text-s">В этом году пока ничего не внесено</p>}
    </PageShell>
  );
}