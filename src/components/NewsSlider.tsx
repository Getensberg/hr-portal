"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { ContentItem } from "@/store/api";
import styles from "./NewsSlider.module.css";

const TINTS = ["tintPeach", "tintMint", "tintLilac", "tintSky"] as const;
const GAP = 12;

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

// Карусель новостей для телефона: следующая карточка выглядывает сбоку, внизу точки
export function NewsSlider({ items }: { items: ContentItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return <div className={styles.empty}>Пока нет новостей</div>;
  }

  function onScroll() {
    const el = trackRef.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const index = atEnd ? items.length - 1 : Math.round(el.scrollLeft / (first.offsetWidth + GAP));
    setActive(index);
  }

  function goTo(index: number) {
    const el = trackRef.current;
    const slide = el?.children[index] as HTMLElement | undefined;
    if (el && slide) el.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }

  const single = items.length === 1;

  return (
    <div className={styles.wrap}>
      <div className={styles.track} ref={trackRef} onScroll={onScroll}>
        {items.map((item, i) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className={`${styles.slide} ${single ? styles.slideSingle : ""} ${item.imageUrl ? styles.slideImage : styles[TINTS[i % TINTS.length]]}`}
          >
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className={styles.photo} />
            )}
            <span className={styles.chip}>{item.category || (item.type === "NEWS_POST" ? "Новости" : "Статья")}</span>
            <span className={styles.title}>{item.title}</span>
            <span className={styles.meta}>{formatDay(item.createdAt)}</span>
          </Link>
        ))}
      </div>

      {!single && (
        <div className={styles.dots} role="tablist" aria-label="Новости">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Новость ${i + 1} из ${items.length}`}
              className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
