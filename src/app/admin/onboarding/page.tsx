"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetUsersQuery,
  useGetOnboardingAdminQuery,
  useCreateOnboardingPlanMutation,
  useAddOnboardingTaskMutation,
} from "@/store/api";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./onboarding-admin.module.css";
import { getErrorMessage } from "@/lib/errors";
import { FormError } from "@/components/FormError";

export default function AdminOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: users } = useGetUsersQuery();
  const { data: plans } = useGetOnboardingAdminQuery();
  const [createPlan] = useCreateOnboardingPlanMutation();
  const [addTask] = useAddOnboardingTaskMutation();

  const [newcomerId, setNewcomerId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { title: string; description: string; dueDate: string }>>({});

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newcomerId) return setError("Выбери новичка");
    const startIso = startDate ? parseRuDate(startDate) : null;
    if (startDate && !startIso) return setError("Дата начала в формате дд.мм.гггг");
    const endIso = endDate ? parseRuDate(endDate) : null;
    if (endDate && !endIso) return setError("Дата конца в формате дд.мм.гггг");

    try {
      await createPlan({ newcomerId, mentorId: mentorId || null, startDate: startIso, endDate: endIso }).unwrap();
      setNewcomerId(""); setMentorId(""); setStartDate(""); setEndDate("");
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось создать план"));
    }
  }

  function updateDraft(planId: string, field: string, value: string) {
    setTaskDrafts((prev) => ({ ...prev, [planId]: { ...prev[planId], [field]: value } as any }));
  }

  async function handleAddTask(planId: string) {
    const draft = taskDrafts[planId];
    if (!draft?.title) return;
    setError("");
    const dueIso = draft.dueDate ? parseRuDate(draft.dueDate) : null;
    if (draft.dueDate && !dueIso) return setError("Дата дедлайна в формате дд.мм.гггг");

    try {
      await addTask({ planId, title: draft.title, description: draft.description, dueDate: dueIso }).unwrap();
      setTaskDrafts((prev) => ({ ...prev, [planId]: { title: "", description: "", dueDate: "" } }));
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось добавить задачу"));
    }
  }

  return (
    <PageShell title="Онбординг" wide>
      <form onSubmit={handleCreatePlan} className={styles.form}>
        <div className={styles.formRow}>
          <select className="input" value={newcomerId} onChange={(e) => setNewcomerId(e.target.value)}>
            <option value="">Выбрать новичка</option>
            {users?.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
          </select>
          <select className="input" value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
            <option value="">Без наставника</option>
            {users?.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </div>
        <div className={styles.formRow}>
          <input className="input" value={startDate} onChange={(e) => setStartDate(autoFormatRuDate(e.target.value))} placeholder="Начало: 10.09.2026" maxLength={10} />
          <input className="input" value={endDate} onChange={(e) => setEndDate(autoFormatRuDate(e.target.value))} placeholder="Конец (необязательно)" maxLength={10} />
        </div>
        <Button type="submit">Создать план</Button>
      </form>
      <FormError message={error} />

      {plans?.map((p) => (
        <Card key={p.id}>
          <CardTitle>{p.newcomer.fullName}</CardTitle>
          <p className="text-xs">Наставник: {p.mentor?.fullName ?? "не назначен"}</p>
          <ul>
            {p.tasks.map((t) => <li key={t.id} className="text-s">{t.title}</li>)}
            {p.tasks.length === 0 && <li className="text-xs">Пока нет задач</li>}
          </ul>
          <div className={styles.taskForm}>
            <input className="input" placeholder="Название задачи" value={taskDrafts[p.id]?.title ?? ""} onChange={(e) => updateDraft(p.id, "title", e.target.value)} />
            <input className="input" placeholder="Описание" value={taskDrafts[p.id]?.description ?? ""} onChange={(e) => updateDraft(p.id, "description", e.target.value)} />
            <input className="input" placeholder="дд.мм.гггг" value={taskDrafts[p.id]?.dueDate ?? ""} onChange={(e) => updateDraft(p.id, "dueDate", autoFormatRuDate(e.target.value))} maxLength={10} />
            <Button type="button" variant="secondary" onClick={() => handleAddTask(p.id)}>+ Добавить задачу</Button>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}