"use client";
import { useState } from "react";
import Link from "next/link";
import { useGetLearningQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusPill, testStatusKey, type StatusKey } from "@/components/LearningStatus";
import buttonStyles from "@/components/Button.module.css";
import styles from "./learning.module.css";

type Group = "new" | "started" | "done";

interface Item {
  key: string;
  kind: "course" | "test";
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: StatusKey;
  group: Group;
  href: string;
  meta: string;
  percent: number | null;
}

function groupOf(status: StatusKey): Group {
  if (status === "NOT_STARTED") return "new";
  if (status === "DONE") return "done";
  return "started";
}

export default function LearningPage() {
  const { data, isLoading } = useGetLearningQuery(undefined, { refetchOnMountOrArgChange: true });
  const [kind, setKind] = useState<"all" | "course" | "test">("all");
  const [group, setGroup] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const courses = data?.courses ?? [];
  const tests = data?.tests ?? [];
  const attempts = data?.attempts ?? [];

  const courseItems: Item[] = courses.map((c) => {
    const status: StatusKey =
      c.state === "COMPLETED" ? "DONE" : c.state === "IN_PROGRESS" ? "IN_PROGRESS" : "NOT_STARTED";
    const steps = c.lessonsTotal + c.testsTotal;
    return {
      key: `course-${c.id}`,
      kind: "course",
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      status,
      group: groupOf(status),
      href: `/learning/courses/${c.id}`,
      meta: `Уроков: ${c.lessonsTotal}${c.testsTotal > 0 ? ` · Тестов: ${c.testsTotal}` : ""}`,
      percent: steps > 0 ? Math.round(((c.lessonsDone + c.testsPassed) / steps) * 100) : 0,
    };
  });

  const testItems: Item[] = tests.map((t) => {
    const status = testStatusKey(t.state);
    return {
      key: `test-${t.id}`,
      kind: "test",
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      status,
      group: groupOf(status),
      href: `/learning/tests/${t.id}`,
      meta: `Вопросов: ${t.questionsCount} · Попыток: ${t.attemptsUsed} из ${t.maxAttempts}`,
      percent: null,
    };
  });

  const items = [...courseItems, ...testItems];
  const categories = Array.from(
    new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))
  ).sort();

  const q = search.trim().toLowerCase();
  const filtered = items.filter(
    (i) =>
      (kind === "all" || i.kind === kind) &&
      (!group || i.group === group) &&
      (!category || i.category === category) &&
      (!q || i.title.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q))
  );

  const inProgress = courseItems.filter((i) => i.status === "IN_PROGRESS");
  const completedCourses = courseItems.filter((i) => i.status === "DONE").length;
  const passedTests = new Set(attempts.filter((a) => a.status === "GRADED" && a.passed).map((a) => a.testId)).size;
  const inReview = attempts.filter((a) => a.status === "IN_REVIEW").length;
 // Один результат на каждый тест: сданная попытка важнее остальных, дальше попытка на проверке, иначе последняя
const results = (() => {
  const byTest = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const list = byTest.get(a.testId) ?? [];
    list.push(a);
    byTest.set(a.testId, list);
  }
  return Array.from(byTest.values())
    .map((list) => {
      const passed = list.find((a) => a.status === "GRADED" && a.passed);
      const review = list.find((a) => a.status === "IN_REVIEW");
      const chosen = passed ?? review ?? list[0];
      const status: StatusKey = passed ? "DONE" : review ? "IN_REVIEW" : "FAILED";
      return { ...chosen, status, attemptsCount: list.length };
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
})();
const visibleResults = showAllAttempts ? results : results.slice(0, 8);

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Обучение">
      <div className={styles.stats}>
        <div className={styles.stat}><div className={styles.statNumber}>{inProgress.length}</div><div className={styles.statLabel}>курсов в процессе</div></div>
        <div className={styles.stat}><div className={styles.statNumber}>{completedCourses}</div><div className={styles.statLabel}>курсов пройдено</div></div>
        <div className={styles.stat}><div className={styles.statNumber}>{passedTests}</div><div className={styles.statLabel}>тестов сдано</div></div>
        <div className={styles.stat}><div className={styles.statNumber}>{inReview}</div><div className={styles.statLabel}>на проверке</div></div>
      </div>

      {inProgress.length > 0 && (
        <>
          <h2 className={`${styles.sectionTitle} text-h2`}>Продолжить</h2>
          <div className={styles.continueRow}>
            {inProgress.map((i) => (
              <div key={i.key} className={styles.continueCard}>
                <div className={styles.continueTitle}>{i.title}</div>
                <ProgressBar percent={i.percent ?? 0} />
                <div className={styles.continueMeta}>Пройдено {i.percent}%</div>
                <div>
                  <Link href={i.href} className={`${buttonStyles.btn} ${buttonStyles.secondary} ${buttonStyles.small}`}>
                    Продолжить
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className={`${styles.sectionTitle} text-h2`}>Каталог</h2>
      <div className={styles.filters}>
        <input className={`input ${styles.search}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию и описанию" />
        <select className={`input ${styles.select}`} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все направления</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={`input ${styles.select}`} value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">Любой статус</option>
          <option value="new">Не начато</option>
          <option value="started">Начато</option>
          <option value="done">Пройдено</option>
        </select>
      </div>
      <div className={styles.kindTabs}>
        {([["all", "Все"], ["course", "Курсы"], ["test", "Тесты"]] as const).map(([value, label]) => (
          <Button key={value} size="sm" variant={kind === value ? "primary" : "secondary"} onClick={() => setKind(value)}>
            {label}
          </Button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.map((i) => (
          <Link key={i.key} href={i.href} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.kind}>{i.kind === "course" ? "Курс" : "Тест"}</span>
              {i.category && <span className={styles.category}>{i.category}</span>}
            </div>
            <div className={styles.cardTitle}>{i.title}</div>
            {i.description && <p className={styles.cardDesc}>{i.description}</p>}
            <div className={styles.cardBottom}>
              {i.percent !== null && i.status !== "NOT_STARTED" && <ProgressBar percent={i.percent} />}
              <div className={styles.cardFooter}>
                <span className={styles.cardMeta}>{i.meta}</span>
                <StatusPill status={i.status} kind={i.kind} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className={styles.empty}>
          {items.length === 0 ? "Пока нет доступных курсов и тестов" : "По выбранным фильтрам ничего не найдено"}
        </p>
      )}

{results.length > 0 && (
  <>
    <h2 className={`${styles.sectionTitle} text-h2`}>Результаты тестов</h2>
    {visibleResults.map((r) => (
      <div key={r.testId} className={styles.historyRow}>
        <div>
          <Link href={`/learning/tests/${r.testId}`}>{r.testTitle}</Link>
          <div className={styles.historyMeta}>
            {r.courseTitle ? `Курс «${r.courseTitle}» · ` : ""}
            {new Date(r.submittedAt).toLocaleDateString("ru-RU")}
            {r.attemptsCount > 1 ? ` · попыток: ${r.attemptsCount}` : ""}
          </div>
        </div>
        <StatusPill status={r.status} kind="test" />
      </div>
    ))}
    {results.length > 8 && (
      <Button size="sm" variant="secondary" onClick={() => setShowAllAttempts(!showAllAttempts)}>
        {showAllAttempts ? "Свернуть" : `Показать все (${results.length})`}
      </Button>
    )}
  </>
)}
    </PageShell>
  );
}