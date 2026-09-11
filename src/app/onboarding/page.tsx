"use client";
import { useGetMyOnboardingQuery, useToggleOnboardingTaskMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
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

  return (
    <PageShell title="Онбординг">
      <Card>
        <p className="text-s">
          Наставник: {data.plan.mentor ? `${data.plan.mentor.fullName} (${data.plan.mentor.email})` : "не назначен"}
        </p>
      </Card>

      <CardTitle>Чек-лист задач</CardTitle>
      {data.tasks.map((t) => (
        <div key={t.id} className={styles.taskRow}>
          <input type="checkbox" checked={t.done} onChange={(e) => toggleTask({ taskId: t.id, done: e.target.checked })} />
          <span className={`text-s ${t.done ? styles.taskDone : ""}`}>
            {t.title}{t.description ? ` — ${t.description}` : ""}
          </span>
        </div>
      ))}
      {data.tasks.length === 0 && <p className="text-s">Пока нет задач в плане</p>}
    </PageShell>
  );
}