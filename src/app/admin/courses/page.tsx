"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAdminCoursesQuery, useCreateCourseMutation, useDeleteCourseMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import buttonStyles from "@/components/Button.module.css";
import styles from "./courses-admin.module.css";

export default function AdminCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: courses } = useGetAdminCoursesQuery();
  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [accessMode, setAccessMode] = useState<"OPEN" | "RESTRICTED">("OPEN");
  const [error, setError] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  const categories = Array.from(
    new Set((courses ?? []).map((c) => c.category).filter((c): c is string => Boolean(c)))
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await createCourse({ title, description, category, accessMode }).unwrap();
      router.push(`/admin/courses/${created.id}`);
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось создать курс");
    }
  }

  function handleDelete(id: string, courseTitle: string) {
    const ok = confirm(
      `Удалить курс «${courseTitle}»? Вместе с ним безвозвратно удалятся уроки, тест и все результаты прохождения.`
    );
    if (ok) deleteCourse(id);
  }

  return (
    <PageShell title="Корпоративный университет: курсы" wide>
      <form onSubmit={handleCreate} className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название курса" />
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          rows={3}
        />
        <div className={styles.formRow}>
          <input
            className="input"
            list="course-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Направление (например, Продажи)"
          />
          <datalist id="course-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <select className="input" value={accessMode} onChange={(e) => setAccessMode(e.target.value as "OPEN" | "RESTRICTED")}>
            <option value="OPEN">Открыт всем сотрудникам</option>
            <option value="RESTRICTED">Доступ выдаёт HR</option>
          </select>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div><Button type="submit" disabled={creating}>Создать курс</Button></div>
      </form>

      {courses?.map((c) => (
        <Card key={c.id}>
          <div className={styles.row}>
            <div>
              <CardTitle>
                {c.title}
                <span className={`${styles.badge} ${c.status === "PUBLISHED" ? styles.published : styles.draft}`}>
                  {c.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
                </span>
              </CardTitle>
              <p className={styles.meta}>
                {c.category ?? "Без направления"} · уроков: {c.lessonsCount} · тестов: {c.testsCount} ·{" "}
                {c.accessMode === "OPEN" ? "открыт всем" : `доступ выдан: ${c.accessCount}`}
              </p>
            </div>
            <div className={styles.actions}>
              <Link
                href={`/admin/courses/${c.id}`}
                className={`${buttonStyles.btn} ${buttonStyles.secondary} ${buttonStyles.small}`}
              >
                Редактировать
              </Link>
              <Button size="sm" variant="danger" onClick={() => handleDelete(c.id, c.title)}>Удалить</Button>
            </div>
          </div>
        </Card>
      ))}
      {courses?.length === 0 && <p className="text-s">Курсов пока нет</p>}
    </PageShell>
  );
}