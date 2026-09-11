"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login") return null;

  const segments = pathname.split("/").filter(Boolean);
  let href = "";

  return (
    <nav className={styles.breadcrumbs}>
      <Link href="/">Главная</Link>
      {segments.map((seg, i) => {
        href += `/${seg}`;
        const isLast = i === segments.length - 1;
        const label = LABELS[seg] ?? seg;
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