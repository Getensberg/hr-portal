"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useGetContentByIdQuery,
  useGetAdminCourseQuery,
  useGetAdminTestQuery,
  useGetLearningCourseQuery,
  useGetLearningTestQuery,
} from "@/store/api";
import styles from "./Breadcrumbs.module.css";

const LABELS: Record<string, string> = {
  requests: "Мои заявки",
  "knowledge-base": "База знаний",
  surveys: "Опросы",
  onboarding: "Онбординг",
  jobs: "Вакансии",
  admin: "Админка",
  content: "Контент",
  org: "Оргструктура",
  news: "Новости и статьи",
  profile: "Профиль",
  documents: "Документы",
  gallery: "Галерея",
  users: "Сотрудники",
  calendar: "Календарь",
  settings: "Настройки",
  manager: "Моя команда",
  courses: "Курсы",
  tests: "Тесты",
  learning: "Обучение",
  reviews: "Проверка тестов",
};

// Разделы, которые логически живут внутри базы знаний,
// хотя физически их адрес не вложен (/news, а не /knowledge-base/news)
const VIRTUAL_PARENTS: Record<string, { href: string; label: string }> = {
  news: { href: "/knowledge-base", label: "База знаний" },
  documents: { href: "/knowledge-base", label: "База знаний" },
  gallery: { href: "/knowledge-base", label: "База знаний" },
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const newsMatch = pathname.match(/^\/news\/([^/]+)$/);
  const courseMatch = pathname.match(/^\/admin\/courses\/([^/]+)$/);
  const testMatch = pathname.match(/^\/admin\/tests\/([^/]+)$/);
  const learnCourseMatch = pathname.match(/^\/learning\/courses\/([^/]+)$/);
  const learnTestMatch = pathname.match(/^\/learning\/tests\/([^/]+)$/);

  const { data: newsItem } = useGetContentByIdQuery(newsMatch?.[1] ?? "", { skip: !newsMatch });
  const { data: courseItem } = useGetAdminCourseQuery(courseMatch?.[1] ?? "", { skip: !courseMatch });
  const { data: testItem } = useGetAdminTestQuery(testMatch?.[1] ?? "", { skip: !testMatch });
  const { data: learnCourse } = useGetLearningCourseQuery(learnCourseMatch?.[1] ?? "", { skip: !learnCourseMatch });
  const { data: learnTest } = useGetLearningTestQuery(learnTestMatch?.[1] ?? "", { skip: !learnTestMatch });

  if (pathname === "/" || pathname === "/login") return null;

  const segments = pathname.split("/").filter(Boolean);
  const virtualParent = VIRTUAL_PARENTS[segments[0]];
  let href = "";

  function labelFor(seg: string, isLast: boolean): string {
    if (isLast) {
      if (newsMatch) return newsItem?.title ?? "Загрузка...";
      if (courseMatch) return courseItem?.title ?? "Загрузка...";
      if (testMatch) return testItem?.title ?? "Загрузка...";
      if (learnCourseMatch) return learnCourse?.title ?? "Загрузка...";
      if (learnTestMatch) return learnTest?.title ?? "Загрузка...";
    }
    return LABELS[seg] ?? seg;
  }

  return (
    <nav className={styles.breadcrumbs}>
      <Link href="/">Главная</Link>
      {virtualParent && (
        <span>
          <span className={styles.sep}>›</span>
          <Link href={virtualParent.href}>{virtualParent.label}</Link>
        </span>
      )}
      {segments.map((seg, i) => {
        href += `/${seg}`;
        const isLast = i === segments.length - 1;
        const label = labelFor(seg, isLast);
        return (
          <span key={href}>
            <span className={styles.sep}>›</span>
            {isLast ? <span>{label}</span> : <Link href={href}>{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}