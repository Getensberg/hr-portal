"use client";
import { useState } from "react";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import styles from "./documents.module.css";

export default function DocumentsPage() {
  const { data: items, isLoading } = useGetContentQuery({ type: "POLICY_DOCUMENT" });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categories = Array.from(
    new Set((items ?? []).map((i) => i.category).filter((c): c is string => Boolean(c)))
  );

  const filtered = (items ?? []).filter((item) => {
    const matchesCategory = !category || item.category === category;
    const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((item) => {
    const folder = item.category || "Без категории";
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(item);
  });

  return (
    <PageShell title="Документы">
      <div className={styles.controls}>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию"
        />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}

      {Object.entries(grouped).map(([folder, docs]) => (
        <div key={folder} className={styles.folder}>
          <h3 className={`${styles.folderTitle} text-h4`}>{folder}</h3>
          {docs.map((doc) => (
            <div key={doc.id} className={styles.row}>
              <span className="text-s">{doc.title}</span>
              <div className={styles.fileLinks}>
                {doc.files?.length ? (
                  doc.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">📎 {f.name}</a>
                  ))
                ) : doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">📎 {doc.fileName}</a>
                ) : (
                  <span className="text-xs">Файл не приложен</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
      {filtered.length === 0 && !isLoading && <p className="text-s">Ничего не найдено</p>}
    </PageShell>
  );
}