"use client";
import Link from "next/link";
import { useGetProfileQuery, useGetMyOrgPersonQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./profile.module.css";

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfileQuery();
  const { data: orgPerson } = useGetMyOrgPersonQuery();

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Личный кабинет">
      <div className={styles.hero}>
        <span className={styles.avatar}>{initials(profile?.fullName)}</span>
        <div className={styles.heroText}>
          <div className={styles.name}>{profile?.fullName}</div>
          <div className={styles.position}>{profile?.position ?? "Должность не указана"}</div>
          <div className={styles.chips}>
            <span className={styles.chip}>{profile?.department ?? "Отдел не указан"}</span>
            <span className={styles.chip}>{profile?.email}</span>
          </div>
        </div>
      </div>

      <div className={styles.cards}>
        {orgPerson?.manager && (
          <Card>
            <CardTitle>Руководитель</CardTitle>
            <p className="text-s">
              {orgPerson.manager.fullName}
              {orgPerson.manager.position ? ` · ${orgPerson.manager.position}` : ""}
            </p>
            {orgPerson.manager.phone && <p className="text-xs">{orgPerson.manager.phone}</p>}
            {orgPerson.manager.email && <p className="text-xs">{orgPerson.manager.email}</p>}
          </Card>
        )}

        <Card>
          <CardTitle>Оргструктура компании</CardTitle>
          <p className="text-s">Список отделов и документы по структуре компании.</p>
          <Link href="/org" className={styles.cta}>
            <Button variant="secondary">Открыть оргструктуру</Button>
          </Link>
        </Card>
      </div>
    </PageShell>
  );
}
