"use client";
import { useState } from "react";
import { useGetActiveSurveysQuery, useSubmitSurveyMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./surveys.module.css";

export default function SurveysPage() {
  const { data: surveys, isLoading } = useGetActiveSurveysQuery();
  const [submitSurvey] = useSubmitSurveyMutation();
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});

  function setAnswer(surveyId: string, questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [surveyId]: { ...prev[surveyId], [questionId]: value } }));
  }

  async function handleSubmit(surveyId: string, questions: { id: string }[]) {
    const surveyAnswers = questions.map((q) => ({ questionId: q.id, value: answers[surveyId]?.[q.id] ?? "" }));
    await submitSurvey({ id: surveyId, answers: surveyAnswers });
  }

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Опросы">
      {surveys?.length === 0 && <p className="text-s">Сейчас нет активных опросов</p>}
      {surveys?.map((s) => (
        <Card key={s.id}>
          <CardTitle>{s.title} {s.isAnonymous && <span className="text-xs">(анонимно)</span>}</CardTitle>
          {s.completed ? (
            <p className="text-s">Спасибо, вы уже прошли этот опрос.</p>
          ) : (
            <>
              {s.questions.map((q) => (
                <div key={q.id} className={styles.question}>
                  <label className="text-s">{q.text}</label>
                  {q.type === "SCALE_1_5" && (
                    <select className="input" onChange={(e) => setAnswer(s.id, q.id, e.target.value)} defaultValue="">
                      <option value="" disabled>Выбрать</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                  {q.type === "YES_NO" && (
                    <select className="input" onChange={(e) => setAnswer(s.id, q.id, e.target.value)} defaultValue="">
                      <option value="" disabled>Выбрать</option>
                      <option value="yes">Да</option>
                      <option value="no">Нет</option>
                    </select>
                  )}
                  {q.type === "TEXT" && (
                    <textarea className="textarea" rows={2} onChange={(e) => setAnswer(s.id, q.id, e.target.value)} />
                  )}
                </div>
              ))}
              <Button onClick={() => handleSubmit(s.id, s.questions)}>Отправить ответ</Button>
            </>
          )}
        </Card>
      ))}
    </PageShell>
  );
}