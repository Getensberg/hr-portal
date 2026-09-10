"use client";
import { useGetMyOnboardingQuery, useToggleOnboardingTaskMutation } from "@/store/api";

export default function OnboardingPage() {
  const { data, isLoading } = useGetMyOnboardingQuery();
  const [toggleTask] = useToggleOnboardingTaskMutation();

  if (isLoading) return <p>Загрузка...</p>;

  if (!data?.plan) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto" }}>
        <h1>Онбординг</h1>
        <p>Для вас пока не создан план адаптации.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Онбординг</h1>
      <p>Наставник: {data.plan.mentor ? `${data.plan.mentor.fullName} (${data.plan.mentor.email})` : "не назначен"}</p>

      <h2>Чек-лист задач</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {data.tasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <label>
              <input type="checkbox" checked={t.done} onChange={(e) => toggleTask({ taskId: t.id, done: e.target.checked })} />{" "}
              <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
              {t.description ? ` — ${t.description}` : ""}
            </label>
          </li>
        ))}
        {data.tasks.length === 0 && <li>Пока нет задач в плане</li>}
      </ul>
    </div>
  );
}