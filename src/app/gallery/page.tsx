"use client";
import { useState } from "react";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { AlbumCard } from "@/components/AlbumCard";
import styles from "./gallery.module.css";

export default function GalleryPage() {
  const { data: items, isLoading } = useGetContentQuery({ type: "GALLERY_ALBUM" });
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

  return (
    <PageShell title="Фотогалерея">
      <div className={styles.controls}>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию альбома"
        />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}
      {filtered.map((a) => (
        <AlbumCard key={a.id} title={a.title} description={a.content} imageUrl={a.imageUrl} driveUrl={a.fileUrl ?? "#"} />
      ))}
      {filtered.length === 0 && !isLoading && <p className="text-s">Ничего не найдено</p>}
    </PageShell>
  );
}