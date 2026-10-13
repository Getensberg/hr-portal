"use client";
import { useState } from "react";
import { useGetActiveSurveysQuery, useSubmitSurveyMutation } from "@/store/api";
import type { SurveyItem } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import styles from "./surveys.module.css";
import { getErrorMessage } from "@/lib/errors";
import { FormError } from "@/components/FormError";

type Answers = Record<string, Record<string, string>>;

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export default function SurveysPage() {
  const { data: surveys, isLoading } = useGetActiveSurveysQuery();
  const [submitSurvey, { isLoading: sending }] = useSubmitSurveyMutation();
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  function setAnswer(surveyId: string, questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [surveyId]: { ...prev[surveyId], [questionId]: value } }));
  }

  async function handleSubmit(s: SurveyItem) {
    const surveyAnswers = s.questions.map((q) => ({ questionId: q.id, value: answers[s.id]?.[q.id] ?? "" }));
    setError(null);
    setSendingId(s.id);
    try {
      await submitSurvey({ id: s.id, answers: surveyAnswers }).unwrap();
    } catch (err) {
      setError({ id: s.id, message: getErrorMessage(err, "Не удалось отправить ответы") });
    } finally {
      setSendingId(null);
    }
  }

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  const list = surveys ?? [];
  const active = list.find((x) => x.id === activeId) ?? list.find((x) => !x.completed) ?? list[0];

  function answeredCount(sv: SurveyItem) {
    const a = answers[sv.id] ?? {};
    return sv.questions.filter((q) => (a[q.id] ?? "").trim() !== "").length;
  }

  function renderSurvey(s: SurveyItem) {
    const a = answers[s.id] ?? {};
    const answered = answeredCount(s);
    const percent = s.questions.length ? Math.round((answered / s.questions.length) * 100) : 0;
    const chips = (
      <div className={styles.chips}>
        {s.isAnonymous && <span className={`${styles.chip} ${styles.chipMint}`}>Анонимно</span>}
        {s.isSuggestionBox && <span className={`${styles.chip} ${styles.chipPeach}`}>Ящик предложений</span>}
        <span className={`${styles.chip} ${styles.chipLilac}`}>
          {s.questions.length} {plural(s.questions.length, "вопрос", "вопроса", "вопросов")}
        </span>
      </div>
    );

    if (s.completed) {
      return (
        <section className={`${styles.card} ${styles.cardDone}`}>
          <div className={styles.bigCheck}>✓</div>
          <h2 className={styles.title}>{s.title}</h2>
          <p className={styles.doneText}>Спасибо, вы уже прошли этот опрос.</p>
          {chips}
        </section>
      );
    }

    return (
      <section className={styles.card}>
        <div className={styles.head}>
          <h2 className={styles.title}>{s.title}</h2>
          {chips}
          <div className={styles.progress}>
            <ProgressBar percent={percent} />
            <span className={styles.progressText}>Отвечено {answered} из {s.questions.length}</span>
          </div>
        </div>

            <ol className={styles.questions}>
              {s.questions.map((q, idx) => (
                <li key={q.id} className={styles.question}>
                  <div className={styles.qText}>
                    <span className={styles.qNum}>{idx + 1}</span>
                    <span>{q.text}</span>
                  </div>

                  {q.type === "SCALE_1_5" && (
                    <div>
                      <div className={styles.scale} role="radiogroup" aria-label={q.text}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={a[q.id] === String(n)}
                            className={`${styles.scaleBtn} ${a[q.id] === String(n) ? styles.on : ""}`}
                            onClick={() => setAnswer(s.id, q.id, String(n))}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className={styles.scaleHint}><span>Совсем нет</span><span>Полностью да</span></div>
                    </div>
                  )}

                  {q.type === "YES_NO" && (
                    <div className={styles.yesNo} role="radiogroup" aria-label={q.text}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={a[q.id] === "yes"}
                        className={`${styles.yn} ${a[q.id] === "yes" ? styles.on : ""}`}
                        onClick={() => setAnswer(s.id, q.id, "yes")}
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={a[q.id] === "no"}
                        className={`${styles.yn} ${a[q.id] === "no" ? styles.on : ""}`}
                        onClick={() => setAnswer(s.id, q.id, "no")}
                      >
                        Нет
                      </button>
                    </div>
                  )}

                  {q.type === "TEXT" && (
                    <textarea
                      className="textarea"
                      rows={3}
                      placeholder="Ваш ответ"
                      value={a[q.id] ?? ""}
                      onChange={(e) => setAnswer(s.id, q.id, e.target.value)}
                    />
                  )}
                </li>
              ))}
            </ol>

            <FormError message={error?.id === s.id ? error.message : null} />
        <div className={styles.actions}>
          <Button onClick={() => handleSubmit(s)} disabled={sending && sendingId === s.id}>
            {sending && sendingId === s.id ? "Отправляем..." : "Отправить ответы"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <PageShell title="Опросы">
      {list.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✓</div>
          <div className={styles.emptyTitle}>Сейчас нет активных опросов</div>
          <div className={styles.emptyText}>Когда появится новый опрос, он будет здесь.</div>
        </div>
      ) : (
        <div className={styles.layout}>
          <nav className={styles.side} aria-label="Список опросов">
            <div className={styles.sideTitle}>Все опросы <span className={styles.count}>{list.length}</span></div>
            <div className={styles.sideList}>
              {list.map((sv) => {
                const isActive = active?.id === sv.id;
                return (
                  <button
                    key={sv.id}
                    type="button"
                    className={`${styles.sideItem} ${isActive ? styles.sideItemActive : ""}`}
                    onClick={() => setActiveId(sv.id)}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className={`${styles.dot} ${sv.completed ? styles.dotDone : styles.dotOpen}`}>
                      {sv.completed ? "✓" : ""}
                    </span>
                    <span className={styles.sideName}>{sv.title}</span>
                    <span className={styles.sideMeta}>
                      {sv.completed ? "Пройден" : answeredCount(sv) > 0 ? `${answeredCount(sv)}/${sv.questions.length}` : "Новый"}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          <div className={styles.content}>{active && renderSurvey(active)}</div>
        </div>
      )}
    </PageShell>
  );
}
