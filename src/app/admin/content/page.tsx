"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetContentQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
} from "@/store/api";

const TYPE_OPTIONS = ["KNOWLEDGE_ARTICLE", "NEWS_POST", "POLICY_DOCUMENT"];

export default function AdminContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: items } = useGetContentQuery({});
  const [createContent] = useCreateContentMutation();
  const [updateContent] = useUpdateContentMutation();
  const [deleteContent] = useDeleteContentMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p>Загрузка...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await updateContent({ id: editingId, title, content, type: type as any, category });
      setEditingId(null);
    } else {
      await createContent({ title, content, type: type as any, category });
    }
    setTitle("");
    setContent("");
    setCategory("");
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setType(item.type);
    setCategory(item.category ?? "");
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Управление базой знаний</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" style={{ width: "100%" }} /><br />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Текст" rows={4} style={{ width: "100%", marginTop: 8 }} /><br />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ marginTop: 8 }}>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" style={{ marginLeft: 8 }} />
        <button type="submit" style={{ marginLeft: 8 }}>{editingId ? "Сохранить" : "Добавить"}</button>
        {editingId && <button type="button" onClick={() => setEditingId(null)} style={{ marginLeft: 8 }}>Отмена</button>}
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items?.map((item) => (
          <li key={item.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8 }}>
            <strong>{item.title}</strong> [{item.type}]
            <button onClick={() => startEdit(item)} style={{ marginLeft: 8 }}>Изменить</button>
            <button onClick={() => deleteContent(item.id)} style={{ marginLeft: 8 }}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}