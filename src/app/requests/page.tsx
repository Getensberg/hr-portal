"use client";
import { useState } from "react";
import { useGetMyRequestsQuery, useCreateRequestMutation } from "@/store/api";

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "Справка",
  LEAVE: "Отпуск/отгул",
  BUSINESS_TRIP: "Командировка",
  EQUIPMENT: "Техника",
  ACCESS: "Доступ",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "На рассмотрении",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
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
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Мои заявки</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Детали заявки (например, даты отпуска)"
          rows={3}
          style={{ width: "100%", marginTop: 8 }}
        />
        <button type="submit" disabled={creating} style={{ marginTop: 8 }}>
          Отправить заявку
        </button>
      </form>

      <h2>История</h2>
      {isLoading && <p>Загрузка...</p>}
      <ul>
        {requests?.map((r) => (
          <li key={r.id}>
            <strong>{TYPE_LABELS[r.type]}</strong> — {STATUS_LABELS[r.status]}
            {r.payload?.description ? ` — ${r.payload.description}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}