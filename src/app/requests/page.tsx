"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { RequestsList } from "@/components/RequestsList";
import { CalendarView } from "@/components/CalendarView";
import styles from "./requests.module.css";

// Заявки и календарь — один раздел: период из календаря оформляется заявкой, подтверждённая заявка попадает в календарь
function Content() {
  const view = useSearchParams().get("view") === "calendar" ? "calendar" : "requests";
  return (
    <PageShell title="Заявки и календарь" wide={view === "calendar"}>
      <div className={styles.tabs} role="tablist">
        <Link href="/requests" role="tab" aria-selected={view === "requests"} className={`${styles.tab} ${view === "requests" ? styles.tabActive : ""}`} scroll={false}>
          Заявки
        </Link>
        <Link href="/requests?view=calendar" role="tab" aria-selected={view === "calendar"} className={`${styles.tab} ${view === "calendar" ? styles.tabActive : ""}`} scroll={false}>
          Календарь
        </Link>
      </div>
      {view === "calendar" ? <CalendarView /> : <RequestsList />}
    </PageShell>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
