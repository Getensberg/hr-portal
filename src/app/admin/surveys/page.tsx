"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAdminSurveysQuery, useCreateSurveyMutation, useGetSurveyResultsQuery, useDeleteSurveyMutation } from "@/store/api";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";
import { PageShell } from "@/components/PageShell";
import { Select } from "@/components/Select";
import { FormError } from "@/components/FormError";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/Button";
import styles from "./surveys-admin.module.css";

const QUESTION_TYPES = [
  { value: "SCALE_1_5", label: "Шкала 1–5" },
  { value: "YES_NO", label: "Да/Нет" },
  { value: "TEXT", label: "Текст" },
];

export default function AdminSurveysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: surveys } = useGetAdminSurveysQuery();
  const [createSurvey] = useCreateSurveyMutation();

  const [title, setTitle] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSuggestionBox, setIsSuggestionBox] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState([{ text: "", type: "SCALE_1_5" }]);
  const [resultsOpenId, setResultsOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteSurvey] = useDeleteSurveyMutation();

  function handleDelete(id: string) {
    if (confirm("Удалить опрос вместе со всеми ответами без возможности восстановления?")) {
      deleteSurvey(id);
    }
  }

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  function addQuestion() {
    setQuestions([...questions, { text: "", type: "SCALE_1_5" }]);
  }
  function removeQuestion(i: number) {
    setQuestions(questions.filter((_, idx) => idx !== i));
  }
  function updateQuestion(i: number, field: "text" | "type", value: string) {
    const copy = [...questions];
    copy[i] = { ...copy[i], [field]: value };
    setQuestions(copy);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const startIso = startDate ? parseRuDate(startDate) : null;
    if (startDate && !startIso) return setError("Дата начала в формате дд.мм.гггг");
    const endIso = endDate ? parseRuDate(endDate) : null;
    if (endDate && !endIso) return setError("Дата конца в формате дд.мм.гггг");
    if (!title.trim()) return setError("Укажите название опроса");
    if (!isSuggestionBox && questions.some((q) => !q.text.trim())) {
      return setError("Заполните текст всех вопросов");
    }

    const finalQuestions = isSuggestionBox ? [{ text: "Ваше предложение", type: "TEXT" }] : questions;

    try {
      await createSurvey({
        title,
        frequency: "ONCE",
        isAnonymous,
        isSuggestionBox,
        // Пустая дата начала: опрос стартует сразу
        startDate: startIso ?? undefined,
        endDate: endIso ?? undefined,
        questions: finalQuestions,
      }).unwrap();
      setSuccess("Опрос создан");
      setTitle("");
      setStartDate("");
      setEndDate("");
      setQuestions([{ text: "", type: "SCALE_1_5" }]);
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось создать опрос"));
    }
  }

  return (
    <PageShell title="Управление опросами" wide>
      <div className={styles.layout}>
        <form onSubmit={handleSubmit} className={styles.panel}>
          <h2 className={styles.panelTitle}>Новый опрос</h2>

          <label className={styles.field}>
            <span className={styles.label}>Название</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, вовлечённость команды" />
          </label>

          <div className={styles.toggles}>
            <button type="button" className={`${styles.toggle} ${isAnonymous ? styles.toggleOn : ""}`} aria-pressed={isAnonymous} onClick={() => setIsAnonymous(!isAnonymous)}>
              <span className={styles.check}>{isAnonymous ? "✓" : ""}</span> Анонимный
            </button>
            <button type="button" className={`${styles.toggle} ${isSuggestionBox ? styles.toggleOn : ""}`} aria-pressed={isSuggestionBox} onClick={() => setIsSuggestionBox(!isSuggestionBox)}>
              <span className={styles.check}>{isSuggestionBox ? "✓" : ""}</span> Ящик предложений
            </button>
          </div>

          <div className={styles.dates}>
            <label className={styles.field}>
              <span className={styles.label}>Начало</span>
              <input className="input" inputMode="numeric" value={startDate} onChange={(e) => setStartDate(autoFormatRuDate(e.target.value))} placeholder="по умолчанию сегодня" maxLength={10} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Конец</span>
              <input className="input" inputMode="numeric" value={endDate} onChange={(e) => setEndDate(autoFormatRuDate(e.target.value))} placeholder="необязательно" maxLength={10} />
            </label>
          </div>

          {!isSuggestionBox ? (
            <div className={styles.questions}>
              <span className={styles.label}>Вопросы</span>
              {questions.map((q, i) => (
                <div key={i} className={styles.qCard}>
                  <span className={styles.qNum}>{i + 1}</span>
                  <div className={styles.qFields}>
                    <input className="input" value={q.text} onChange={(e) => updateQuestion(i, "text", e.target.value)} placeholder="Текст вопроса" />
                    <Select value={q.type} onChange={(v) => updateQuestion(i, "type", v)} options={QUESTION_TYPES} ariaLabel="Тип вопроса" />
                  </div>
                  {questions.length > 1 && (
                    <button type="button" className={styles.remove} onClick={() => removeQuestion(i)} aria-label="Удалить вопрос">×</button>
                  )}
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addQuestion}>+ Добавить вопрос</Button>
            </div>
          ) : (
            <p className={styles.note}>В ящике предложений будет один свободный вопрос «Ваше предложение».</p>
          )}

          <FormError message={error || null} />
          {success && <p className={styles.success}>{success}</p>}
          <Button type="submit">Создать опрос</Button>
        </form>

        <div>
          <h2 className={styles.listTitle}>Опросы <span className={styles.count}>{surveys?.length ?? 0}</span></h2>
          {surveys?.length === 0 && <p className={styles.empty}>Опросов пока нет</p>}
          {surveys?.map((s) => (
            <div key={s.id} className={styles.item}>
              <div className={styles.itemHead}>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>{s.title}</div>
                  <div className={styles.chips}>
                    <span className={`${styles.chip} ${styles.chipLilac}`}>Прошли: {s.completionsCount ?? 0}</span>
                    {s.isAnonymous && <span className={`${styles.chip} ${styles.chipMint}`}>Анонимный</span>}
                    {s.isSuggestionBox && <span className={`${styles.chip} ${styles.chipPeach}`}>Ящик предложений</span>}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <Button size="sm" variant="secondary" onClick={() => setResultsOpenId(resultsOpenId === s.id ? null : s.id)}>
                    {resultsOpenId === s.id ? "Скрыть" : "Результаты"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>Удалить</Button>
                </div>
              </div>
              {resultsOpenId === s.id && <SurveyResults surveyId={s.id} />}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function SurveyResults({ surveyId }: { surveyId: string }) {
  const { data, isLoading } = useGetSurveyResultsQuery(surveyId);
  if (isLoading) return <p className={styles.empty}>Загрузка результатов...</p>;
  if (!data) return null;

  return (
    <div className={styles.results}>
      {data.questions.map((q, idx) => {
        const yes = q.counts?.yes ?? 0;
        const no = q.counts?.no ?? 0;
        const total = yes + no;
        return (
          <div key={q.id} className={styles.res}>
            <div className={styles.resText}><span className={styles.qNumSm}>{idx + 1}</span>{q.text}</div>
            {q.type === "SCALE_1_5" && (
              q.average != null ? (
                <div className={styles.avgRow}>
                  <div className={styles.avgBar}><div className={styles.avgFill} style={{ width: `${(q.average / 5) * 100}%` }} /></div>
                  <span className={styles.avgValue}>{q.average.toFixed(2)} <span className={styles.of}>из 5</span></span>
                </div>
              ) : <p className={styles.muted}>Нет данных</p>
            )}
            {q.type === "YES_NO" && (
              total > 0 ? (
                <div>
                  <div className={styles.ynBar}>
                    <div className={styles.ynYes} style={{ width: `${(yes / total) * 100}%` }} />
                  </div>
                  <div className={styles.ynLegend}><span>Да: {yes}</span><span>Нет: {no}</span></div>
                </div>
              ) : <p className={styles.muted}>Нет данных</p>
            )}
            {q.type === "TEXT" && (
              <div className={styles.texts}>
                {q.texts?.map((t, i) => <div key={i} className={styles.textAns}>{t}</div>)}
                {(q.texts?.length ?? 0) === 0 && <p className={styles.muted}>Пока нет ответов</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
