"use client";
import { useRef } from "react";
import styles from "./AttachButton.module.css";

type AttachButtonProps = {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
  multiple?: boolean;
  accept?: string;
};

// Кнопка-скрепка: добавляет файлы, выбранные файлы показываются плашками с крестиком
export function AttachButton({ files, onChange, label = "Прикрепить файл", multiple = true, accept }: AttachButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // чтобы тот же файл можно было выбрать снова после удаления
    if (picked.length === 0) return;
    const next = multiple ? [...files] : [];
    for (const f of picked) {
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    onChange(next);
  }

  return (
    <div className={styles.wrap}>
      <input ref={inputRef} type="file" multiple={multiple} accept={accept} onChange={onPick} className={styles.hidden} tabIndex={-1} />
      <button type="button" className={styles.btn} onClick={() => inputRef.current?.click()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.9-8.9a3.7 3.7 0 0 1 5.2 5.2l-8.9 8.9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2" />
        </svg>
        <span>{label}</span>
      </button>

      {files.length > 0 && (
        <ul className={styles.chips}>
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className={styles.chip}>
              <span className={styles.chipName}>{f.name}</span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                aria-label={`Убрать файл ${f.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
