"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetLearningCourseQuery, useCompleteLessonMutation } from "@/store/api";
import { getVideoEmbedUrl } from "@/lib/video";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusPill, testStatusKey } from "@/components/LearningStatus";
import styles from "./course.module.css";

export default function LearningCoursePage() {
  const params = useParams<{ id: string }>();
  const { data: course, isLoading } = useGetLearningCourseQuery(params.id, {
    skip: !params.id,
    refetchOnMountOrArgChange: true,
  });
  const [completeLesson, { isLoading: saving }] = useCompleteLessonMutation();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (isLoading) return <p className="text-s">Загрузка...</p>;
  if (!course) {
    return (
      <PageShell title="Курс не найден">
        <p className="text-s">Он мог быть снят с публикации, или у вас нет к нему доступа.</p>
        <Link href="/learning">← К каталогу</Link>
      </PageShell>
    );
  }

  const lessons = course.lessons;
  const active = lessons.find((l) => l.id === activeId) ?? lessons.find((l) => !l.done) ?? lessons[0];
  const activeIndex = active ? lessons.indexOf(active) : -1;
  const prev = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  const lessonsDone = lessons.filter((l) => l.done).length;
  const testsPassed = course.tests.filter((t) => t.state === "PASSED").length;
  const steps = lessons.length + course.tests.length;
  const percent = steps > 0 ? Math.round(((lessonsDone + testsPassed) / steps) * 100) : 0;
  const embed = active?.videoUrl ? getVideoEmbedUrl(active.videoUrl) : null;

  async function toggleDone() {
    if (!active) return;
    const willBeDone = !active.done;
    setActiveId(active.id);
    try {
      await completeLesson({ lessonId: active.id, done: willBeDone }).unwrap();
      if (willBeDone && next) setActiveId(next.id);
    } catch {
      // состояние обновится при следующей загрузке
    }
  }

  return (
    <PageShell title={course.title} wide>
      <div className={styles.header}>
        {course.category && <div className={styles.headerMeta}>{course.category}</div>}
        {course.description && <p className={styles.desc}>{course.description}</p>}
        <ProgressBar percent={percent} />
        <div className={styles.progressLine}>
          Пройдено {lessonsDone} из {lessons.length} уроков
          {course.tests.length > 0 ? ` · сдано тестов: ${testsPassed} из ${course.tests.length}` : ""}
        </div>
      </div>

      {course.completed && <div className={styles.completed}>Курс пройден. Поздравляем!</div>}

      <div className={styles.layout}>
        <aside className={styles.aside}>
          <h3 className={styles.asideTitle}>Уроки</h3>
          {lessons.map((l, i) => (
            <button
              key={l.id}
              type="button"
              className={`${styles.outlineItem} ${active?.id === l.id ? styles.outlineActive : ""}`}
              onClick={() => setActiveId(l.id)}
            >
              <span className={`${styles.mark} ${l.done ? styles.markDone : ""}`}>{l.done ? "✓" : "○"}</span>
              <span>{i + 1}. {l.title}</span>
            </button>
          ))}

          {course.tests.length > 0 && (
            <div className={styles.asideGap}>
              <h3 className={styles.asideTitle}>Тесты</h3>
              {course.tests.map((t) => (
                <Link key={t.id} href={`/learning/tests/${t.id}`} className={styles.testLink}>
                  <span className={styles.testTitle}>{t.title}</span>
                  <span className={styles.testMeta}>
                    <span>Попыток: {t.attemptsUsed} из {t.maxAttempts}</span>
                    <StatusPill status={testStatusKey(t.state)} kind="test" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </aside>

        <section className={styles.lesson}>
          {active ? (
            <>
              <h2 className={`${styles.lessonTitle} text-h2`}>{active.title}</h2>

              {active.videoUrl &&
                (embed ? (
                  <div className={styles.video}>
                    <iframe src={embed} title={active.title} allowFullScreen />
                  </div>
                ) : (
                  <a className={styles.videoLink} href={active.videoUrl} target="_blank" rel="noopener noreferrer">
                    🎬 Открыть видео
                  </a>
                ))}

              {active.content && <p className={styles.text}>{active.content}</p>}

              {active.files && active.files.length > 0 && (
                <div className={styles.files}>
                  {active.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">📎 {f.name}</a>
                  ))}
                </div>
              )}

              <div className={styles.lessonNav}>
                <Button size="sm" variant="secondary" disabled={!prev} onClick={() => prev && setActiveId(prev.id)}>
                  ← Назад
                </Button>
                <div className={styles.navRight}>
                  {active.done ? (
                    <>
                      <span className={styles.doneBadge}>✓ Урок пройден</span>
                      <Button size="sm" variant="secondary" disabled={saving} onClick={toggleDone}>Снять отметку</Button>
                    </>
                  ) : (
                    <Button disabled={saving} onClick={toggleDone}>
                      {next ? "Пройден, дальше →" : "Отметить пройденным"}
                    </Button>
                  )}
                  {next && active.done && (
                    <Button size="sm" variant="secondary" onClick={() => setActiveId(next.id)}>Дальше →</Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-s">В этом курсе пока нет уроков.</p>
          )}
        </section>
      </div>
    </PageShell>
  );
}