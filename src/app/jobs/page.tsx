"use client";
import { useState } from "react";
import { useGetActiveJobsQuery, useCreateReferralMutation, useGetMyReferralsQuery } from "@/store/api";

export default function JobsPage() {
  const { data: jobs, isLoading } = useGetActiveJobsQuery();
  const { data: myReferrals } = useGetMyReferralsQuery();
  const [createReferral] = useCreateReferralMutation();

  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [form, setForm] = useState({ candidateName: "", candidateContact: "", comment: "" });

  async function handleSubmit(jobId: string) {
    if (!form.candidateName || !form.candidateContact) return alert("Заполни имя и контакт кандидата");
    await createReferral({ jobId, ...form });
    setForm({ candidateName: "", candidateContact: "", comment: "" });
    setOpenJobId(null);
  }

  if (isLoading) return <p>Загрузка...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Вакансии</h1>
      {jobs?.length === 0 && <p>Сейчас нет открытых вакансий</p>}
      {jobs?.map((j) => (
        <div key={j.id} style={{ border: "1px solid #ccc", padding: 16, marginBottom: 12 }}>
          <h3>{j.title} {j.department ? `· ${j.department}` : ""}</h3>
          <p>{j.description}</p>
          {openJobId === j.id ? (
            <div>
              <input placeholder="Имя кандидата" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} /><br />
              <input placeholder="Контакт (телефон/почта/телеграм)" value={form.candidateContact} onChange={(e) => setForm({ ...form, candidateContact: e.target.value })} style={{ marginTop: 8 }} /><br />
              <textarea placeholder="Комментарий (необязательно)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} style={{ marginTop: 8, width: "100%" }} /><br />
              <button onClick={() => handleSubmit(j.id)} style={{ marginTop: 8 }}>Отправить рекомендацию</button>
              <button onClick={() => setOpenJobId(null)} style={{ marginLeft: 8 }}>Отмена</button>
            </div>
          ) : (
            <button onClick={() => setOpenJobId(j.id)}>Порекомендовать</button>
          )}
        </div>
      ))}

      <h2>Мои рекомендации</h2>
      <ul>
        {myReferrals?.map((r) => (
          <li key={r.id}>{r.candidateName} — на «{r.jobPosting?.title}»</li>
        ))}
        {myReferrals?.length === 0 && <li>Пока нет рекомендаций</li>}
      </ul>
    </div>
  );
}