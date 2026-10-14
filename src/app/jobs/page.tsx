"use client";
import { useState } from "react";
import { useGetActiveJobsQuery, useCreateReferralMutation, useGetMyReferralsQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import styles from "./jobs.module.css";
import { getErrorMessage } from "@/lib/errors";
import { FormError } from "@/components/FormError";

export default function JobsPage() {
  const { data: jobs, isLoading } = useGetActiveJobsQuery();
  const { data: myReferrals } = useGetMyReferralsQuery();
  const [createReferral] = useCreateReferralMutation();

  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [form, setForm] = useState({ candidateName: "", candidateContact: "", comment: "" });
  const [error, setError] = useState("");

  async function handleSubmit(jobId: string) {
    setError("");
    if (!form.candidateName || !form.candidateContact) return setError("Заполни имя и контакт кандидата");
    try {
      await createReferral({ jobId, ...form }).unwrap();
      setForm({ candidateName: "", candidateContact: "", comment: "" });
      setOpenJobId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось отправить рекомендацию"));
    }
  }

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Вакансии">
      <div className={styles.layout}>
        <div>
          {jobs?.length === 0 && <p className={styles.muted}>Сейчас нет открытых вакансий</p>}
          {jobs?.map((j) => (
            <section key={j.id} className={styles.card}>
              <div className={styles.head}>
                <h2 className={styles.title}>{j.title}</h2>
                {j.department && <span className={styles.chip}>{j.department}</span>}
              </div>
              {j.description && <p className={styles.desc}>{j.description}</p>}
              {openJobId === j.id ? (
                <div className={styles.referralForm}>
                  <input className="input" placeholder="Имя кандидата" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} />
                  <input className="input" placeholder="Контакт (телефон, почта, телеграм)" value={form.candidateContact} onChange={(e) => setForm({ ...form, candidateContact: e.target.value })} />
                  <textarea className="textarea" placeholder="Комментарий (необязательно)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} />
                  <FormError message={error} />
                  <div className={styles.actions}>
                    <Button onClick={() => handleSubmit(j.id)}>Отправить рекомендацию</Button>
                    <Button variant="secondary" onClick={() => { setOpenJobId(null); setError(""); }}>Отмена</Button>
                  </div>
                </div>
              ) : (
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={() => { setOpenJobId(j.id); setError(""); }}>Порекомендовать</Button>
                </div>
              )}
            </section>
          ))}
        </div>

        <aside className={styles.side}>
          <div className={styles.sideTitle}>Мои рекомендации <span className={styles.count}>{myReferrals?.length ?? 0}</span></div>
          {myReferrals?.map((r) => (
            <div key={r.id} className={styles.ref}>
              <div className={styles.refName}>{r.candidateName}</div>
              <div className={styles.refMeta}>на «{r.jobPosting?.title}»</div>
            </div>
          ))}
          {myReferrals?.length === 0 && <p className={styles.muted}>Пока нет рекомендаций</p>}
        </aside>
      </div>
    </PageShell>
  );
}
