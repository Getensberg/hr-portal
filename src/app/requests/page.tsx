"use client";
import { useState } from "react";
import { useGetMyRequestsQuery, useCreateRequestMutation, useUploadFileMutation } from "@/store/api";
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
  const [uploadFile] = useUploadFileMutation();
  const [type, setType] = useState("DOCUMENT");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let uploadedFiles: { url: string; name: string }[] | undefined;
    if (files && files.length > 0) {
      uploadedFiles = [];
      for (const f of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", f);
        const uploaded = await uploadFile(formData).unwrap();
        uploadedFiles.push({ url: uploaded.url, name: uploaded.name });
      }
    }

    await createRequest({ type: type as any, payload: { description }, files: uploadedFiles });
    setDescription("");
    setFiles(null);
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
        <div>
          <label className="text-xs">Приложить документы (необязательно)</label>
          <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
        </div>
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
          {r.files && r.files.length > 0 && (
            <div className={styles.filesRow}>
              {r.files.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">📎 {f.name}</a>
              ))}
            </div>
          )}
        </Card>
      ))}
      {requests?.length === 0 && <p className="text-s">Пока нет заявок</p>}
    </PageShell>
  );
}