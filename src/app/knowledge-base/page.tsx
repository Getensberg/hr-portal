"use client";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import styles from "./knowledge-base.module.css";

const SECTIONS = [
  { href: "/news", title: "Новости и статьи", desc: "Новости компании и справочные статьи" },
  { href: "/documents", title: "Документы", desc: "Регламенты и документы по папкам" },
  { href: "/gallery", title: "Галерея", desc: "Фотоальбомы с событий компании" },
];

export default function KnowledgeBasePage() {
  return (
    <PageShell title="База знаний">
      <div className={styles.grid}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className={styles.hubCard}>
            <Card>
              <CardTitle>{s.title}</CardTitle>
              <p className="text-s">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}