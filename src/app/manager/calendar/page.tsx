"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetAdminVacationsQuery,
  useGetTeamUsersQuery,
  useGetHolidaysQuery,
  useGetBlockedPeriodsQuery,
} from "@/store/api";
import { VACATION_LIMITS, daysInYearExcludingHolidays } from "@/lib/vacation";
import { PageShell } from "@/components/PageShell";
import { TeamGrid } from "@/components/TeamGrid";
import styles from "./manager-calendar.module.css";

export default function ManagerCalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "MANAGER")) {
      router.push("/");
    }
  }, [session, status, router]);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const { data: entriesData } = useGetAdminVacationsQuery(year);
  const { data: teamUsers } = useGetTeamUsersQuery();
  const { data: holidays } = useGetHolidaysQuery();
  const { data: blocked } = useGetBlockedPeriodsQuery();

  if (status === "loading" || !session || session.user.role !== "MANAGER") {
    return <p className="text-s">Загрузка...</p>;
  }

  const entries = entriesData ?? [];
  const holidaySet = new Set((holidays ?? []).map((h) => h.date.slice(0, 10)));

  function usedDays(userId: string, kind: string) {
    return entries
      .filter((e) => e.user.id === userId && e.type === kind)
      .reduce((sum, e) => sum + daysInYearExcludingHolidays(new Date(e.startDate), new Date(e.endDate), year, holidaySet), 0);
  }

  function handleMonthChange(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
  }

  return (
    <PageShell title="Календарь команды" wide>
      <div className={styles.yearRow}>
        <button className={styles.yearBtn} onClick={() => setYear(year - 1)} aria-label="Предыдущий год">‹</button>
        <span className="text-h3">{year}</span>
        <button className={styles.yearBtn} onClick={() => setYear(year + 1)} aria-label="Следующий год">›</button>
      </div>

      <TeamGrid
        year={year}
        month={month}
        onChange={handleMonthChange}
        users={teamUsers ?? []}
        entries={entries}
        holidays={holidays ?? []}
        blocked={blocked ?? []}
      />

      <h2 className="text-h2">Остатки по команде за {year} год</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Сотрудник</th><th>Отпуск (внесено / лимит)</th><th>Отгулы (внесено / лимит)</th></tr>
          </thead>
          <tbody>
            {teamUsers?.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{usedDays(u.id, "VACATION")} / {VACATION_LIMITS.VACATION}</td>
                <td>{usedDays(u.id, "DAY_OFF")} / {VACATION_LIMITS.DAY_OFF}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {teamUsers?.length === 0 && <p className="text-s">В команде пока нет сотрудников</p>}
      </div>
    </PageShell>
  );
}