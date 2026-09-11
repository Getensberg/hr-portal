"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import styles from "../home.module.css";

const ADMIN_TILES = [
  { href: "/admin/requests", title: "Заявки", desc: "Очередь и статусы" },
  { href: "/admin/content", title: "Контент", desc: "Статьи, новости, регламенты" },
  { href: "/admin/surveys", title: "Опросы", desc: "Создание и результаты" },
  { href: "/admin/onboarding", title: "Онбординг", desc: "Планы и задачи" },
  { href: "/admin/jobs", title: "Вакансии", desc: "Вакансии и рекомендации" },
  { href: "/admin/org", title: "Оргструктура", desc: "Управление файлом оргструктуры" },
];

export default function AdminHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p>Загрузка...</p>;
  }

  return (
    <PageShell title="Управление (HR)">
      <div className={styles.grid}>
        {ADMIN_TILES.map((t) => (
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