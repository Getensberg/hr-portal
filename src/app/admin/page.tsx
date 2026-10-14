"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import styles from "./admin-home.module.css";

function Icon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split("|").map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const TINTS = ["tintLilac", "tintMint", "tintPeach", "tintSky", "tintSand", "tintRose"] as const;

const ADMIN_TILES = [
  { href: "/admin/requests", title: "Заявки", desc: "Очередь и статусы", icon: "M9 5h6M9 3h6v4H9zM6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1|M8 12h8M8 16h5" },
  { href: "/admin/content", title: "Контент", desc: "Статьи, новости, регламенты", icon: "M5 5h11a2 2 0 0 1 2 2v12H7a2 2 0 0 1-2-2V5Z|M8.5 9h6M8.5 12.5h6M8.5 16h3" },
  { href: "/admin/surveys", title: "Опросы", desc: "Создание и результаты", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/admin/onboarding", title: "Онбординг", desc: "Планы и задачи", icon: "M5 12l4 4 10-10|M4 20h16" },
  { href: "/admin/jobs", title: "Вакансии", desc: "Вакансии и рекомендации", icon: "M4 8h16v11H4zM9 8V5h6v3|M4 13h16" },
  { href: "/admin/org", title: "Оргструктура", desc: "Файл оргструктуры", icon: "M12 4v5M5 20v-5h14v5M12 9v6M3 20h4M17 20h4M10 4h4" },
  { href: "/admin/users", title: "Сотрудники", desc: "Аккаунты и список", icon: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1|M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7|M20 19v-1a3 3 0 0 0-2-2.8M16 4.3a3.5 3.5 0 0 1 0 6.4" },
  { href: "/admin/calendar", title: "Календарь", desc: "Отпуска, подтверждение, остатки", icon: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z|M4 10h16M8 3v4M16 3v4" },
  { href: "/admin/courses", title: "Обучение", desc: "Курсы, уроки и доступ", icon: "M3 8l9-4 9 4-9 4-9-4Z|M7 10.5V15c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4.5" },
  { href: "/admin/tests", title: "Тесты", desc: "Отдельные тесты и проверка знаний", icon: "M9 11l2 2 4-4|M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" },
  { href: "/admin/reviews", title: "Проверка тестов", desc: "Свободные ответы на оценку", icon: "M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z|M14 8l3 3" },
  { href: "/admin/learning", title: "Отчёты по обучению", desc: "Прогресс сотрудников", icon: "M4 19V5|M4 19h16|M8 15l3-4 3 2 4-6" },
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
    return <p className="text-s">Загрузка...</p>;
  }

  return (
    <PageShell title="Управление (HR)">
      <div className={styles.grid}>
        {ADMIN_TILES.map((t, i) => (
          <Link key={t.href} href={t.href} className={`${styles.tile} ${styles[TINTS[i % TINTS.length]]}`}>
            <span className={styles.icon}><Icon d={t.icon} /></span>
            <span className={styles.text}>
              <span className={styles.title}>{t.title}</span>
              <span className={styles.desc}>{t.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
