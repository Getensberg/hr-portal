"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const EMPLOYEE_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/requests", label: "Мои заявки" },
  { href: "/knowledge-base", label: "База знаний" },
  { href: "/surveys", label: "Опросы" },
  { href: "/onboarding", label: "Онбординг" },
  { href: "/jobs", label: "Вакансии" },
];

const ADMIN_LINKS = [
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/content", label: "Контент" },
  { href: "/admin/surveys", label: "Опросы" },
  { href: "/admin/onboarding", label: "Онбординг" },
  { href: "/admin/jobs", label: "Вакансии" },
];

export function Nav() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <nav style={{ padding: "12px 24px", borderBottom: "1px solid #ccc" }}>
        <Link href="/login">Войти</Link>
      </nav>
    );
  }

  return (
    <nav style={{ padding: "12px 24px", borderBottom: "1px solid #ccc", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        {EMPLOYEE_LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        {session.user.role === "HR_ADMIN" && (
          <>
            <span style={{ color: "#999" }}>|</span>
            {ADMIN_LINKS.map((l) => <Link key={l.href} href={l.href} style={{ fontWeight: "bold" }}>{l.label}</Link>)}
          </>
        )}
      </div>
      <div>
        <span style={{ marginRight: 12, fontSize: 13, color: "#666" }}>
          {session.user.name} ({session.user.role})
        </span>
        <button onClick={() => signOut({ callbackUrl: "/login" })}>Выйти</button>
      </div>
    </nav>
  );
}