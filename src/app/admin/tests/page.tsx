"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAdminTestsQuery, useCreateTestMutation, useDeleteTestMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Select } from "@/components/Select";
import { FormError } from "@/components/FormError";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/Button";
import buttonStyles from "@/components/Button.module.css";
import styles from "../courses/courses-admin.module.css";

const ACCESS_OPTIONS = [
  { value: "OPEN", label: "Открыт всем сотрудникам" },
  { value: "RESTRICTED", label: "Доступ выдаёт HR" },
];

export default function AdminTestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: tests } = useGetAdminTestsQuery();
  const [createTest, { isLoading: creating }] = useCreateTestMutation();
  const [deleteTest] = useDeleteTestMutation();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [accessMode, setAccessMode] = useState<"OPEN" | "RESTRICTED">("OPEN");
  const [error, setError] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  const categories = Array.from(
    new Set((tests ?? []).map((t) => t.category).filter((c): c is string => Boolean(c)))
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await createTest({ title, category, accessMode }).unwrap();
      router.push(`/admin/tests/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось создать тест"));
    }
  }

  async function handleDelete(id: string, testTitle: string) {
    if (!confirm(`Удалить тест «${testTitle}» вместе со всеми вопросами?`)) return;
    try {
      await deleteTest(id).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось удалить тест"));
    }
  }

  return (
    <PageShell title="Корпоративный университет: отдельные тесты" wide>
      <form onSubmit={handleCreate} className={styles.form}>
        <h2 className={styles.formTitle}>Новый тест</h2>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название теста" />
        <div className={styles.formRow}>
          <input
            className="input"
            list="test-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Направление"
          />
          <datalist id="test-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <Select
            value={accessMode}
            onChange={(v) => setAccessMode(v as "OPEN" | "RESTRICTED")}
            options={ACCESS_OPTIONS}
            ariaLabel="Доступ"
          />
        </div>
        <FormError message={error || null} />
        <div><Button type="submit" disabled={creating}>Создать тест</Button></div>
      </form>

      {tests?.map((t) => (
        <div key={t.id} className={styles.item}>
          <div className={styles.row}>
            <div>
              <div className={styles.itemTitle}>
                {t.title}
                <span className={`${styles.badge} ${t.status === "PUBLISHED" ? styles.published : styles.draft}`}>
                  {t.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
                </span>
              </div>
              <p className={styles.meta}>
                {t.category ?? "Без направления"} · вопросов: {t.questionsCount} · попыток прохождения: {t.attemptsCount} ·{" "}
                {t.accessMode === "OPEN" ? "открыт всем" : `доступ выдан: ${t.accessCount}`}
              </p>
            </div>
            <div className={styles.actions}>
              <Link
                href={`/admin/tests/${t.id}`}
                className={`${buttonStyles.btn} ${buttonStyles.secondary} ${buttonStyles.small}`}
              >
                Редактировать
              </Link>
              <Button size="sm" variant="danger" onClick={() => handleDelete(t.id, t.title)}>Удалить</Button>
            </div>
          </div>
        </div>
      ))}
      {tests?.length === 0 && <p className="text-s">Отдельных тестов пока нет. Тесты внутри курсов создаются в редакторе курса.</p>}
    </PageShell>
  );
}