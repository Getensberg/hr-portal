"use client";
import { useState } from "react";
import { useGetContentQuery } from "@/store/api";

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
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>База знаний</h1>

      <div style={{ marginBottom: 16 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Все типы</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по заголовку и тексту"
          style={{ marginLeft: 8, width: 260 }}
        />
      </div>

      {isLoading && <p>Загрузка...</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items?.map((item) => (
          <li key={item.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8 }}>
            <div
              style={{ cursor: "pointer", fontWeight: "bold" }}
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
            >
              [{TYPE_LABELS[item.type]}] {item.title}
              {item.category ? ` · ${item.category}` : ""}
            </div>
            {openId === item.id && <p style={{ marginTop: 8 }}>{item.content}</p>}
          </li>
        ))}
      </ul>
      {items?.length === 0 && <p>Ничего не найдено</p>}
    </div>
  );
}