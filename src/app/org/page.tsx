"use client";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";

export default function OrgPage() {
  return (
    <PageShell title="Оргструктура">
      <Card>
        <p className="text-s">
          Здесь появится структура компании по отделам. Раздел пока в разработке —
          загляни немного позже.
        </p>
      </Card>
    </PageShell>
  );
}