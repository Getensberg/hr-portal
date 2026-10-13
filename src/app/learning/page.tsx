"use client";
import { useState } from "react";
import Link from "next/link";
import { useGetLearningQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusPill, testStatusKey, type StatusKey } from "@/components/LearningStatus";
import buttonStyles from "@/components/Button.module.css";
import styles from "./learning.module.css";

type Group = "new" | "started" | "done";

const STATUS_OPTIONS = [
  { value: "", label: "Любой статус" },
  { value: "new", label: "Не начато" },
  { value: "started", label: "Начато" },
  { value: "done", label: "Пройдено" },
];

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
  // Статистика по тестам: сдано, осталось, не сдано, на проверке
  const testTotal = testItems.length;
  const testPassed = testItems.filter((t) => t.status === "DONE").length;
  const testRemaining = testItems.filter((t) => t.status === "NOT_STARTED").length;
  const testFailed = testItems.filter((t) => t.status === "FAILED").length;
  const testReview = testItems.filter((t) => t.status === "IN_REVIEW").length;
  const testPercent = testTotal ? Math.round((testPassed / testTotal) * 100) : 0;

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Обучение">
      <div className={`${styles.top} ${inProgress.length > 0 ? styles.topWithContinue : ""}`}>

      {inProgress.length > 0 && (
        <div className={styles.continueBlock}>
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
        </div>
      )}
      </div>

      <h2 className={`${styles.sectionTitle} text-h2`}>Каталог</h2>
      <div className={styles.filters}>
        <input className={`input ${styles.search}`} aria-label="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию и описанию" />
        <Select className={styles.select} size="sm" value={category} onChange={setCategory} ariaLabel="Направление" options={[{ value: "", label: "Все направления" }, ...categories.map((c) => ({ value: c, label: c }))]} />
        <Select className={styles.select} size="sm" value={group} onChange={setGroup} ariaLabel="Статус" options={STATUS_OPTIONS} />
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

      {testTotal > 0 && (
        <section className={styles.testStats}>
          <h2 className={`${styles.sectionTitle} text-h2`}>Мои тесты</h2>
          <div className={styles.testStatsCard}>
            <div className={styles.testStatsTop}>
              <span className={styles.testStatsLabel}>Сдано {testPassed} из {testTotal}</span>
              <span className={styles.testStatsPercent}>{testPercent}%</span>
            </div>
            <ProgressBar percent={testPercent} />
            <div className={styles.testStatsGrid}>
              <div className={`${styles.testTile} ${styles.tileMint}`}><div className={styles.tileNumber}>{testPassed}</div><div className={styles.tileLabel}>сдано</div></div>
              <div className={`${styles.testTile} ${styles.tileSky}`}><div className={styles.tileNumber}>{testRemaining}</div><div className={styles.tileLabel}>осталось пройти</div></div>
              <div className={`${styles.testTile} ${styles.tileRose}`}><div className={styles.tileNumber}>{testFailed}</div><div className={styles.tileLabel}>не сдано</div></div>
              <div className={`${styles.testTile} ${styles.tileSand}`}><div className={styles.tileNumber}>{testReview}</div><div className={styles.tileLabel}>на проверке</div></div>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}