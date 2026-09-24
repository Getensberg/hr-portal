"use client";
import { useState } from "react";
import Link from "next/link";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import styles from "./news-list.module.css";

export default function NewsListPage() {
  const { data: items, isLoading } = useGetContentQuery({ types: ["NEWS_POST", "KNOWLEDGE_ARTICLE"] });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categories = Array.from(
    new Set((items ?? []).map((i) => i.category).filter((c): c is string => Boolean(c)))
  );

  const filtered = (items ?? []).filter((item) => {
    const matchesCategory = !category || item.category === category;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageShell title="Новости и статьи">
      <div className={styles.controls}>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по заголовку и тексту"
        />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}

      {filtered.map((item) => (
        <Link key={item.id} href={`/news/${item.id}`} className={styles.card}>
          <Card>
            {item.imageUrl && <img src={item.imageUrl} alt="" className={styles.thumb} />}
            <span className="text-h4">{item.title}</span>
            <p className={`${styles.preview} text-s`}>{item.content}</p>
            <p className={styles.date}>
              {new Date(item.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </Card>
        </Link>
      ))}
      {filtered.length === 0 && !isLoading && <p className="text-s">Ничего не найдено</p>}
    </PageShell>
  );
}