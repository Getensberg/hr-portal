"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAdminSurveysQuery, useCreateSurveyMutation, useGetSurveyResultsQuery, useDeleteSurveyMutation } from "@/store/api";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./surveys-admin.module.css";

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
  function updateQuestion(i: number, field: "text" | "type", value: string) {
    const copy = [...questions];
    copy[i] = { ...copy[i], [field]: value };
    setQuestions(copy);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startIso = startDate ? parseRuDate(startDate) : null;
    if (startDate && !startIso) return alert("Дата начала в формате дд.мм.гггг");
    const endIso = endDate ? parseRuDate(endDate) : null;
    if (endDate && !endIso) return alert("Дата конца в формате дд.мм.гггг");

    const finalQuestions = isSuggestionBox ? [{ text: "Ваше предложение", type: "TEXT" }] : questions;

    await createSurvey({ title, frequency: "ONCE", isAnonymous, isSuggestionBox, startDate: startIso, endDate: endIso, questions: finalQuestions });

    setTitle(""); setStartDate(""); setEndDate("");
    setQuestions([{ text: "", type: "SCALE_1_5" }]);
  }

  return (
    <PageShell title="Управление опросами" wide>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название опроса" />

        <div className={styles.checkboxRow}>
          <label><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Анонимный</label>
          <label><input type="checkbox" checked={isSuggestionBox} onChange={(e) => setIsSuggestionBox(e.target.checked)} /> Ящик предложений</label>
        </div>

        <div className={styles.dateRow}>
          <label>Начало: <input className="input" value={startDate} onChange={(e) => setStartDate(autoFormatRuDate(e.target.value))} placeholder="10.09.2026" maxLength={10} /></label>
          <label>Конец: <input className="input" value={endDate} onChange={(e) => setEndDate(autoFormatRuDate(e.target.value))} placeholder="необязательно" maxLength={10} /></label>
        </div>

        {!isSuggestionBox && (
          <div>
            <span className="text-h4">Вопросы</span>
            {questions.map((q, i) => (
              <div key={i} className={styles.questionRow}>
                <input className="input" value={q.text} onChange={(e) => updateQuestion(i, "text", e.target.value)} placeholder="Текст вопроса" />
                <select className="input" value={q.type} onChange={(e) => updateQuestion(i, "type", e.target.value)}>
                  <option value="SCALE_1_5">Шкала 1-5</option>
                  <option value="YES_NO">Да/Нет</option>
                  <option value="TEXT">Текст</option>
                </select>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addQuestion} style={{ marginTop: 8 }}>+ Добавить вопрос</Button>
          </div>
        )}

        <Button type="submit">Создать опрос</Button>
      </form>

      {surveys?.map((s) => (
        <Card key={s.id}>
          <div className={styles.itemRow}>
            <CardTitle>{s.title}</CardTitle>
            <span className="text-xs">прошли: {s.completionsCount ?? 0}{s.isAnonymous ? " · анонимный" : ""}</span>
            <Button variant="danger" onClick={() => handleDelete(s.id)}>Удалить</Button>
          </div>
          <Button variant="secondary" onClick={() => setResultsOpenId(resultsOpenId === s.id ? null : s.id)}>
            {resultsOpenId === s.id ? "Скрыть результаты" : "Показать результаты"}
          </Button>
          {resultsOpenId === s.id && <SurveyResults surveyId={s.id} />}
        </Card>
      ))}
    </PageShell>
  );
}

function SurveyResults({ surveyId }: { surveyId: string }) {
  const { data, isLoading } = useGetSurveyResultsQuery(surveyId);
  if (isLoading) return <p className="text-s">Загрузка результатов...</p>;
  if (!data) return null;

  return (
    <div className={styles.results}>
      {data.questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 8 }}>
          <span className="text-s"><strong>{q.text}</strong></span>
          {q.type === "SCALE_1_5" && <p className="text-xs">Средняя оценка: {q.average?.toFixed(2) ?? "нет данных"}</p>}
          {q.type === "YES_NO" && <p className="text-xs">Да: {q.counts?.yes ?? 0} · Нет: {q.counts?.no ?? 0}</p>}
          {q.type === "TEXT" && (
            <ul>
              {q.texts?.map((t, i) => <li key={i} className="text-xs">{t}</li>)}
              {q.texts?.length === 0 && <li className="text-xs">Пока нет ответов</li>}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}