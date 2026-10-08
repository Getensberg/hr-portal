"use client";
import { useState } from "react";
import {
  useGetAdminTestQuery,
  useUpdateTestMutation,
  useDeleteTestMutation,
  useAddQuestionMutation,
  useDeleteQuestionMutation,
  useGrantTestAccessMutation,
  useRevokeTestAccessMutation,
  useGetUsersQuery,
  type TestDetail,
} from "@/store/api";
import { Button } from "./Button";
import { QuestionEditForm } from "./QuestionEditForm";
import styles from "./TestEditor.module.css";


function AccessBlock({ test }: { test: TestDetail }) {
  const { data: users } = useGetUsersQuery();
  const [grant] = useGrantTestAccessMutation();
  const [revoke] = useRevokeTestAccessMutation();
  const [userId, setUserId] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const grantedIds = new Set(test.access.map((a) => a.user.id));
  const available = (users ?? []).filter((u) => !grantedIds.has(u.id));
  const departments = Array.from(
    new Set((users ?? []).map((u) => u.department).filter((d): d is string => Boolean(d)))
  ).sort();

  async function grantUser() {
    if (!userId) return;
    setError("");
    setMessage("");
    try {
      await grant({ testId: test.id, userIds: [userId] }).unwrap();
      setUserId("");
      setMessage("Доступ выдан");
    } catch (err: any) {
      setError(err?.data?.error || `Не удалось выдать доступ (код ${err?.status ?? "?"})`);
    }
  }

  async function grantDepartment() {
    if (!department) return;
    setError("");
    setMessage("");
    try {
      const res = await grant({ testId: test.id, department }).unwrap();
      setMessage(res.granted > 0 ? `Новых доступов: ${res.granted}` : "У всех сотрудников отдела доступ уже был");
    } catch (err: any) {
      setError(err?.data?.error || `Не удалось выдать доступ (код ${err?.status ?? "?"})`);
    }
  }

  return (
    <>
      <h3 className={`${styles.subtitle} text-h4`}>Доступ</h3>
      <p className={styles.hint}>Тест виден только тем, кому выдан доступ.</p>
      <div className={styles.form} style={{ marginTop: 12 }}>
        <div className={styles.formRow}>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Выбрать сотрудника</option>
            {available.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
          <div><Button type="button" variant="secondary" onClick={grantUser}>Выдать доступ</Button></div>
        </div>
        <div className={styles.formRow}>
          <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Выбрать отдел</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div><Button type="button" variant="secondary" onClick={grantDepartment}>Выдать всему отделу</Button></div>
        </div>
        {message && <p className={styles.ok}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {test.access.map((a) => (
        <div key={a.id} className={styles.row}>
          <span className="text-s">{a.user.fullName}{a.user.department ? ` · ${a.user.department}` : ""}</span>
          <Button size="sm" variant="danger" onClick={() => revoke({ testId: test.id, userId: a.user.id })}>Отозвать</Button>
        </div>
      ))}
      {test.access.length === 0 && <p className="text-s">Доступ пока никому не выдан</p>}
    </>
  );
}

function TestForm({ test, onDeleted }: { test: TestDetail; onDeleted?: () => void }) {
  const standalone = test.courseId === null;
  const [updateTest] = useUpdateTestMutation();
  const [deleteTest] = useDeleteTestMutation();
  const [addQuestion] = useAddQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const [title, setTitle] = useState(test.title);
  const [description, setDescription] = useState(test.description ?? "");
  const [category, setCategory] = useState(test.category ?? "");
  const [accessMode, setAccessMode] = useState<"OPEN" | "RESTRICTED">(test.accessMode);
  const [passingScore, setPassingScore] = useState(test.passingScore);
  const [maxAttempts, setMaxAttempts] = useState(test.maxAttempts);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const [qText, setQText] = useState("");
  const [kind, setKind] = useState<"CHOICE" | "OPEN">("CHOICE");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [qError, setQError] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const attempts = test.attemptsCount;

  async function saveSettings() {
    try {
      await updateTest({
        id: test.id,
        title,
        description,
        passingScore,
        maxAttempts,
        ...(standalone ? { category, accessMode } : {}),
      }).unwrap();
      setMessage({ text: "Сохранено", error: false });
    } catch (err: any) {
      setMessage({ text: err?.data?.error || "Не удалось сохранить", error: true });
    }
  }

  async function toggleStatus() {
    try {
      await updateTest({ id: test.id, status: test.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }).unwrap();
      setMessage(null);
    } catch (err: any) {
      setMessage({ text: err?.data?.error || "Не удалось изменить статус", error: true });
    }
  }

  async function handleDeleteTest() {
    if (!confirm(`Удалить тест «${test.title}» вместе со всеми вопросами?`)) return;
    try {
      await deleteTest(test.id).unwrap();
      onDeleted?.();
    } catch (err: any) {
      setMessage({ text: err?.data?.error || "Не удалось удалить тест", error: true });
    }
  }

  function updateOption(i: number, patch: Partial<{ text: string; isCorrect: boolean }>) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    setQError("");
    try {
      await addQuestion({ testId: test.id, text: qText, kind, options }).unwrap();
      setQText("");
      setOptions([{ text: "", isCorrect: false }, { text: "", isCorrect: false }]);
    } catch (err: any) {
      setQError(err?.data?.error || "Не удалось добавить вопрос");
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("Удалить этот вопрос?")) return;
    try {
      await deleteQuestion(id).unwrap();
    } catch (err: any) {
      setQError(err?.data?.error || "Не удалось удалить вопрос");
    }
  }

  return (
    <div className={styles.block}>
      {standalone && (
        <div className={styles.statusRow}>
          <span className={`${styles.badge} ${test.status === "PUBLISHED" ? styles.published : styles.draft}`}>
            {test.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
          </span>
          <Button size="sm" variant={test.status === "PUBLISHED" ? "secondary" : "primary"} onClick={toggleStatus}>
            {test.status === "PUBLISHED" ? "Снять с публикации" : "Опубликовать"}
          </Button>
        </div>
      )}

      {attempts > 0 && (
        <p className={styles.notice}>
          Тест уже проходили (попыток: {attempts}). Вопросы менять нельзя, чтобы не исказить результаты. Настройки можно менять.
        </p>
      )}

      <div className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название теста" />
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Описание (необязательно)" />
        {standalone && (
          <div className={styles.formRow}>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Направление" />
            <select className="input" value={accessMode} onChange={(e) => setAccessMode(e.target.value as "OPEN" | "RESTRICTED")}>
              <option value="OPEN">Открыт всем сотрудникам</option>
              <option value="RESTRICTED">Доступ выдаёт HR</option>
            </select>
          </div>
        )}
        <div className={styles.formRow}>
          <div className={styles.numberField}>
            <label className="text-xs">Проходной балл, %</label>
            <input className="input" type="number" min={1} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
          </div>
          <div className={styles.numberField}>
            <label className="text-xs">Максимум попыток</label>
            <input className="input" type="number" min={1} max={20} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
          </div>
        </div>
        {!standalone && <p className={styles.hint}>Видимость и доступ к этому тесту определяет курс.</p>}
        {message && <p className={message.error ? styles.error : styles.ok}>{message.text}</p>}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={saveSettings}>Сохранить настройки</Button>
          <Button type="button" size="sm" variant="danger" onClick={handleDeleteTest}>Удалить тест</Button>
        </div>
      </div>

      <h3 className={`${styles.subtitle} text-h4`}>Вопросы</h3>
      {test.questions.map((q, i) =>
        editingQuestionId === q.id ? (
          <QuestionEditForm
            key={q.id}
            question={q}
            onDone={() => setEditingQuestionId(null)}
          />
        ) : (
          <div key={q.id} className={styles.question}>
            <div className={styles.questionHead}>
              <span className="text-s">
                <strong>{i + 1}. {q.text}</strong>{" "}
                <span className="text-xs">{q.kind === "OPEN" ? "· свободный ответ, проверяет HR" : "· выбор ответа"}</span>
              </span>
              {attempts === 0 && (
                <div className={styles.actions}>
                  <Button size="sm" variant="secondary" onClick={() => setEditingQuestionId(q.id)}>Изменить</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteQuestion(q.id)}>Удалить</Button>
                </div>
              )}
            </div>
            {q.kind === "CHOICE" && (
              <ul className={styles.options}>
                {q.options.map((o) => (
                  <li key={o.id} className={o.isCorrect ? styles.correct : ""}>
                    {o.isCorrect ? "✓ " : "○ "}{o.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      )}
      {test.questions.length === 0 && <p className="text-s">Вопросов пока нет</p>}

      {attempts === 0 && (
        <>
          <h3 className={`${styles.subtitle} text-h4`}>Новый вопрос</h3>
          <form onSubmit={submitQuestion} className={styles.form}>
            <textarea className="textarea" value={qText} onChange={(e) => setQText(e.target.value)} rows={2} placeholder="Текст вопроса" />
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as "CHOICE" | "OPEN")}>
              <option value="CHOICE">Выбор ответа (проверяется автоматически)</option>
              <option value="OPEN">Свободный ответ (проверяет HR)</option>
            </select>

            {kind === "CHOICE" && (
              <>
                {options.map((o, i) => (
                  <div key={i} className={styles.optionRow}>
                    <input className="input" value={o.text} onChange={(e) => updateOption(i, { text: e.target.value })} placeholder={`Вариант ${i + 1}`} />
                    <label className={styles.check}>
                      <input type="checkbox" checked={o.isCorrect} onChange={(e) => updateOption(i, { isCorrect: e.target.checked })} />
                      верный
                    </label>
                    {options.length > 2 && (
                      <Button type="button" size="sm" variant="secondary" onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}>
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setOptions((prev) => [...prev, { text: "", isCorrect: false }])}>
                    + Добавить вариант
                  </Button>
                </div>
                <p className={styles.hint}>Верных ответов может быть несколько. Вопрос засчитывается, только если выбраны ровно все верные.</p>
              </>
            )}

            {qError && <p className={styles.error}>{qError}</p>}
            <div><Button type="submit">Добавить вопрос</Button></div>
          </form>
        </>
      )}
      {attempts > 0 && qError && <p className={styles.error}>{qError}</p>}

      {standalone && test.accessMode === "RESTRICTED" && <AccessBlock test={test} />}
    </div>
  );
}

export function TestEditor({ testId, onDeleted }: { testId: string; onDeleted?: () => void }) {
  const { data: test, isLoading } = useGetAdminTestQuery(testId);
  if (isLoading) return <p className="text-s">Загрузка...</p>;
  if (!test) return <p className="text-s">Тест не найден</p>;
  return <TestForm key={test.id} test={test} onDeleted={onDeleted} />;
}