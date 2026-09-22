"use client";
import { useRef } from "react";
import Link from "next/link";
import styles from "./NewsCarousel.module.css";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function NewsCarousel({ items }: { items: NewsItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: number) {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  if (items.length === 0) {
    return <p className={styles.empty}>Пока нет новостей</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.navButtons}>
        <button className={styles.navBtn} onClick={() => scroll(-1)} aria-label="Назад">‹</button>
        <button className={styles.navBtn} onClick={() => scroll(1)} aria-label="Вперёд">›</button>
      </div>
      <div className={styles.scrollArea} ref={scrollRef}>
        {items.map((item) => (
          <Link key={item.id} href="/knowledge-base?type=NEWS_POST" className={styles.card}>
            <span className={styles.cardTitle}>{item.title}</span>
            <span className={styles.cardPreview}>{item.content}</span>
            <span className={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}