"use client";
import { useGetMyOnboardingQuery, useToggleOnboardingTaskMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  const { data, isLoading } = useGetMyOnboardingQuery();
  const [toggleTask] = useToggleOnboardingTaskMutation();

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  if (!data?.plan) {
    return (
      <PageShell title="Онбординг">
        <Card><p className="text-s">Для вас пока не создан план адаптации.</p></Card>
      </PageShell>
    );
  }

  const total = data.tasks.length;
  const done = data.tasks.filter((t) => t.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <PageShell title="Онбординг">
      <div className={styles.summary}>
        <div className={styles.summaryTop}>
          <div>
            <div className={styles.summaryLabel}>Ваш прогресс</div>
            <div className={styles.summaryValue}>{done} из {total} задач</div>
          </div>
          <span className={styles.percent}>{percent}%</span>
        </div>
        <ProgressBar percent={percent} />
        <p className={styles.mentor}>
          Наставник: {data.plan.mentor ? `${data.plan.mentor.fullName} (${data.plan.mentor.email})` : "не назначен"}
        </p>
      </div>

      <CardTitle>Чек-лист задач</CardTitle>
      <div className={styles.list}>
        {data.tasks.map((t) => (
          <label key={t.id} className={`${styles.taskRow} ${t.done ? styles.taskRowDone : ""}`}>
            <input type="checkbox" checked={t.done} onChange={(e) => toggleTask({ taskId: t.id, done: e.target.checked })} />
            <span className={`text-s ${t.done ? styles.taskDone : ""}`}>
              {t.title}{t.description ? ` — ${t.description}` : ""}
            </span>
          </label>
        ))}
      </div>
      {data.tasks.length === 0 && <p className="text-s">Пока нет задач в плане</p>}
    </PageShell>
  );
}
