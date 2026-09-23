"use client";
import Link from "next/link";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import styles from "./news-list.module.css";

export default function NewsListPage() {
  const { data: items, isLoading } = useGetContentQuery({ type: "NEWS_POST" });

  return (
    <PageShell title="Новости">
      {isLoading && <p className="text-s">Загрузка...</p>}
      {items?.map((item) => (
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
      {items?.length === 0 && <p className="text-s">Пока нет новостей</p>}
    </PageShell>
  );
}