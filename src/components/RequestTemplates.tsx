"use client";
import { useState } from "react";
import {
  useGetRequestTemplatesQuery,
  useSaveRequestTemplateMutation,
  useDeleteRequestTemplateMutation,
  useUploadFileMutation,
} from "@/store/api";
import { AttachButton } from "@/components/AttachButton";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { REQUEST_TYPE_LABELS } from "@/lib/requestTypes";
import { getErrorMessage } from "@/lib/errors";
import styles from "./RequestTemplates.module.css";

// Для HR: к каждому типу заявки можно прикрепить шаблон заявления, сотрудник скачает его при подаче заявки
export function RequestTemplates() {
  const { data: templates } = useGetRequestTemplatesQuery();
  const [uploadFile] = useUploadFileMutation();
  const [saveTemplate] = useSaveRequestTemplateMutation();
  const [deleteTemplate] = useDeleteRequestTemplateMutation();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handlePick(type: string, files: File[]) {
    const file = files[0];
    if (!file) return;
    setError("");
    setBusy(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await uploadFile(formData).unwrap();
      await saveTemplate({ requestType: type, title: uploaded.name, fileUrl: uploaded.url }).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось загрузить шаблон"));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(type: string) {
    if (!confirm("Убрать шаблон? Сотрудники перестанут видеть его в заявке.")) return;
    setError("");
    try {
      await deleteTemplate(type).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось удалить шаблон"));
    }
  }

  return (
    <details className={styles.box}>
      <summary className={styles.summary}>
        Шаблоны заявлений
        <span className={styles.count}>{templates?.length ?? 0}</span>
      </summary>
      <p className={styles.hint}>
        Прикрепите готовый бланк (Word или PDF): когда сотрудник выберет этот тип заявки, он увидит кнопку «Скачать шаблон»,
        заполнит его и приложит к заявке.
      </p>
      <FormError message={error || null} />
      <ul className={styles.list}>
        {Object.entries(REQUEST_TYPE_LABELS).map(([type, label]) => {
          const tpl = templates?.find((t) => t.requestType === type);
          return (
            <li key={type} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.type}>{label}</span>
                {tpl ? (
                  <a href={tpl.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.file}>{tpl.title}</a>
                ) : (
                  <span className={styles.empty}>Шаблон не загружен</span>
                )}
              </div>
              <div className={styles.actions}>
                <AttachButton
                  files={[]}
                  multiple={false}
                  accept=".doc,.docx,.pdf,.odt,.xls,.xlsx"
                  label={busy === type ? "Загрузка..." : tpl ? "Заменить" : "Загрузить"}
                  onChange={(f) => handlePick(type, f)}
                />
                {tpl && <Button size="sm" variant="danger" onClick={() => handleDelete(type)}>Убрать</Button>}
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
