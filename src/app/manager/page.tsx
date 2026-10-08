"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import styles from "../home.module.css";

const MANAGER_TILES = [
  { href: "/manager/requests", title: "Заявки команды", desc: "Заявки сотрудников, которые тебе подчинены" },
  { href: "/manager/onboarding", title: "Онбординг команды", desc: "Планы адаптации новичков в команде" },
  { href: "/manager/calendar", title: "Календарь команды", desc: "Отпуска и остатки дней по команде" },
  { href: "/manager/learning", title: "Обучение команды", desc: "Курсы и тесты сотрудников вашей команды" },
];

export default function ManagerHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "MANAGER")) {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "MANAGER") {
    return <p className="text-s">Загрузка...</p>;
  }

  return (
    <PageShell title="Моя команда">
      <div className={styles.grid}>
        {MANAGER_TILES.map((t) => (
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