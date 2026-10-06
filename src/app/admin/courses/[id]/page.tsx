"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useGetAdminCourseQuery,
  useUpdateCourseMutation,
  useAddLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useCreateTestMutation,
  useGrantCourseAccessMutation,
  useRevokeCourseAccessMutation,
  useUploadFileMutation,
  useGetUsersQuery,
  type CourseDetail,
  type ContentFile,
} from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { TestEditor } from "@/components/TestEditor";
import styles from "./course-editor.module.css";

function MainSection({ course }: { course: CourseDetail }) {
  const [updateCourse] = useUpdateCourseMutation();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");
  const [category, setCategory] = useState(course.category ?? "");
  const [accessMode, setAccessMode] = useState<"OPEN" | "RESTRICTED">(course.accessMode);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function save() {
    try {
      await updateCourse({ id: course.id, title, description, category, accessMode }).unwrap();
      setMessage({ text: "Сохранено", error: false });
    } catch (err: any) {
      setMessage({ text: err?.data?.error || "Не удалось сохранить", error: true });
    }
  }

  async function toggleStatus() {
    try {
      await updateCourse({ id: course.id, status: course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }).unwrap();
      setMessage(null);
    } catch (err: any) {
      setMessage({ text: err?.data?.error || "Не удалось изменить статус", error: true });
    }
  }

  return (
    <section className={styles.section}>
      <h2 className="text-h2">Основное</h2>
      <div className={styles.statusRow}>
        <span className={`${styles.badge} ${course.status === "PUBLISHED" ? styles.published : styles.draft}`}>
          {course.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
        </span>
        <Button size="sm" variant={course.status === "PUBLISHED" ? "secondary" : "primary"} onClick={toggleStatus}>
          {course.status === "PUBLISHED" ? "Снять с публикации" : "Опубликовать"}
        </Button>
      </div>
      <div className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название курса" />
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Описание" />
        <div className={styles.formRow}>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Направление" />
          <select className="input" value={accessMode} onChange={(e) => setAccessMode(e.target.value as "OPEN" | "RESTRICTED")}>
            <option value="OPEN">Открыт всем сотрудникам</option>
            <option value="RESTRICTED">Доступ выдаёт HR</option>
          </select>
        </div>
        {message && <p className={message.error ? styles.error : styles.ok}>{message.text}</p>}
        <div><Button type="button" onClick={save}>Сохранить</Button></div>
      </div>
    </section>
  );
}

function LessonsSection({ course }: { course: CourseDetail }) {
  const [addLesson] = useAddLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();
  const [uploadFile] = useUploadFileMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setVideoUrl("");
    setFiles(null);
    setFileKey((k) => k + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      let uploaded: ContentFile[] | undefined;
      if (files && files.length > 0) {
        uploaded = [];
        for (const f of Array.from(files)) {
          const formData = new FormData();
          formData.append("file", f);
          const res = await uploadFile(formData).unwrap();
          uploaded.push({ url: res.url, name: res.name });
        }
      }
      if (editingId) {
        await updateLesson({ lessonId: editingId, title, content, videoUrl, files: uploaded }).unwrap();
      } else {
        await addLesson({ courseId: course.id, title, content, videoUrl, files: uploaded }).unwrap();
      }
      reset();
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось сохранить урок");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(l: CourseDetail["lessons"][number]) {
    setEditingId(l.id);
    setTitle(l.title);
    setContent(l.content);
    setVideoUrl(l.videoUrl ?? "");
    setFiles(null);
    setFileKey((k) => k + 1);
    setError("");
  }

  function handleDelete(id: string, lessonTitle: string) {
    if (confirm(`Удалить урок «${lessonTitle}»? Отметки о прохождении тоже удалятся.`)) deleteLesson(id);
  }

  return (
    <section className={styles.section}>
      <h2 className="text-h2">Уроки</h2>
      {course.lessons.map((l, i) => (
        <div key={l.id} className={styles.row}>
          <span className="text-s">
            {i + 1}. <strong>{l.title}</strong>
            {l.videoUrl ? " · 🎬 видео" : ""}
            {l.files && l.files.length > 0 ? ` · 📎 ${l.files.length}` : ""}
          </span>
          <div className={styles.actions}>
            <Button size="sm" variant="secondary" onClick={() => startEdit(l)}>Изменить</Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(l.id, l.title)}>Удалить</Button>
          </div>
        </div>
      ))}
      {course.lessons.length === 0 && <p className="text-s">Уроков пока нет</p>}

      <h3 className="text-h4" style={{ margin: "16px 0 8px" }}>{editingId ? "Редактирование урока" : "Новый урок"}</h3>
      <form onSubmit={submit} className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название урока" />
        <textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Текст урока" />
        <input className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Ссылка на видео (YouTube, Rutube, Google Drive)" />
        <div>
          <label className="text-xs">Файлы к уроку (можно несколько)</label>
          <input key={fileKey} type="file" multiple onChange={(e) => setFiles(e.target.files)} />
          {editingId && <p className={styles.hint}>Если выбрать новые файлы, они заменят прежние. Если не выбирать, прежние останутся.</p>}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="submit" disabled={saving}>{editingId ? "Сохранить урок" : "Добавить урок"}</Button>
          {editingId && <Button type="button" variant="secondary" onClick={reset}>Отмена</Button>}
        </div>
      </form>
    </section>
  );
}

function TestsSection({ course }: { course: CourseDetail }) {
  const [createTest, { isLoading }] = useCreateTestMutation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await createTest({ title, courseId: course.id }).unwrap();
      setTitle("");
      setOpenId(created.id);
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось создать тест");
    }
  }

  return (
    <section className={styles.section}>
      <h2 className="text-h2">Тесты курса</h2>
      <p className={styles.hint} style={{ marginBottom: 12 }}>
        Тестов может быть несколько, например промежуточный и итоговый. Курс считается пройденным, когда пройдены все уроки и сданы все тесты.
      </p>

      {course.tests.map((t) => (
        <div key={t.id} className={styles.testBlock}>
          <div className={styles.testHead}>
            <span className="text-s">
              <strong>{t.title}</strong> · вопросов: {t.questionsCount}
              {t.attemptsCount > 0 ? ` · попыток: ${t.attemptsCount}` : ""}
            </span>
            <Button size="sm" variant="secondary" onClick={() => setOpenId(openId === t.id ? null : t.id)}>
              {openId === t.id ? "Свернуть" : "Редактировать"}
            </Button>
          </div>
          {openId === t.id && (
            <div className={styles.testBody}>
              <TestEditor testId={t.id} />
            </div>
          )}
        </div>
      ))}
      {course.tests.length === 0 && <p className="text-s">Тестов пока нет</p>}

      <form onSubmit={add} className={styles.form} style={{ marginTop: 16 }}>
        <div className={styles.formRow}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название нового теста, например «Итоговый тест»" />
          <div><Button type="submit" variant="secondary" disabled={isLoading}>+ Добавить тест</Button></div>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </section>
  );
}

function AccessSection({ course }: { course: CourseDetail }) {
  const { data: users } = useGetUsersQuery();
  const [grant] = useGrantCourseAccessMutation();
  const [revoke] = useRevokeCourseAccessMutation();
  const [userId, setUserId] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const grantedIds = new Set(course.access.map((a) => a.user.id));
  const available = (users ?? []).filter((u) => !grantedIds.has(u.id));
  const departments = Array.from(
    new Set((users ?? []).map((u) => u.department).filter((d): d is string => Boolean(d)))
  ).sort();

async function grantUser() {
  if (!userId) return;
  setError("");
  setMessage("");
  try {
    await grant({ courseId: course.id, userIds: [userId] }).unwrap();
    setUserId("");
    setMessage("Доступ выдан");
  } catch (err: any) {
    setError(err?.data?.error || `Не удалось выдать доступ (код ${err?.status ?? "?"})`);
  }
}

async function grantDepartment() {
  if (!department) return;
  setError("");
  setMessage("");
  try {
    const res = await grant({ courseId: course.id, department }).unwrap();
    setMessage(res.granted > 0 ? `Новых доступов: ${res.granted}` : "У всех сотрудников отдела доступ уже был");
  } catch (err: any) {
    setError(err?.data?.error || `Не удалось выдать доступ (код ${err?.status ?? "?"})`);
  }
}

  return (
    <section className={styles.section}>
      <h2 className="text-h2">Доступ</h2>
      <p className={styles.hint}>Курс виден только тем, кому выдан доступ.</p>

      <div className={styles.form} style={{ marginTop: 12 }}>
        <div className={styles.formRow}>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Выбрать сотрудника</option>
            {available.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
          <div><Button type="button" variant="secondary" onClick={grantUser}>Выдать доступ</Button></div>
        </div>
        <div className={styles.formRow}>
          <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Выбрать отдел</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div><Button type="button" variant="secondary" onClick={grantDepartment}>Выдать всему отделу</Button></div>
        </div>
        {message && <p className={styles.ok}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {course.access.map((a) => (
        <div key={a.id} className={styles.row}>
          <span className="text-s">
            {a.user.fullName}{a.user.department ? ` · ${a.user.department}` : ""}
          </span>
          <Button size="sm" variant="danger" onClick={() => revoke({ courseId: course.id, userId: a.user.id })}>Отозвать</Button>
        </div>
      ))}
      {course.access.length === 0 && <p className="text-s">Доступ пока никому не выдан</p>}
    </section>
  );
}

export default function CourseEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: course, isLoading } = useGetAdminCourseQuery(params.id, { skip: !params.id });

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN" || isLoading) {
    return <p className="text-s">Загрузка...</p>;
  }
  if (!course) {
    return <PageShell title="Курс не найден"><p className="text-s">Возможно, он был удалён.</p></PageShell>;
  }

  return (
    <PageShell title={course.title} wide>
      <MainSection course={course} />
      <LessonsSection course={course} />
      <TestsSection course={course} />
      {course.accessMode === "RESTRICTED" && <AccessSection course={course} />}
    </PageShell>
  );
}