"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAdminSurveysQuery, useCreateSurveyMutation, useGetSurveyResultsQuery } from "@/store/api";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";

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

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p>Загрузка...</p>;
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
  if (startDate && !startIso) {
    alert("Дата начала должна быть в формате дд.мм.гггг, например 10.09.2026");
    return;
  }
  const endIso = endDate ? parseRuDate(endDate) : null;
  if (endDate && !endIso) {
    alert("Дата конца должна быть в формате дд.мм.гггг, например 20.09.2026");
    return;
  }

  const finalQuestions = isSuggestionBox ? [{ text: "Ваше предложение", type: "TEXT" }] : questions;

  await createSurvey({
    title,
    frequency: "ONCE",
    isAnonymous,
    isSuggestionBox,
    startDate: startIso ?? new Date().toISOString().split("T")[0],
    endDate: endIso,
    questions: finalQuestions,
  });

  setTitle("");
  setStartDate("");
  setEndDate("");
  setQuestions([{ text: "", type: "SCALE_1_5" }]);
}

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Управление опросами</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 32, border: "1px solid #ccc", padding: 16 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название опроса" style={{ width: "100%" }} />
        <br /><br />
        <label><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Анонимный</label><br />
        <label><input type="checkbox" checked={isSuggestionBox} onChange={(e) => setIsSuggestionBox(e.target.checked)} /> Это ящик предложений (один текстовый вопрос)</label>
        <br /><br />
       <label>
            Начало (дд.мм.гггг):{" "}
            <input
            value={startDate}
            onChange={(e) => setStartDate(autoFormatRuDate(e.target.value))}
            placeholder="10.09.2026"
            maxLength={10}
            />
            </label>
            <label style={{ marginLeft: 16 }}>
            Конец, необязательно (дд.мм.гггг):{" "}
            <input
            value={endDate}
            onChange={(e) => setEndDate(autoFormatRuDate(e.target.value))}
            placeholder="20.09.2026"
            maxLength={10}
            />
            </label>

        {!isSuggestionBox && (
          <div style={{ marginTop: 16 }}>
            <strong>Вопросы</strong>
            {questions.map((q, i) => (
              <div key={i} style={{ marginTop: 8 }}>
                <input value={q.text} onChange={(e) => updateQuestion(i, "text", e.target.value)} placeholder="Текст вопроса" style={{ width: "60%" }} />
                <select value={q.type} onChange={(e) => updateQuestion(i, "type", e.target.value)} style={{ marginLeft: 8 }}>
                  <option value="SCALE_1_5">Шкала 1-5</option>
                  <option value="YES_NO">Да/Нет</option>
                  <option value="TEXT">Текст</option>
                </select>
              </div>
            ))}
            <button type="button" onClick={addQuestion} style={{ marginTop: 8 }}>+ Добавить вопрос</button>
          </div>
        )}

        <br /><br />
        <button type="submit">Создать опрос</button>
      </form>

      <h2>Существующие опросы</h2>
      {surveys?.map((s) => (
        <div key={s.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8 }}>
          <strong>{s.title}</strong> — прошли: {s.completionsCount ?? 0}
          {s.isAnonymous ? " (анонимный)" : ""}
          <button onClick={() => setResultsOpenId(resultsOpenId === s.id ? null : s.id)} style={{ marginLeft: 8 }}>
            {resultsOpenId === s.id ? "Скрыть результаты" : "Показать результаты"}
          </button>
          {resultsOpenId === s.id && <SurveyResults surveyId={s.id} />}
        </div>
      ))}
    </div>
  );
}

function SurveyResults({ surveyId }: { surveyId: string }) {
  const { data, isLoading } = useGetSurveyResultsQuery(surveyId);
  if (isLoading) return <p>Загрузка результатов...</p>;
  if (!data) return null;

  return (
    <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: "2px solid #ccc" }}>
      {data.questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 8 }}>
          <strong>{q.text}</strong>
          {q.type === "SCALE_1_5" && <p>Средняя оценка: {q.average?.toFixed(2) ?? "нет данных"}</p>}
          {q.type === "YES_NO" && <p>Да: {q.counts?.yes ?? 0} · Нет: {q.counts?.no ?? 0}</p>}
          {q.type === "TEXT" && (
            <ul>
              {q.texts?.map((t, i) => <li key={i}>{t}</li>)}
              {q.texts?.length === 0 && <li>Пока нет ответов</li>}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}