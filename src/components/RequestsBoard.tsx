"use client";
import { useState } from "react";
import type { RequestItem } from "@/store/api";
import { Select } from "./Select";
import { Button } from "./Button";
import { FileTypeIcon } from "./FileTypeIcon";
import { describePayload } from "@/lib/requestForms";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, REQUEST_STATUS_OPTIONS } from "@/lib/requestTypes";
import styles from "./RequestsBoard.module.css";

const STATUS_CLASS: Record<string, string> = { PENDING: "sPending", IN_PROGRESS: "sProgress", DONE: "sDone" };

function initials(name?: string) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export function RequestsBoard({
  requests,
  onStatus,
  onDelete,
  onRetry,
  emptyText = "Заявок пока нет",
}: {
  requests: RequestItem[];
  onStatus: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  /** Создать задачу в Битриксе заново (только для HR) */
  onRetry?: (id: string) => void;
  emptyText?: string;
}) {
  const [filter, setFilter] = useState("ALL");
  // Выполненные заявки старше нескольких месяцев уходят в архив и видны только на своей вкладке
  const active = requests.filter((r) => !r.archivedAt);
  const archived = requests.filter((r) => r.archivedAt);
  const count = (s: string) => active.filter((r) => r.status === s).length;
  const shown = filter === "ARCHIVE" ? archived : filter === "ALL" ? active : active.filter((r) => r.status === filter);

  const tabs = [
    { value: "ALL", label: "Все", n: active.length },
    ...REQUEST_STATUS_OPTIONS.map((o) => ({ ...o, n: count(o.value) })),
    { value: "ARCHIVE", label: "Архив", n: archived.length },
  ];

  return (
    <div>
      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={filter === t.value}
            className={`${styles.tab} ${filter === t.value ? styles.tabActive : ""}`}
            onClick={() => setFilter(t.value)}
          >
            {t.label} <span className={styles.tabCount}>{t.n}</span>
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {shown.map((r) => (
          <div key={r.id} className={styles.card}>
            <div className={styles.top}>
              <span className={styles.avatar}>{initials(r.user?.fullName)}</span>
              <div className={styles.who}>
                <div className={styles.name} title={r.user?.fullName}>{r.user?.fullName ?? "—"}</div>
                <div className={styles.sub}>
                  {[r.user?.department, new Date(r.requestedAt).toLocaleDateString("ru-RU")].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>

            <div className={styles.tags}>
              <span className={styles.type}>{REQUEST_TYPE_LABELS[r.type] ?? r.type}</span>
              <span className={`${styles.status} ${styles[STATUS_CLASS[r.status] ?? "sPending"]}`}>
                {REQUEST_STATUS_LABELS[r.status] ?? r.status}
              </span>
            </div>

            {describePayload(r.type, r.payload).length > 0 ? (
              <dl className={styles.fields}>
                {describePayload(r.type, r.payload).map((f) => (
                  <div key={f.label} className={styles.fieldRow}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={styles.desc}>Без описания</p>
            )}

            <div className={styles.files}>
              {(r.files ?? []).slice(0, 2).map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className={styles.file} title={f.name}>
                  <FileTypeIcon name={f.name || f.url} size={28} />
                  <span className={styles.fileName}>{f.name || "Файл"}</span>
                </a>
              ))}
              {(r.files?.length ?? 0) > 2 && <span className={styles.more}>+{(r.files?.length ?? 0) - 2}</span>}
              {(r.files?.length ?? 0) === 0 && <span className={styles.noFiles}>Без файлов</span>}
            </div>

            {onRetry && (
              <div className={styles.bitrix}>
                {r.bitrixTaskId ? (
                  <span>Задача в Битриксе №{r.bitrixTaskId}</span>
                ) : (
                  <>
                    <span className={styles.bitrixWarn} title={r.bitrixError || undefined}>
                      Задача в Битриксе не создана{r.bitrixError ? `: ${r.bitrixError}` : ""}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => onRetry(r.id)}>Создать задачу</Button>
                  </>
                )}
              </div>
            )}

            <div className={styles.controls}>
              <Select
                size="sm"
                value={r.status}
                onChange={(v) => onStatus(r.id, v)}
                options={REQUEST_STATUS_OPTIONS}
                ariaLabel="Статус заявки"
                className={styles.select}
              />
              {onDelete && (
                <Button size="sm" variant="danger" onClick={() => onDelete(r.id)}>Удалить</Button>
              )}
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className={styles.empty}>{emptyText}</p>}
      </div>
    </div>
  );
}
