"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetReviewsQuery, useGetReviewQuery, useSubmitReviewMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./reviews-admin.module.css";

function ReviewPanel({ attemptId, onSaved }: { attemptId: string; onSaved: (message: string) => void }) {
  const { data: review, isLoading } = useGetReviewQuery(attemptId);
  const [submitReview, { isLoading: saving }] = useSubmitReviewMutation();
  const [verdicts, setVerdicts] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  if (isLoading) return <p className="text-s">Загрузка...</p>;
  if (!review) return <p className="text-s">Не удалось загрузить попытку</p>;

  const openAnswers = review.answers.filter((a) => a.kind === "OPEN");

  async function save() {
    if (!review) return;
    setError("");
    if (openAnswers.some((a) => verdicts[a.id] === undefined)) {
      setError("Оцените все свободные ответы");
      return;
    }
    try {
      const res = await submitReview({ attemptId, verdicts }).unwrap();
      onSaved(`${review.user.fullName}, «${review.test.title}»: ${res.passed ? "сдан" : "не сдан"}`);
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось сохранить результат");
    }
  }

  return (
    <div className={styles.panel}>
      {review.answers.map((a, i) => (
        <div key={a.id} className={styles.answer}>
          <p className={styles.qText}>{i + 1}. {a.text}</p>
          {a.kind === "OPEN" ? (
            <>
              <p className={styles.answerText}>{a.textAnswer}</p>
              <div className={styles.verdictRow}>
                <Button
                  size="sm"
                  variant={verdicts[a.id] === true ? "primary" : "secondary"}
                  onClick={() => setVerdicts((v) => ({ ...v, [a.id]: true }))}
                >
                  Засчитать
                </Button>
                <Button
                  size="sm"
                  variant={verdicts[a.id] === false ? "danger" : "secondary"}
                  onClick={() => setVerdicts((v) => ({ ...v, [a.id]: false }))}
                >
                  Не засчитать
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.line}>Ответ сотрудника: {a.selectedTexts.join("; ") || "—"}</p>
              <p className={styles.line}>Верный ответ: {a.correctTexts.join("; ")}</p>
              <p className={`${styles.line} ${a.isCorrect ? styles.ok : styles.bad}`}>
                {a.isCorrect ? "Верно, засчитано автоматически" : "Неверно, определено автоматически"}
              </p>
            </>
          )}
        </div>
      ))}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <Button disabled={saving} onClick={save}>Сохранить результат</Button>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: reviews, isLoading } = useGetReviewsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN" || isLoading) {
    return <p className="text-s">Загрузка...</p>;
  }

  return (
    <PageShell title="Проверка тестов" wide>
      {notice && <div className={styles.notice}>Результат сохранён. {notice}</div>}

      {reviews?.map((r) => (
        <Card key={r.id}>
          <div className={styles.head}>
            <div>
              <CardTitle>{r.userName}</CardTitle>
              <p className={styles.meta}>
                {r.department ? `${r.department} · ` : ""}
                «{r.testTitle}»{r.courseTitle ? ` · курс «${r.courseTitle}»` : ""} ·{" "}
                {new Date(r.submittedAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
              {openId === r.id ? "Свернуть" : "Проверить"}
            </Button>
          </div>
          {openId === r.id && (
            <ReviewPanel
              attemptId={r.id}
              onSaved={(message) => {
                setNotice(message);
                setOpenId(null);
              }}
            />
          )}
        </Card>
      ))}
      {reviews?.length === 0 && <p className="text-s">Ответов на проверке нет</p>}
    </PageShell>
  );
}