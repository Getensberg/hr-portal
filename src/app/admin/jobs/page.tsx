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
    return <p>Загрузка...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createJob({ title, department, description });
    setTitle(""); setDepartment(""); setDescription("");
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Вакансии и рекомендации</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24, border: "1px solid #ccc", padding: 16 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название вакансии" style={{ width: "100%" }} /><br />
        <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Отдел" style={{ marginTop: 8 }} /><br />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" rows={3} style={{ width: "100%", marginTop: 8 }} /><br />
        <button type="submit" style={{ marginTop: 8 }}>Создать вакансию</button>
      </form>

      <h2>Вакансии</h2>
      {jobs?.map((j) => (
        <div key={j.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8 }}>
          <strong>{j.title}</strong> {j.department ? `· ${j.department}` : ""} — рекомендаций: {j.referralsCount ?? 0}
          <br />
          <label>
            <input type="checkbox" checked={j.isActive} onChange={(e) => updateJob({ id: j.id, isActive: e.target.checked })} /> Активна
          </label>
          <button onClick={() => deleteJob(j.id)} style={{ marginLeft: 8 }}>Удалить</button>
        </div>
      ))}

      <h2>Все рекомендации</h2>
      <ul>
        {referrals?.map((r) => (
          <li key={r.id}>{r.candidateName} ({r.candidateContact}) — на «{r.jobPosting?.title}», рекомендовал: {r.referrer?.fullName}</li>
        ))}
        {referrals?.length === 0 && <li>Пока нет рекомендаций</li>}
      </ul>
    </div>
  );
}