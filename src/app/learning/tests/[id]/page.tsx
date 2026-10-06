"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetLearningTestQuery, useSubmitAttemptMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { StatusPill, type StatusKey } from "@/components/LearningStatus";
import styles from "./test.module.css";

export default function LearningTestPage() {
  const params = useParams<{ id: string }>();
  const { data: test, isLoading } = useGetLearningTestQuery(params.id, {
    skip: !params.id,
    refetchOnMountOrArgChange: true,
  });
  const [submitAttempt, { isLoading: submitting }] = useSubmitAttemptMutation();

  const [started, setStarted] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  if (isLoading) return <p className="text-s">Загрузка...</p>;
  if (!test) {
    return (
      <PageShell title="Тест не найден">
        <p className="text-s">Он мог быть снят с публикации, или у вас нет к нему доступа.</p>
        <Link href="/learning">← К каталогу</Link>
      </PageShell>
    );
  }

  const attemptsLeft = test.maxAttempts - test.attemptsUsed;

  function toggleOption(questionId: string, optionId: string, multiple: boolean) {
    setSelected((prev) => {
      const current = prev[questionId] ?? [];
      if (!multiple) return { ...prev, [questionId]: [optionId] };
      return {
        ...prev,
        [questionId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!test) return;
    setError("");

    const unanswered = test.questions.some((q) =>
      q.kind === "CHOICE" ? (selected[q.id] ?? []).length === 0 : !(texts[q.id] ?? "").trim()
    );
    if (unanswered) {
      setError("Ответьте на все вопросы");
      return;
    }
    if (!confirm("Отправить ответы? Попытка будет засчитана, изменить ответы после отправки нельзя.")) return;

    try {
      await submitAttempt({
        testId: test.id,
        answers: test.questions.map((q) =>
          q.kind === "CHOICE"
            ? { questionId: q.id, selectedOptionIds: selected[q.id] ?? [] }
            : { questionId: q.id, textAnswer: texts[q.id] ?? "" }
        ),
      }).unwrap();
      setStarted(false);
      setSelected({});
      setTexts({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось отправить ответы");
    }
  }

  return (
    <PageShell title={test.title}>
      <Link className={styles.backLink} href={test.courseId ? `/learning/courses/${test.courseId}` : "/learning"}>
        ← {test.courseTitle ? `К курсу «${test.courseTitle}»` : "К каталогу"}
      </Link>

      {test.description && <p className={styles.desc}>{test.description}</p>}
      <div className={styles.info}>
        <span>Проходной балл: {test.passingScore}%</span>
        <span>Попыток использовано: {test.attemptsUsed} из {test.maxAttempts}</span>
      </div>

      {test.state === "PASSED" && <div className={`${styles.banner} ${styles.bannerPassed}`}>Тест сдан. Пересдавать его не нужно.</div>}
      {test.state === "IN_REVIEW" && (
        <div className={`${styles.banner} ${styles.bannerReview}`}>
          Ваши ответы на проверке у HR. Результат появится на этой странице, как только проверка закончится.
        </div>
      )}
      {test.state === "FAILED" && attemptsLeft > 0 && (
        <div className={`${styles.banner} ${styles.bannerFailed}`}>Тест не сдан. Осталось попыток: {attemptsLeft}.</div>
      )}
      {test.blockReason === "NO_ATTEMPTS" && test.state !== "PASSED" && (
        <div className={`${styles.banner} ${styles.bannerFailed}`}>
          Тест не сдан, попытки закончились. Для пересдачи обратитесь к HR.
        </div>
      )}
      {test.blockReason === "NO_QUESTIONS" && (
        <div className={`${styles.banner} ${styles.bannerInfo}`}>В тесте пока нет вопросов.</div>
      )}

      {test.canTake && !started && (
        <div className={styles.actions}>
          <Button onClick={() => setStarted(true)}>{test.attemptsUsed > 0 ? "Пройти ещё раз" : "Начать тест"}</Button>
          <span className="text-xs">Попытка засчитывается в момент отправки ответов.</span>
        </div>
      )}

      {test.canTake && started && (
        <form onSubmit={submit}>
          {test.questions.map((q, i) => (
            <div key={q.id} className={styles.question}>
              <p className={styles.qText}>{i + 1}. {q.text}</p>
              {q.kind === "CHOICE" ? (
                <>
                  <p className={styles.qHint}>{q.multiple ? "Выберите все верные варианты" : "Выберите один вариант"}</p>
                  {q.options.map((o) => (
                    <label key={o.id} className={styles.option}>
                      <input
                        type={q.multiple ? "checkbox" : "radio"}
                        name={`q-${q.id}`}
                        checked={(selected[q.id] ?? []).includes(o.id)}
                        onChange={() => toggleOption(q.id, o.id, q.multiple)}
                      />
                      <span>{o.text}</span>
                    </label>
                  ))}
                </>
              ) : (
                <>
                  <p className={styles.qHint}>Ответ проверит HR</p>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={texts[q.id] ?? ""}
                    onChange={(e) => setTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Ваш ответ"
                  />
                </>
              )}
            </div>
          ))}
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <Button type="submit" disabled={submitting}>Отправить ответы</Button>
            <Button type="button" variant="secondary" onClick={() => setStarted(false)}>Отмена</Button>
          </div>
        </form>
      )}
      {!started && error && <p className={styles.error}>{error}</p>}

      {test.attempts.length > 0 && (
        <>
          <h2 className={`${styles.historyTitle} text-h2`}>Мои попытки</h2>
          {test.attempts.map((a, i) => {
            const status: StatusKey = a.status === "IN_REVIEW" ? "IN_REVIEW" : a.passed ? "DONE" : "FAILED";
            return (
              <div key={a.id} className={styles.attemptRow}>
                <span>Попытка {test.attempts.length - i} · {new Date(a.submittedAt).toLocaleDateString("ru-RU")}</span>
                <StatusPill status={status} kind="test" />
              </div>
            );
          })}
        </>
      )}
    </PageShell>
  );
}