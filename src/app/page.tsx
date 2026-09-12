"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardTitle } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import buttonStyles from "@/components/Button.module.css";
import styles from "./home.module.css";

const EMPLOYEE_TILES = [
  { href: "/requests", title: "Мои заявки", desc: "Справки, отпуска, техника и доступы" },
  { href: "/knowledge-base", title: "База знаний", desc: "Документы, регламенты, новости" },
  { href: "/surveys", title: "Опросы", desc: "Pulse-опросы и ящик предложений" },
  { href: "/onboarding", title: "Онбординг", desc: "Чек-лист задач и наставник" },
  { href: "/jobs", title: "Вакансии", desc: "Открытые позиции и рекомендации" },
  { href: "/profile", title: "Профиль", desc: "Личный кабинет и оргструктура компании" },
];

export default function HomePage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <PageShell title="HR-портал">
        <p className="text-s">Войдите, чтобы продолжить.</p>
        <Link href="/login" className={`${buttonStyles.btn} ${buttonStyles.primary}`}>
          Войти
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell title={`Привет, ${session.user.name?.split(" ")[0] ?? ""}!`}>
      <div className={styles.grid}>
        {EMPLOYEE_TILES.map((t) => (
          <Link key={t.href} href={t.href} className={styles.tileLink}>
            <Card>
              <CardTitle>{t.title}</CardTitle>
              <p className="text-xs">{t.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

    </PageShell>
  );
}