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
import { Button } from "@/components/Button";
import styles from "./jobs-admin.module.css";
import { getErrorMessage } from "@/lib/errors";
import { FormError } from "@/components/FormError";

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
  const [error, setError] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createJob({ title, department, description }).unwrap();
      setTitle(""); setDepartment(""); setDescription("");
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось создать вакансию"));
    }
  }

  return (
    <PageShell title="Вакансии и рекомендации" wide>
      <div className={styles.layout}>
        <form onSubmit={handleSubmit} className={styles.panel}>
          <h2 className={styles.panelTitle}>Новая вакансия</h2>
          <label className={styles.field}>
            <span className={styles.label}>Название</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название вакансии" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Отдел</span>
            <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Отдел" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Описание</span>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" rows={4} />
          </label>
          <FormError message={error} />
          <Button type="submit">Создать вакансию</Button>
        </form>

        <div>
          <h2 className={styles.listTitle}>Вакансии <span className={styles.count}>{jobs?.length ?? 0}</span></h2>
          {jobs?.map((j) => (
            <div key={j.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>{j.title}</div>
                <div className={styles.meta}>
                  {j.department ? `${j.department} · ` : ""}рекомендаций: {j.referralsCount ?? 0}
                </div>
              </div>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={`${styles.toggle} ${j.isActive ? styles.toggleOn : ""}`}
                  aria-pressed={j.isActive}
                  onClick={() => updateJob({ id: j.id, isActive: !j.isActive })}
                >
                  <span className={styles.check}>{j.isActive ? "✓" : ""}</span> Активна
                </button>
                <Button size="sm" variant="danger" onClick={() => deleteJob(j.id)}>Удалить</Button>
              </div>
            </div>
          ))}
          {jobs?.length === 0 && <p className={styles.empty}>Вакансий пока нет</p>}

          <h2 className={`${styles.listTitle} ${styles.second}`}>Все рекомендации <span className={styles.count}>{referrals?.length ?? 0}</span></h2>
          {referrals?.map((r) => (
            <div key={r.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>{r.candidateName}</div>
                <div className={styles.meta}>{r.candidateContact}</div>
                <div className={styles.meta}>
                  на «{r.jobPosting?.title}» · рекомендовал: {r.referrer?.fullName}
                </div>
              </div>
            </div>
          ))}
          {referrals?.length === 0 && <p className={styles.empty}>Пока нет рекомендаций</p>}
        </div>
      </div>
    </PageShell>
  );
}
