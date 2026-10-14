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
import { Select } from "@/components/Select";
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

  const userOptions = (users ?? []).map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` }));

  return (
    <PageShell title="Онбординг" wide>
      <div className={styles.layout}>
        <form onSubmit={handleCreatePlan} className={styles.panel}>
          <h2 className={styles.panelTitle}>Новый план</h2>
          <div className={styles.field}>
            <span className={styles.label}>Новичок</span>
            <Select value={newcomerId} onChange={setNewcomerId} placeholder="Выбрать новичка" ariaLabel="Новичок" options={userOptions} />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Наставник</span>
            <Select
              value={mentorId}
              onChange={setMentorId}
              ariaLabel="Наставник"
              options={[{ value: "", label: "Без наставника" }, ...(users ?? []).map((u) => ({ value: u.id, label: u.fullName }))]}
            />
          </div>
          <div className={styles.dates}>
            <label className={styles.field}>
              <span className={styles.label}>Начало</span>
              <input className="input" inputMode="numeric" value={startDate} onChange={(e) => setStartDate(autoFormatRuDate(e.target.value))} placeholder="10.09.2026" maxLength={10} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Конец</span>
              <input className="input" inputMode="numeric" value={endDate} onChange={(e) => setEndDate(autoFormatRuDate(e.target.value))} placeholder="необязательно" maxLength={10} />
            </label>
          </div>
          <FormError message={error} />
          <Button type="submit">Создать план</Button>
        </form>

        <div>
          <h2 className={styles.listTitle}>Планы <span className={styles.count}>{plans?.length ?? 0}</span></h2>
          {plans?.map((p) => (
            <div key={p.id} className={styles.plan}>
              <div className={styles.planHead}>
                <span className={styles.avatar}>{p.newcomer.fullName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</span>
                <div>
                  <div className={styles.planName}>{p.newcomer.fullName}</div>
                  <div className={styles.meta}>Наставник: {p.mentor?.fullName ?? "не назначен"}</div>
                </div>
              </div>
              <ul className={styles.tasks}>
                {p.tasks.map((t) => (
                  <li key={t.id} className={styles.task}><span className={styles.taskDot} />{t.title}</li>
                ))}
                {p.tasks.length === 0 && <li className={styles.meta}>Пока нет задач</li>}
              </ul>
              <div className={styles.taskForm}>
                <input className="input" placeholder="Название задачи" value={taskDrafts[p.id]?.title ?? ""} onChange={(e) => updateDraft(p.id, "title", e.target.value)} />
                <input className="input" placeholder="Описание" value={taskDrafts[p.id]?.description ?? ""} onChange={(e) => updateDraft(p.id, "description", e.target.value)} />
                <input className="input" inputMode="numeric" placeholder="дедлайн дд.мм.гггг" value={taskDrafts[p.id]?.dueDate ?? ""} onChange={(e) => updateDraft(p.id, "dueDate", autoFormatRuDate(e.target.value))} maxLength={10} />
                <Button type="button" variant="secondary" onClick={() => handleAddTask(p.id)}>+ Добавить задачу</Button>
              </div>
            </div>
          ))}
          {plans?.length === 0 && <p className={styles.meta}>Планов пока нет</p>}
        </div>
      </div>
    </PageShell>
  );
}
