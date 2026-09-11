"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "./Button";
import styles from "./Nav.module.css";

const EMPLOYEE_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/requests", label: "Мои заявки" },
  { href: "/knowledge-base", label: "База знаний" },
  { href: "/surveys", label: "Опросы" },
  { href: "/onboarding", label: "Онбординг" },
  { href: "/jobs", label: "Вакансии" },
  { href: "/org", label: "Оргструктура" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Админка" },
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/content", label: "Контент" },
  { href: "/admin/surveys", label: "Опросы" },
  { href: "/admin/onboarding", label: "Онбординг" },
  { href: "/admin/jobs", label: "Вакансии" },
  { href: "/admin/org", label: "Оргструктура" },
];


export function Nav() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;

  if (!session) {
    return (
      <nav className={styles.nav}>
        <Link href="/login">Войти</Link>
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.links}>
        {EMPLOYEE_LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        {session.user.role === "HR_ADMIN" && (
          <>
            <span className={styles.divider}>|</span>
            {ADMIN_LINKS.map((l) => <Link key={l.href} href={l.href} className={styles.adminLink}>{l.label}</Link>)}
          </>
        )}
      </div>
      <div>
        <span className={styles.userInfo}>{session.user.name} ({session.user.role})</span>
        <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>Выйти</Button>
      </div>
    </nav>
  );
}