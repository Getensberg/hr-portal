"use client";
import { useState } from "react";
import { useUpdateTestQuestionMutation } from "@/store/api";
import { Button } from "./Button";
import styles from "./QuestionEditForm.module.css";

export interface EditableQuestion {
  id: string;
  text: string;
  kind: "CHOICE" | "OPEN";
  options: { id: string; text: string; isCorrect: boolean }[];
}

export function QuestionEditForm({ question, onDone }: { question: EditableQuestion; onDone: () => void }) {
  const [update, { isLoading }] = useUpdateTestQuestionMutation();
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState(
    question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
  );
  const [error, setError] = useState("");

  function setOption(i: number, patch: Partial<{ text: string; isCorrect: boolean }>) {
    setOptions((list) => list.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!text.trim()) return setError("Введите текст вопроса");
    if (question.kind === "CHOICE") {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) return setError("Нужно минимум два варианта ответа");
      if (!filled.some((o) => o.isCorrect)) return setError("Отметьте хотя бы один верный вариант");
    }
    try {
      await update({
        questionId: question.id,
        text,
        ...(question.kind === "CHOICE" ? { options } : {}),
      }).unwrap();
      onDone();
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось сохранить вопрос");
    }
  }

  return (
    <form className={styles.form} onSubmit={save}>
      <textarea className="textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Текст вопроса" />

      {question.kind === "CHOICE" && (
        <>
          {options.map((o, i) => (
            <div key={i} className={styles.optionRow}>
              <input className="input" value={o.text} onChange={(e) => setOption(i, { text: e.target.value })} placeholder={`Вариант ${i + 1}`} />
              <label className={styles.correct}>
                <input type="checkbox" checked={o.isCorrect} onChange={(e) => setOption(i, { isCorrect: e.target.checked })} />
                Верный
              </label>
              <Button type="button" size="sm" variant="danger" disabled={options.length <= 2} onClick={() => setOptions((l) => l.filter((_, idx) => idx !== i))}>
                ×
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" size="sm" variant="secondary" onClick={() => setOptions((l) => [...l, { text: "", isCorrect: false }])}>
              + Вариант
            </Button>
          </div>
        </>
      )}

      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={isLoading}>Сохранить</Button>
        <Button type="button" variant="secondary" onClick={onDone}>Отмена</Button>
      </div>
    </form>
  );
}