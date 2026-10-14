"use client";
import { useState } from "react";
import { useGetMyRequestsQuery, useCreateRequestMutation, useUploadFileMutation, useGetRequestTemplatesQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { AttachButton } from "@/components/AttachButton";
import { StatusBadge } from "@/components/StatusBadge";
import styles from "./requests.module.css";
import { getErrorMessage } from "@/lib/errors";
import { FormError } from "@/components/FormError";

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "Справка",
  LEAVE: "Отпуск/отгул",
  BUSINESS_TRIP: "Командировка",
  EQUIPMENT: "Техника",
  ACCESS: "Доступ",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function RequestsPage() {
  const { data: requests, isLoading } = useGetMyRequestsQuery();
  const [createRequest, { isLoading: creating }] = useCreateRequestMutation();
  const [uploadFile] = useUploadFileMutation();
  const { data: templates } = useGetRequestTemplatesQuery();
  const [type, setType] = useState("DOCUMENT");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const template = templates?.find((t) => t.requestType === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
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

    await createRequest({ type: type as any, payload: { description }, files: uploadedFiles }).unwrap();
    setDescription("");
    setFiles([]);
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось отправить заявку"));
    }
  }

  return (
    <PageShell title="Мои заявки">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Select value={type} onChange={setType} options={TYPE_OPTIONS} ariaLabel="Тип заявки" />
        {template && (
          <div className={styles.template}>
            <span className={styles.templateText}>
              Для этой заявки есть бланк: скачайте, заполните и прикрепите к заявке.
            </span>
            <a href={template.fileUrl} target="_blank" rel="noopener noreferrer" download className={styles.templateLink}>
              Скачать шаблон
            </a>
          </div>
        )}
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Детали заявки (например, даты отпуска)"
          rows={3}
        />
        <FormError message={error} />
        <div className={styles.formActions}>
          <AttachButton files={files} onChange={setFiles} label="Прикрепить" />
          <Button type="submit" disabled={creating} className={styles.submit}>Отправить заявку</Button>
        </div>
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