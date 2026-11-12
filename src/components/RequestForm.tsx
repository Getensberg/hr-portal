"use client";
import { useMemo, useState } from "react";
import { useCreateRequestMutation, useUploadFileMutation, useGetRequestTemplatesQuery } from "@/store/api";
import { Select } from "@/components/Select";
import { AttachButton } from "@/components/AttachButton";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { REQUEST_TYPE_LABELS } from "@/lib/requestTypes";
import { REQUEST_FORMS, emptyPayload, visibleFields } from "@/lib/requestForms";
import { countDays, parseISODate } from "@/lib/vacation";
import { getErrorMessage } from "@/lib/errors";
import styles from "./RequestForm.module.css";

const TYPE_OPTIONS = Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }));

type Props = {
  initialType?: string;
  initialValues?: Record<string, string>;
  onDone: () => void;
};

// Форма заявки: набор полей зависит от выбранного типа
export function RequestForm({ initialType = "DOCUMENT", initialValues, onDone }: Props) {
  const [createRequest, { isLoading: creating }] = useCreateRequestMutation();
  const [uploadFile] = useUploadFileMutation();
  const { data: templates } = useGetRequestTemplatesQuery();
  const [type, setType] = useState(initialType);
  const [values, setValues] = useState<Record<string, string>>({ ...emptyPayload(initialType), ...initialValues });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const form = REQUEST_FORMS[type];
  const fields = visibleFields(type, values);
  const template = templates?.find((t) => t.requestType === type);

  const days = useMemo(() => {
    const s = parseISODate(values.startDate ?? "");
    const e = parseISODate(values.endDate || values.startDate || "");
    return s && e && s <= e ? countDays(s, e) : null;
  }, [values.startDate, values.endDate]);

  function changeType(next: string) {
    setType(next);
    setValues(emptyPayload(next));
    setError("");
  }

  function setField(key: string, value: string) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      // Если «последний день» стал раньше «первого», подтягиваем его
      if (key === "startDate" && next.endDate && next.endDate < value) next.endDate = value;
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const payload: Record<string, string | number> = {};
      for (const f of fields) {
        const v = values[f.key];
        if (v === "" || v === undefined) continue;
        payload[f.key] = f.kind === "number" ? Number(v) : v;
      }
      let uploaded: { url: string; name: string }[] | undefined;
      if (files.length > 0) {
        uploaded = [];
        for (const f of files) {
          const fd = new FormData();
          fd.append("file", f);
          const res = await uploadFile(fd).unwrap();
          uploaded.push({ url: res.url, name: res.name });
        }
      }
      await createRequest({ type: type as never, payload, files: uploaded }).unwrap();
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось отправить заявку"));
    }
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Тип заявки</span>
        <Select value={type} onChange={changeType} options={TYPE_OPTIONS} ariaLabel="Тип заявки" />
      </label>

      {form?.hint && <p className={styles.hint}>{form.hint}</p>}

      {template && (
        <div className={styles.template}>
          <span className={styles.templateText}>Для этой заявки есть бланк: скачайте, заполните и прикрепите.</span>
          <a href={template.fileUrl} target="_blank" rel="noopener noreferrer" download className={styles.templateLink}>Скачать шаблон</a>
        </div>
      )}

      {fields.map((f) => (
        <label key={f.key} className={styles.field}>
          <span className={styles.label}>
            {f.label}
            {f.required ? <span className={styles.req}> *</span> : null}
          </span>
          {f.kind === "select" && (
            <Select value={values[f.key] ?? ""} onChange={(v) => setField(f.key, v)} options={f.options ?? []} ariaLabel={f.label} />
          )}
          {f.kind === "textarea" && (
            <textarea className="textarea" rows={3} maxLength={f.max} value={values[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
          )}
          {(f.kind === "text" || f.kind === "number" || f.kind === "date") && (
            <input
              className="input"
              type={f.kind === "date" ? "date" : f.kind === "number" ? "number" : "text"}
              min={f.kind === "number" ? f.min : f.key === "endDate" ? values.startDate || undefined : undefined}
              max={f.kind === "number" ? f.max : undefined}
              maxLength={f.kind === "text" ? f.max : undefined}
              value={values[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setField(f.key, e.target.value)}
            />
          )}
        </label>
      ))}

      {days !== null && <p className={styles.days}>Календарных дней в периоде: <strong>{days}</strong></p>}

      <FormError message={error} />
      <div className={styles.actions}>
        <AttachButton files={files} onChange={setFiles} label="Прикрепить" />
        <Button type="submit" disabled={creating} className={styles.submit}>Отправить заявку</Button>
      </div>
    </form>
  );
}
