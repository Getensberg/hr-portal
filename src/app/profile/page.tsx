"use client";
import Link from "next/link";
import { useGetProfileQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfileQuery();

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Личный кабинет">
      <Card>
        <CardTitle>{profile?.fullName}</CardTitle>
        <p className="text-s">{profile?.position ?? "Должность не указана"}</p>
        <p className="text-xs">{profile?.department ?? "Отдел не указан"}</p>
        <p className="text-xs">{profile?.email}</p>
      </Card>

      <Card>
        <CardTitle>Оргструктура компании</CardTitle>
        <p className="text-s">Список отделов и документы по структуре компании.</p>
        <Link href="/org">
          <Button variant="secondary">Открыть оргструктуру</Button>
        </Link>
      </Card>
    </PageShell>
  );
}