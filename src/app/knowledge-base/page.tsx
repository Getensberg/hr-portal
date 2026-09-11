"use client";
import { useState } from "react";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import styles from "./knowledge-base.module.css";

const TYPE_LABELS: Record<string, string> = {
  KNOWLEDGE_ARTICLE: "Статья",
  NEWS_POST: "Новость",
  POLICY_DOCUMENT: "Регламент",
};

export default function KnowledgeBasePage() {
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: items, isLoading } = useGetContentQuery({ type: type || undefined, q: q || undefined });

  return (
    <PageShell title="База знаний">
      <div className={styles.controls}>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Все типы</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по заголовку и тексту" />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}

      {items?.map((item) => (
        <Card key={item.id}>
          <div className={styles.itemHeader} onClick={() => setOpenId(openId === item.id ? null : item.id)}>
            <span className="text-h4">{item.title}{item.category ? ` · ${item.category}` : ""}</span>
            <span className="text-xs">{TYPE_LABELS[item.type]}</span>
          </div>
          {openId === item.id && <p className={`${styles.itemBody} text-s`}>{item.content}</p>}
        </Card>
      ))}
      {items?.length === 0 && <p className="text-s">Ничего не найдено</p>}
    </PageShell>
  );
}