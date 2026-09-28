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
import { parseHolidayLines, parseISODate, formatRu } from "@/lib/vacation";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import styles from "./settings.module.css";

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

  const [year, setYear] = useState(new Date().getFullYear());
  const [holidayText, setHolidayText] = useState("");
  const [holidayErrors, setHolidayErrors] = useState<string[]>([]);
  const [holidayResult, setHolidayResult] = useState("");

  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockError, setBlockError] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  const yearHolidays = (holidays ?? []).filter((h) => new Date(h.date).getUTCFullYear() === year);

  async function handleAddHolidays(e: React.FormEvent) {
    e.preventDefault();
    setHolidayResult("");

    const { items, errors } = parseHolidayLines(holidayText);
    if (errors.length > 0) {
      setHolidayErrors(errors);
      return;
    }
    if (items.length === 0) {
      setHolidayErrors(["Не найдено ни одной даты"]);
      return;
    }
    setHolidayErrors([]);

    try {
      const res = await addHolidays({ items }).unwrap();
      setHolidayResult(`Добавлено: ${res.created}, уже были в списке: ${items.length - res.created}`);
      setHolidayText("");
    } catch (err: any) {
      setHolidayErrors([err?.data?.error || "Не удалось сохранить"]);
    }
  }

  async function handleAddBlocked(e: React.FormEvent) {
    e.preventDefault();
    setBlockError("");

    const startISO = parseRuDate(blockStart);
    const endISO = parseRuDate(blockEnd);
    if (!startISO || !endISO || !parseISODate(startISO) || !parseISODate(endISO)) {
      setBlockError("Введите обе даты в формате дд.мм.гггг");
      return;
    }
    if (!blockReason.trim()) {
      setBlockError("Укажите причину");
      return;
    }

    try {
      await createBlocked({ startDate: startISO, endDate: endISO, reason: blockReason }).unwrap();
      setBlockStart("");
      setBlockEnd("");
      setBlockReason("");
    } catch (err: any) {
      setBlockError(err?.data?.error || "Не удалось сохранить период");
    }
  }

  function handleDeleteHoliday(id: string) {
    if (confirm("Удалить этот день из календаря праздников?")) deleteHoliday(id);
  }

  function handleDeleteBlocked(id: string) {
    if (confirm("Удалить этот запретный период?")) deleteBlocked(id);
  }

  return (
    <PageShell title="Праздники и запретные периоды" wide>
      <section className={styles.section}>
        <h2 className="text-h2">Производственный календарь</h2>

        <form onSubmit={handleAddHolidays} className={styles.form}>
          <p className={styles.hint}>
            Вставьте список, по одной записи на строку. Можно одну дату или диапазон, название необязательно.
            Например: 01.01.2027 - Новый год или 01.01.2027-08.01.2027 Новогодние каникулы.
            Даты, которые уже есть в календаре, будут пропущены.
          </p>
          <textarea
            className="textarea"
            rows={6}
            value={holidayText}
            onChange={(e) => setHolidayText(e.target.value)}
            placeholder={"01.01.2027-08.01.2027 Новогодние каникулы\n23.02.2027 День защитника Отечества\n08.03.2027 Международный женский день"}
          />
          {holidayErrors.length > 0 && (
            <ul className={styles.errors}>
              {holidayErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
          {holidayResult && <p className={styles.success}>{holidayResult}</p>}
          <div>
            <Button type="submit" disabled={addingHolidays}>Добавить праздники</Button>
          </div>
        </form>

        <div className={styles.yearRow}>
          <button className={styles.yearBtn} onClick={() => setYear(year - 1)} aria-label="Предыдущий год">‹</button>
          <span className="text-h3">{year}</span>
          <button className={styles.yearBtn} onClick={() => setYear(year + 1)} aria-label="Следующий год">›</button>
        </div>

        {yearHolidays.map((h) => (
          <div key={h.id} className={styles.row}>
            <span className="text-s">{formatRu(h.date)} · {h.name}</span>
            <Button size="sm" variant="danger" onClick={() => handleDeleteHoliday(h.id)}>Удалить</Button>
          </div>
        ))}
        {yearHolidays.length === 0 && <p className="text-s">На {year} год праздников пока нет</p>}
      </section>

      <section className={styles.section}>
        <h2 className="text-h2">Запретные периоды</h2>
        <p className={styles.hint}>
          В эти даты сотрудники увидят жёлтое предупреждение, что отпуск лучше не планировать.
          Внести период при этом всё равно можно.
        </p>

        <form onSubmit={handleAddBlocked} className={styles.form}>
          <div className={styles.formRow}>
            <input
              className="input"
              value={blockStart}
              onChange={(e) => setBlockStart(autoFormatRuDate(e.target.value))}
              placeholder="Начало: дд.мм.гггг"
              maxLength={10}
            />
            <input
              className="input"
              value={blockEnd}
              onChange={(e) => setBlockEnd(autoFormatRuDate(e.target.value))}
              placeholder="Конец: дд.мм.гггг"
              maxLength={10}
            />
          </div>
          <input
            className="input"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Причина, например: закрытие квартала"
          />
          {blockError && <p className={styles.error}>{blockError}</p>}
          <div>
            <Button type="submit" disabled={addingBlocked}>Добавить период</Button>
          </div>
        </form>

        {blocked?.map((b) => (
          <div key={b.id} className={styles.row}>
            <span className="text-s">{formatRu(b.startDate)} – {formatRu(b.endDate)} · {b.reason}</span>
            <Button size="sm" variant="danger" onClick={() => handleDeleteBlocked(b.id)}>Удалить</Button>
          </div>
        ))}
        {blocked?.length === 0 && <p className="text-s">Запретных периодов пока нет</p>}
      </section>
    </PageShell>
  );
}