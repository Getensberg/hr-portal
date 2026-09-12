"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetOrgDocumentsQuery, useCreateOrgDocumentMutation, useDeleteOrgDocumentMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./org-admin.module.css";

export default function AdminOrgPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: docs } = useGetOrgDocumentsQuery();
  const [createDoc] = useCreateOrgDocumentMutation();
  const [deleteDoc] = useDeleteOrgDocumentMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    await createDoc({ title, description });
    setTitle(""); setDescription("");
  }

  function handleDelete(id: string) {
    if (confirm("Удалить этот пункт оргструктуры?")) deleteDoc(id);
  }

  return (
    <PageShell title="Оргструктура — управление" wide>
      <Card>
        <p className="text-xs">
          Загрузка файла появится позже, после подключения файлового хранилища — структура уже
          готова принять его без переделок. Пока можно вести записи с названием и описанием.
        </p>
      </Card>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название (например, «Схема отделов 2026»)" />
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание (необязательно)" rows={3} />
        <Button type="submit">Добавить</Button>
      </form>

      {docs?.map((d) => (
        <Card key={d.id}>
          <div className={styles.itemRow}>
            <div>
              <CardTitle>{d.title}</CardTitle>
              {d.description && <p className="text-xs">{d.description}</p>}
            </div>
            <Button variant="danger" onClick={() => handleDelete(d.id)}>Удалить</Button>
          </div>
        </Card>
      ))}
      {docs?.length === 0 && <p className="text-s">Пока ничего не добавлено</p>}
    </PageShell>
  );
}