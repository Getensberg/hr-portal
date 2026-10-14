"use client";
import { useState } from "react";
import type { RequestItem } from "@/store/api";
import { Select } from "./Select";
import { Button } from "./Button";
import { FileTypeIcon } from "./FileTypeIcon";
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
  emptyText = "Заявок пока нет",
}: {
  requests: RequestItem[];
  onStatus: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  emptyText?: string;
}) {
  const [filter, setFilter] = useState("ALL");
  const count = (s: string) => requests.filter((r) => r.status === s).length;
  const shown = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  const tabs = [
    { value: "ALL", label: "Все", n: requests.length },
    ...REQUEST_STATUS_OPTIONS.map((o) => ({ ...o, n: count(o.value) })),
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

            <p className={styles.desc} title={r.payload?.description || undefined}>
              {r.payload?.description || "Без описания"}
            </p>

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
