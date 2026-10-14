"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetTeamUsersQuery,
  useGetTeamOnboardingQuery,
  useCreateOnboardingPlanMutation,
  useAddOnboardingTaskMutation,
  useDeleteOnboardingTaskMutation,
} from "@/store/api";
import { autoFormatRuDate, parseRuDate } from "@/lib/date";
import { PageShell } from "@/components/PageShell";
import { Select } from "@/components/Select";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/Button";
import styles from "./manager-onboarding.module.css";
import adm from "../../admin/onboarding/onboarding-admin.module.css";
import { getErrorMessage } from "@/lib/errors";

export default function ManagerOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "MANAGER")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: teamUsers } = useGetTeamUsersQuery();
  const { data: plans } = useGetTeamOnboardingQuery();
  const [createPlan] = useCreateOnboardingPlanMutation();
  const [addTask] = useAddOnboardingTaskMutation();
  const [deleteTask] = useDeleteOnboardingTaskMutation();

  const [newcomerId, setNewcomerId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { title: string; description: string; dueDate: string }>>({});
  const [error, setError] = useState("");

  if (status === "loading" || !session || session.user.role !== "MANAGER") {
    return <p className="text-s">Загрузка...</p>;
  }

  const plannedIds = new Set((plans ?? []).map((p) => p.newcomer.id));
  const availableUsers = (teamUsers ?? []).filter((u) => !plannedIds.has(u.id));

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newcomerId) return setError("Выбери сотрудника из команды");

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
    const dueIso = draft.dueDate ? parseRuDate(draft.dueDate) : null;
    if (draft.dueDate && !dueIso) return setError("Дата дедлайна в формате дд.мм.гггг");

    setError("");
    try {
      await addTask({ planId, title: draft.title, description: draft.description, dueDate: dueIso }).unwrap();
      setTaskDrafts((prev) => ({ ...prev, [planId]: { title: "", description: "", dueDate: "" } }));
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось добавить задачу"));
    }
  }

  function handleDeleteTask(id: string, title: string) {
    if (confirm(`Удалить задачу «${title}»? Отметка о выполнении тоже удалится.`)) deleteTask(id);
  }

  return (
    <PageShell title="Онбординг команды" wide>
      <div className={adm.layout}>
        <form onSubmit={handleCreatePlan} className={adm.panel}>
          <h2 className={adm.panelTitle}>Новый план</h2>
          <div className={adm.field}>
            <span className={adm.label}>Сотрудник</span>
            <Select
              value={newcomerId}
              onChange={setNewcomerId}
              placeholder="Выбрать сотрудника из команды"
              ariaLabel="Сотрудник"
              options={availableUsers.map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` }))}
            />
          </div>
          <div className={adm.field}>
            <span className={adm.label}>Наставник</span>
            <Select
              value={mentorId}
              onChange={setMentorId}
              ariaLabel="Наставник"
              options={[{ value: "", label: "Без наставника" }, ...(teamUsers ?? []).map((u) => ({ value: u.id, label: u.fullName }))]}
            />
          </div>
          <div className={adm.dates}>
            <label className={adm.field}>
              <span className={adm.label}>Начало</span>
              <input className="input" inputMode="numeric" value={startDate} onChange={(e) => setStartDate(autoFormatRuDate(e.target.value))} placeholder="дд.мм.гггг" maxLength={10} />
            </label>
            <label className={adm.field}>
              <span className={adm.label}>Конец</span>
              <input className="input" inputMode="numeric" value={endDate} onChange={(e) => setEndDate(autoFormatRuDate(e.target.value))} placeholder="необязательно" maxLength={10} />
            </label>
          </div>
          <FormError message={error || null} />
          <Button type="submit">Создать план</Button>
        </form>

        <div>
          <h2 className={adm.listTitle}>Планы <span className={adm.count}>{plans?.length ?? 0}</span></h2>
          {plans?.map((p) => {
            const doneCount = p.tasks.filter((t) => t.done).length;
            return (
              <div key={p.id} className={adm.plan}>
                <div className={adm.planHead}>
                  <span className={adm.avatar}>{p.newcomer.fullName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</span>
                  <div>
                    <div className={adm.planName}>{p.newcomer.fullName}</div>
                    <div className={adm.meta}>
                      Наставник: {p.mentor?.fullName ?? "не назначен"} · выполнено {doneCount} из {p.tasks.length}
                    </div>
                  </div>
                </div>
                <div className={styles.taskList}>
                  {p.tasks.map((t) => (
                    <div key={t.id} className={styles.taskRow}>
                      <span className={t.done ? styles.done : styles.pending}>{t.done ? "✓" : ""}</span>
                      <span className={styles.taskTitle}>
                        {t.title}
                        {t.done && t.completedAt ? <span className={styles.when}> · выполнено {new Date(t.completedAt).toLocaleDateString("ru-RU")}</span> : null}
                      </span>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteTask(t.id, t.title)}>Удалить</Button>
                    </div>
                  ))}
                  {p.tasks.length === 0 && <p className={adm.meta}>Пока нет задач</p>}
                </div>
                <div className={adm.taskForm}>
                  <input className="input" placeholder="Название задачи" value={taskDrafts[p.id]?.title ?? ""} onChange={(e) => updateDraft(p.id, "title", e.target.value)} />
                  <input className="input" placeholder="Описание" value={taskDrafts[p.id]?.description ?? ""} onChange={(e) => updateDraft(p.id, "description", e.target.value)} />
                  <input className="input" inputMode="numeric" placeholder="дедлайн дд.мм.гггг" value={taskDrafts[p.id]?.dueDate ?? ""} onChange={(e) => updateDraft(p.id, "dueDate", autoFormatRuDate(e.target.value))} maxLength={10} />
                  <Button type="button" variant="secondary" onClick={() => handleAddTask(p.id)}>+ Добавить задачу</Button>
                </div>
              </div>
            );
          })}
          {plans?.length === 0 && <p className={adm.meta}>В вашей команде нет новичков с планом онбординга</p>}
        </div>
      </div>
    </PageShell>
  );
}
