"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGetContentByIdQuery } from "@/store/api";
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
  const { data: newsItem } = useGetContentByIdQuery(newsMatch?.[1] ?? "", { skip: !newsMatch });

  if (pathname === "/" || pathname === "/login") return null;

  const segments = pathname.split("/").filter(Boolean);
  const virtualParent = VIRTUAL_PARENTS[segments[0]];
  let href = "";

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
        const label = isLast && newsMatch ? (newsItem?.title ?? "Загрузка...") : (LABELS[seg] ?? seg);
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