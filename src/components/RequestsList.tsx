"use client";
import { useMemo, useState } from "react";
import { useGetMyRequestsQuery, useDeleteRequestMutation, useArchiveRequestMutation } from "@/store/api";
import { Button } from "@/components/Button";
import { getErrorMessage } from "@/lib/errors";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { StatusBadge } from "@/components/StatusBadge";
import { NewRequestButton } from "@/components/NewRequestButton";
import buttonStyles from "@/components/Button.module.css";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, REQUEST_HOLDER_LABELS } from "@/lib/requestTypes";
import { summarizePayload } from "@/lib/requestForms";
import styles from "@/app/requests/requests.module.css";

const ALL = "ALL";
const STATUS_OPTIONS = [{ value: ALL, label: "Любой статус" }, ...Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label }))];
const TYPE_OPTIONS = [{ value: ALL, label: "Все типы" }, ...Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }))];

export function RequestsList({ archive = false }: { archive?: boolean }) {
  const { data: requests, isLoading } = useGetMyRequestsQuery();
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [deleteRequest] = useDeleteRequestMutation();
  const [archiveRequest] = useArchiveRequestMutation();
  const [error, setError] = useState("");

  async function handleArchive(id: string, archived: boolean) {
    setError("");
    try {
      await archiveRequest({ id, archived }).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось изменить заявку"));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить заявку? Это нельзя отменить.")) return;
    setError("");
    try {
      await deleteRequest(id).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось удалить заявку"));
    }
  }

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set((requests ?? []).map((r) => new Date(r.requestedAt).getFullYear()))).sort((a, b) => b - a);
    return [{ value: ALL, label: "Все годы" }, ...years.map((y) => ({ value: String(y), label: String(y) }))];
  }, [requests]);

  const filtered = (requests ?? []).filter(
    (r) =>
      Boolean(r.archivedAt) === archive &&
      (status === ALL || r.status === status) &&
      (type === ALL || r.type === type) &&
      (year === ALL || String(new Date(r.requestedAt).getFullYear()) === year)
  );

  return (
    <>
      <div className={styles.top}>
        <p className="text-s">
          {archive
            ? "Выполненные заявки, которые вы отправили в архив или которым больше трёх месяцев. Из архива заявку можно вернуть."
            : "Справки, отпуск, командировки, техника и доступы. После подтверждения HR отпуск и командировка попадают в календарь."}
        </p>
        {!archive && <NewRequestButton className={`${buttonStyles.btn} ${buttonStyles.primary}`}>Новая заявка</NewRequestButton>}
      </div>

      <div className={styles.filters}>
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} ariaLabel="Статус" />
        <Select value={type} onChange={setType} options={TYPE_OPTIONS} ariaLabel="Тип" />
        <Select value={year} onChange={setYear} options={yearOptions} ariaLabel="Год" />
      </div>

      {error && <p className={styles.error}>{error}</p>}
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
            {new Date(r.requestedAt).toLocaleDateString("ru-RU")} · {r.archivedAt ? "В архиве" : REQUEST_HOLDER_LABELS[r.status]}
          </div>
          {r.status === "PENDING" && !r.archivedAt && (
            <div className={styles.cardActions}>
              <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>Удалить заявку</Button>
            </div>
          )}
          {r.status === "DONE" && (
            <div className={styles.cardActions}>
              <Button size="sm" variant="secondary" onClick={() => handleArchive(r.id, !r.archivedAt)}>
                {r.archivedAt ? "Вернуть из архива" : "В архив"}
              </Button>
            </div>
          )}
          {r.files && r.files.length > 0 && (
            <div className={styles.filesRow}>
              {r.files.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">📎 {f.name}</a>
              ))}
            </div>
          )}
        </Card>
      ))}
      {!isLoading && filtered.length === 0 && requests?.some((r) => Boolean(r.archivedAt) === archive) && <p className="text-s">По выбранным фильтрам заявок нет</p>}
      {!isLoading && requests && filtered.length === 0 && requests.every((r) => Boolean(r.archivedAt) !== archive) && (
        <p className="text-s">{archive ? "В архиве пока ничего нет" : "Пока нет заявок"}</p>
      )}
    </>
  );
}
