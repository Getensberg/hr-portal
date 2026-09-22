"use client";
import { useParams } from "next/navigation";
import { useGetContentByIdQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import styles from "./news-detail.module.css";

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: item, isLoading } = useGetContentByIdQuery(params.id);

  if (isLoading) return <p className="text-s">Загрузка...</p>;
  if (!item) return <p className="text-s">Новость не найдена</p>;

  return (
    <PageShell title={item.title}>
      {item.imageUrl && (
        <div className={styles.banner}>
          <img src={item.imageUrl} alt={item.title} />
        </div>
      )}
      <p className={`${styles.body} text-s`}>{item.content}</p>
    </PageShell>
  );
}