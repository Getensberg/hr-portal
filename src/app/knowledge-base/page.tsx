"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AlbumCard } from "@/components/AlbumCard";
import styles from "./knowledge-base.module.css";

const TYPE_LABELS: Record<string, string> = {
  KNOWLEDGE_ARTICLE: "Статья",
  NEWS_POST: "Новость",
  POLICY_DOCUMENT: "Регламент",
  GALLERY_ALBUM: "Фотоальбом",
};

const TABS = [
  { value: "", label: "Все" },
  { value: "NEWS_POST", label: "Новости" },
  { value: "KNOWLEDGE_ARTICLE", label: "Статьи" },
  { value: "POLICY_DOCUMENT", label: "Регламенты" },
  { value: "GALLERY_ALBUM", label: "Галерея" },
];

function KnowledgeBaseContent() {
  const searchParams = useSearchParams();
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const initial = searchParams.get("type");
    if (initial) setType(initial);
  }, [searchParams]);

  const { data: items, isLoading } = useGetContentQuery({ type: type || undefined, q: q || undefined });

  return (
    <PageShell title="База знаний">
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={type === tab.value ? "primary" : "secondary"}
            onClick={() => setType(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className={styles.controls}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по заголовку и тексту" />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}

      {items?.map((item) =>
  item.type === "NEWS_POST" ? (
    <Link key={item.id} href={`/news/${item.id}`} className={styles.newsCard}>
      <Card>
        {item.imageUrl && <img src={item.imageUrl} alt="" className={styles.newsThumb} />}
        <span className="text-h4">{item.title}</span>
        <p className={`${styles.newsPreview} text-s`}>{item.content}</p>
      </Card>
    </Link>
  ) : item.type === "GALLERY_ALBUM" ? (
    <AlbumCard
      key={item.id}
      title={item.title}
      description={item.content}
      imageUrl={item.imageUrl}
      driveUrl={item.fileUrl ?? "#"}
    />
  ) : (
    <Card key={item.id}>
      <div className={styles.itemHeader} onClick={() => setOpenId(openId === item.id ? null : item.id)}>
        <span className="text-h4">{item.title}{item.category ? ` · ${item.category}` : ""}</span>
        <span className="text-xs">{TYPE_LABELS[item.type]}</span>
      </div>
      {openId === item.id && (
        <>
          <p className={`${styles.itemBody} text-s`}>{item.content}</p>
          {item.fileUrl && (
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
              📎 Скачать файл{item.fileName ? `: ${item.fileName}` : ""}
            </a>
          )}
        </>
      )}
    </Card>
  )
)}
      {items?.length === 0 && <p className="text-s">Ничего не найдено</p>}
    </PageShell>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={<p className="text-s">Загрузка...</p>}>
      <KnowledgeBaseContent />
    </Suspense>
  );
}