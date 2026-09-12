"use client";
import { useGetOrgDocumentsQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";

export default function OrgPage() {
  const { data: docs, isLoading } = useGetOrgDocumentsQuery();

  return (
    <PageShell title="Оргструктура">
      {isLoading && <p className="text-s">Загрузка...</p>}
      {docs?.map((d) => (
        <Card key={d.id}>
          <CardTitle>{d.title}</CardTitle>
          {d.description && <p className="text-s">{d.description}</p>}
          {d.fileUrl ? (
            <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">📎 Скачать файл</a>
          ) : (
            <p className="text-xs">Файл появится здесь позже</p>
          )}
        </Card>
      ))}
      {docs?.length === 0 && <p className="text-s">Оргструктура пока не опубликована</p>}
    </PageShell>
  );
}