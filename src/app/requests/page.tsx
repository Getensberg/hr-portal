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
  const param = useSearchParams().get("view");
  const view = param === "calendar" ? "calendar" : param === "archive" ? "archive" : "requests";
  return (
    <PageShell title="Заявки и календарь" wide={view === "calendar"}>
      <div className={styles.tabs} role="tablist">
        <Link href="/requests" role="tab" aria-selected={view === "requests"} className={`${styles.tab} ${view === "requests" ? styles.tabActive : ""}`} scroll={false}>
          Заявки
        </Link>
        <Link href="/requests?view=calendar" role="tab" aria-selected={view === "calendar"} className={`${styles.tab} ${view === "calendar" ? styles.tabActive : ""}`} scroll={false}>
          Календарь
        </Link>
        <Link href="/requests?view=archive" role="tab" aria-selected={view === "archive"} className={`${styles.tab} ${view === "archive" ? styles.tabActive : ""}`} scroll={false}>
          Архив
        </Link>
      </div>
      {view === "calendar" ? <CalendarView /> : <RequestsList archive={view === "archive"} key={view} />}
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
