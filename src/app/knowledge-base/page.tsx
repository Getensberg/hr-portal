"use client";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import styles from "./knowledge-base.module.css";

const ICONS = {
  news: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5h11a2 2 0 0 1 2 2v12H7a2 2 0 0 1-2-2V5Z" /><path d="M18 9h2v8a2 2 0 0 1-2 2" /><path d="M8.5 9h6M8.5 12.5h6M8.5 16h3" />
    </svg>
  ),
  docs: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 7a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />
    </svg>
  ),
  gallery: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="14" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m5 17 4.5-4.5L13 16l2.5-2.5L19 17" />
    </svg>
  ),
};

const SECTIONS = [
  { href: "/news", title: "Новости и статьи", desc: "Новости компании и справочные статьи", icon: ICONS.news, tint: "tintLilac" },
  { href: "/documents", title: "Документы", desc: "Регламенты и документы по папкам", icon: ICONS.docs, tint: "tintMint" },
  { href: "/gallery", title: "Галерея", desc: "Фотоальбомы с событий компании", icon: ICONS.gallery, tint: "tintPeach" },
] as const;

export default function KnowledgeBasePage() {
  return (
    <PageShell title="База знаний">
      <div className={styles.grid}>
        {SECTIONS.map((s, i) => (
          <Link key={s.href} href={s.href} className={`${styles.tile} ${styles[s.tint]} ${i === 0 ? styles.tileWide : ""}`}>
            <span className={styles.icon}>{s.icon}</span>
            <span className={styles.text}>
              <span className={styles.title}>{s.title}</span>
              <span className={styles.desc}>{s.desc}</span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
