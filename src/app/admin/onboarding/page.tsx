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
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { title: string; description: string; dueDate: string }>>({});

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p>Загрузка...</p>;
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!newcomerId) return alert("Выбери новичка");

    const startIso = startDate ? parseRuDate(startDate) : null;
    if (startDate && !startIso) return alert("Дата начала в формате дд.мм.гггг");
    const endIso = endDate ? parseRuDate(endDate) : null;
    if (endDate && !endIso) return alert("Дата конца в формате дд.мм.гггг");

    await createPlan({ newcomerId, mentorId: mentorId || null, startDate: startIso, endDate: endIso });
    setNewcomerId(""); setMentorId(""); setStartDate(""); setEndDate("");
  }

  function updateDraft(planId: string, field: string, value: string) {
    setTaskDrafts((prev) => ({ ...prev, [planId]: { ...prev[planId], [field]: value } as any }));
  }

  async function handleAddTask(planId: string) {
    const draft = taskDrafts[planId];
    if (!draft?.title) return;
    const dueIso = draft.dueDate ? parseRuDate(draft.dueDate) : null;
    if (draft.dueDate && !dueIso) return alert("Дата дедлайна в формате дд.мм.гггг");

    await addTask({ planId, title: draft.title, description: draft.description, dueDate: dueIso });
    setTaskDrafts((prev) => ({ ...prev, [planId]: { title: "", description: "", dueDate: "" } }));
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Онбординг</h1>

      <form onSubmit={handleCreatePlan} style={{ marginBottom: 32, border: "1px solid #ccc", padding: 16 }}>
        <h3>Новый план</h3>
        <select value={newcomerId} onChange={(e) => setNewcomerId(e.target.value)}>
          <option value="">Выбрать новичка</option>
          {users?.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
        </select>
        <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="">Без наставника</option>
          {users?.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <br /><br />
        <label>Начало (дд.мм.гггг): <input value={startDate} onChange={(e) => setStartDate(autoFormatRuDate(e.target.value))} placeholder="10.09.2026" maxLength={10} /></label>
        <label style={{ marginLeft: 16 }}>Конец, необязательно: <input value={endDate} onChange={(e) => setEndDate(autoFormatRuDate(e.target.value))} placeholder="10.12.2026" maxLength={10} /></label>
        <br /><br />
        <button type="submit">Создать план</button>
      </form>

      <h2>Существующие планы</h2>
      {plans?.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
          <strong>{p.newcomer.fullName}</strong> — наставник: {p.mentor?.fullName ?? "не назначен"}
          <ul>
            {p.tasks.map((t) => <li key={t.id}>{t.title}</li>)}
            {p.tasks.length === 0 && <li>Пока нет задач</li>}
          </ul>
          <div>
            <input placeholder="Название задачи" value={taskDrafts[p.id]?.title ?? ""} onChange={(e) => updateDraft(p.id, "title", e.target.value)} />
            <input placeholder="Описание" value={taskDrafts[p.id]?.description ?? ""} onChange={(e) => updateDraft(p.id, "description", e.target.value)} style={{ marginLeft: 8 }} />
            <input placeholder="дд.мм.гггг" value={taskDrafts[p.id]?.dueDate ?? ""} onChange={(e) => updateDraft(p.id, "dueDate", autoFormatRuDate(e.target.value))} maxLength={10} style={{ marginLeft: 8, width: 100 }} />
            <button onClick={() => handleAddTask(p.id)} style={{ marginLeft: 8 }}>+ Добавить задачу</button>
          </div>
        </div>
      ))}
    </div>
  );
}