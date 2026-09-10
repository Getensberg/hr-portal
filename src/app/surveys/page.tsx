"use client";
import { useState } from "react";
import { useGetActiveSurveysQuery, useSubmitSurveyMutation } from "@/store/api";

export default function SurveysPage() {
  const { data: surveys, isLoading } = useGetActiveSurveysQuery();
  const [submitSurvey] = useSubmitSurveyMutation();
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});

  function setAnswer(surveyId: string, questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [surveyId]: { ...prev[surveyId], [questionId]: value } }));
  }

  async function handleSubmit(surveyId: string, questions: { id: string }[]) {
    const surveyAnswers = questions.map((q) => ({
      questionId: q.id,
      value: answers[surveyId]?.[q.id] ?? "",
    }));
    await submitSurvey({ id: surveyId, answers: surveyAnswers });
  }

  if (isLoading) return <p>Загрузка...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Опросы</h1>
      {surveys?.length === 0 && <p>Сейчас нет активных опросов</p>}
      {surveys?.map((s) => (
        <div key={s.id} style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
          <h3>{s.title} {s.isAnonymous && <span style={{ fontSize: 12, color: "#666" }}>(анонимно)</span>}</h3>
          {s.completed ? (
            <p>Спасибо, вы уже прошли этот опрос.</p>
          ) : (
            <>
              {s.questions.map((q) => (
                <div key={q.id} style={{ marginBottom: 8 }}>
                  <label>{q.text}</label><br />
                  {q.type === "SCALE_1_5" && (
                    <select onChange={(e) => setAnswer(s.id, q.id, e.target.value)} defaultValue="">
                      <option value="" disabled>Выбрать</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                  {q.type === "YES_NO" && (
                    <select onChange={(e) => setAnswer(s.id, q.id, e.target.value)} defaultValue="">
                      <option value="" disabled>Выбрать</option>
                      <option value="yes">Да</option>
                      <option value="no">Нет</option>
                    </select>
                  )}
                  {q.type === "TEXT" && (
                    <textarea rows={2} style={{ width: "100%" }} onChange={(e) => setAnswer(s.id, q.id, e.target.value)} />
                  )}
                </div>
              ))}
              <button onClick={() => handleSubmit(s.id, s.questions)}>Отправить ответ</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}