"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import styles from "../admin/admin-home.module.css";

function Icon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split("|").map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const TINTS = ["tintLilac", "tintMint", "tintPeach", "tintSky", "tintSand", "tintRose"] as const;

const MANAGER_TILES = [
  { href: "/manager/requests", title: "Заявки команды", desc: "Заявки подчинённых сотрудников", icon: "M9 5h6M9 3h6v4H9zM6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1|M8 12h8M8 16h5" },
  { href: "/manager/onboarding", title: "Онбординг команды", desc: "Планы адаптации новичков", icon: "M5 12l4 4 10-10|M4 20h16" },
  { href: "/manager/calendar", title: "Календарь команды", desc: "Отпуска и остатки дней", icon: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z|M4 10h16M8 3v4M16 3v4" },
  { href: "/manager/learning", title: "Обучение команды", desc: "Курсы и тесты сотрудников", icon: "M3 8l9-4 9 4-9 4-9-4Z|M7 10.5V15c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4.5" },
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
        {MANAGER_TILES.map((t, i) => (
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
