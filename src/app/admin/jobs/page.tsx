"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetAdminJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetAdminReferralsQuery,
} from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./jobs-admin.module.css";

export default function AdminJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: jobs } = useGetAdminJobsQuery();
  const { data: referrals } = useGetAdminReferralsQuery();
  const [createJob] = useCreateJobMutation();
  const [updateJob] = useUpdateJobMutation();
  const [deleteJob] = useDeleteJobMutation();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createJob({ title, department, description });
    setTitle(""); setDepartment(""); setDescription("");
  }

  return (
    <PageShell title="Вакансии и рекомендации" wide>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название вакансии" />
        <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Отдел" />
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" rows={3} />
        <Button type="submit">Создать вакансию</Button>
      </form>

      <CardTitle>Вакансии</CardTitle>
      {jobs?.map((j) => (
        <Card key={j.id}>
          <div className={styles.itemRow}>
            <span className="text-s"><strong>{j.title}</strong>{j.department ? ` · ${j.department}` : ""} — рекомендаций: {j.referralsCount ?? 0}</span>
            <div className={styles.itemRow}>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={j.isActive} onChange={(e) => updateJob({ id: j.id, isActive: e.target.checked })} /> Активна
              </label>
              <Button variant="danger" onClick={() => deleteJob(j.id)}>Удалить</Button>
            </div>
          </div>
        </Card>
      ))}

      <CardTitle>Все рекомендации</CardTitle>
      <ul>
        {referrals?.map((r) => (
          <li key={r.id} className="text-s">{r.candidateName} ({r.candidateContact}) — на «{r.jobPosting?.title}», рекомендовал: {r.referrer?.fullName}</li>
        ))}
        {referrals?.length === 0 && <li className="text-xs">Пока нет рекомендаций</li>}
      </ul>
    </PageShell>
  );
}