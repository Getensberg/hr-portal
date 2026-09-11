"use client";
import { useState } from "react";
import { useGetMyRequestsQuery, useCreateRequestMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import styles from "./requests.module.css";

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "Справка",
  LEAVE: "Отпуск/отгул",
  BUSINESS_TRIP: "Командировка",
  EQUIPMENT: "Техника",
  ACCESS: "Доступ",
};

export default function RequestsPage() {
  const { data: requests, isLoading } = useGetMyRequestsQuery();
  const [createRequest, { isLoading: creating }] = useCreateRequestMutation();
  const [type, setType] = useState("DOCUMENT");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createRequest({ type: type as any, payload: { description } });
    setDescription("");
  }

  return (
    <PageShell title="Мои заявки">
      <form onSubmit={handleSubmit} className={styles.form}>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Детали заявки (например, даты отпуска)"
          rows={3}
        />
        <Button type="submit" disabled={creating}>Отправить заявку</Button>
      </form>

      <h2 className="text-h2">История</h2>
      {isLoading && <p className="text-s">Загрузка...</p>}
      {requests?.map((r) => (
        <Card key={r.id}>
          <div className={styles.historyRow}>
            <span className="text-s">
              <strong>{TYPE_LABELS[r.type]}</strong>
              {r.payload?.description ? ` — ${r.payload.description}` : ""}
            </span>
            <StatusBadge status={r.status} />
          </div>
        </Card>
      ))}
      {requests?.length === 0 && <p className="text-s">Пока нет заявок</p>}
    </PageShell>
  );
}