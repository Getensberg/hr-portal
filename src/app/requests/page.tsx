"use client";
import { useMemo, useState } from "react";
import { useGetMyRequestsQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { StatusBadge } from "@/components/StatusBadge";
import { NewRequestButton } from "@/components/NewRequestButton";
import buttonStyles from "@/components/Button.module.css";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, REQUEST_HOLDER_LABELS } from "@/lib/requestTypes";
import { summarizePayload } from "@/lib/requestForms";
import styles from "./requests.module.css";

const ALL = "ALL";
const STATUS_OPTIONS = [{ value: ALL, label: "Любой статус" }, ...Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label }))];
const TYPE_OPTIONS = [{ value: ALL, label: "Все типы" }, ...Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }))];

export default function RequestsPage() {
  const { data: requests, isLoading } = useGetMyRequestsQuery();
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [year, setYear] = useState(ALL);

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set((requests ?? []).map((r) => new Date(r.requestedAt).getFullYear()))).sort((a, b) => b - a);
    return [{ value: ALL, label: "Все годы" }, ...years.map((y) => ({ value: String(y), label: String(y) }))];
  }, [requests]);

  const filtered = (requests ?? []).filter(
    (r) =>
      (status === ALL || r.status === status) &&
      (type === ALL || r.type === type) &&
      (year === ALL || String(new Date(r.requestedAt).getFullYear()) === year)
  );

  return (
    <PageShell title="Заявки">
      <div className={styles.top}>
        <p className="text-s">Справки, отпуск, командировки, техника и доступы. После подтверждения HR отпуск и командировка попадают в календарь.</p>
        <NewRequestButton className={`${buttonStyles.btn} ${buttonStyles.primary}`}>Новая заявка</NewRequestButton>
      </div>

      <div className={styles.filters}>
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} ariaLabel="Статус" />
        <Select value={type} onChange={setType} options={TYPE_OPTIONS} ariaLabel="Тип" />
        <Select value={year} onChange={setYear} options={yearOptions} ariaLabel="Год" />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}
      {filtered.map((r) => (
        <Card key={r.id}>
          <div className={styles.historyRow}>
            <span className="text-s">
              <strong>{REQUEST_TYPE_LABELS[r.type]}</strong>
              {summarizePayload(r.type, r.payload) ? ` — ${summarizePayload(r.type, r.payload)}` : ""}
            </span>
            <StatusBadge status={r.status} />
          </div>
          <div className={styles.meta}>
            {new Date(r.requestedAt).toLocaleDateString("ru-RU")} · {REQUEST_HOLDER_LABELS[r.status]}
          </div>
          {r.files && r.files.length > 0 && (
            <div className={styles.filesRow}>
              {r.files.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">📎 {f.name}</a>
              ))}
            </div>
          )}
        </Card>
      ))}
      {!isLoading && requests && requests.length > 0 && filtered.length === 0 && <p className="text-s">По выбранным фильтрам заявок нет</p>}
      {requests?.length === 0 && <p className="text-s">Пока нет заявок</p>}
    </PageShell>
  );
}
