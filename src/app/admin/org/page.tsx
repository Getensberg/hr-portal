"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";

export default function AdminOrgPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p>Загрузка...</p>;
  }

  return (
    <PageShell title="Оргструктура — управление">
      <Card>
        <p className="text-s">
          Здесь появится загрузка файла оргструктуры для сотрудников. Пока раздел
          в разработке.
        </p>
      </Card>
    </PageShell>
  );
}