"use client";
import { useState } from "react";
import { useGetActiveJobsQuery, useCreateReferralMutation, useGetMyReferralsQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./jobs.module.css";

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

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Вакансии">
      {jobs?.length === 0 && <p className="text-s">Сейчас нет открытых вакансий</p>}
      {jobs?.map((j) => (
        <Card key={j.id}>
          <CardTitle>{j.title}{j.department ? ` · ${j.department}` : ""}</CardTitle>
          <p className="text-s">{j.description}</p>
          {openJobId === j.id ? (
            <div className={styles.referralForm}>
              <input className="input" placeholder="Имя кандидата" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} />
              <input className="input" placeholder="Контакт (телефон/почта/телеграм)" value={form.candidateContact} onChange={(e) => setForm({ ...form, candidateContact: e.target.value })} />
              <textarea className="textarea" placeholder="Комментарий (необязательно)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} />
              <div className={styles.actions}>
                <Button onClick={() => handleSubmit(j.id)}>Отправить рекомендацию</Button>
                <Button variant="secondary" onClick={() => setOpenJobId(null)}>Отмена</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setOpenJobId(j.id)}>Порекомендовать</Button>
          )}
        </Card>
      ))}

      <CardTitle>Мои рекомендации</CardTitle>
      <ul>
        {myReferrals?.map((r) => <li key={r.id} className="text-s">{r.candidateName} — на «{r.jobPosting?.title}»</li>)}
        {myReferrals?.length === 0 && <li className="text-xs">Пока нет рекомендаций</li>}
      </ul>
    </PageShell>
  );
}