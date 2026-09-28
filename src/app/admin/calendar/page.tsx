"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetAdminVacationsQuery,
  useSetVacationStatusMutation,
  useDeleteVacationMutation,
  useGetUsersQuery,
} from "@/store/api";
import { VACATION_LIMITS, daysInYear, countDays, formatRu } from "@/lib/vacation";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import styles from "./calendar-admin.module.css";

const TYPE_LABELS: Record<string, string> = { VACATION: "Отпуск", DAY_OFF: "Отгул" };

export default function AdminCalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: entriesData, isLoading } = useGetAdminVacationsQuery(year);
  const { data: users } = useGetUsersQuery();
  const [setVacationStatus] = useSetVacationStatusMutation();
  const [deleteVacation] = useDeleteVacationMutation();

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  const entries = entriesData ?? [];
  const query = search.toLowerCase();

  const filtered = entries.filter((e) => {
    const matchesName = !query || e.user.fullName.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || e.status === statusFilter;
    return matchesName && matchesStatus;
  });

  const filteredUsers = (users ?? []).filter((u) => !query || u.fullName.toLowerCase().includes(query));

  function usedDays(userId: string, kind: string) {
    return entries
      .filter((e) => e.user.id === userId && e.type === kind)
      .reduce((sum, e) => sum + daysInYear(new Date(e.startDate), new Date(e.endDate), year), 0);
  }

  function handleDelete(id: string) {
    if (confirm("Удалить эту запись без возможности восстановления?")) deleteVacation(id);
  }

  return (
    <PageShell title="Календарь отпусков: все сотрудники" wide>
      <div className={styles.yearRow}>
        <button className={styles.yearBtn} onClick={() => setYear(year - 1)} aria-label="Предыдущий год">‹</button>
        <span className="text-h3">{year}</span>
        <button className={styles.yearBtn} onClick={() => setYear(year + 1)} aria-label="Следующий год">›</button>
      </div>

      <div className={styles.controls}>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по сотруднику"
        />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="PLANNED">Запланировано</option>
          <option value="CONFIRMED">Подтверждено</option>
        </select>
      </div>

      <h2 className="text-h2">Периоды</h2>
      {isLoading && <p className="text-s">Загрузка...</p>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Отдел</th>
              <th>Тип</th>
              <th>Период</th>
              <th>Дней</th>
              <th>Комментарий</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td>{e.user.fullName}</td>
                <td>{e.user.department ?? "—"}</td>
                <td>{TYPE_LABELS[e.type]}</td>
                <td>{formatRu(e.startDate)} – {formatRu(e.endDate)}</td>
                <td>{countDays(new Date(e.startDate), new Date(e.endDate))}</td>
                <td>{e.comment ?? "—"}</td>
                <td>
                  <span className={`${styles.badge} ${e.status === "CONFIRMED" ? styles.confirmed : styles.planned}`}>
                    {e.status === "CONFIRMED" ? "Подтверждено" : "Запланировано"}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    {e.status === "PLANNED" ? (
                      <Button size="sm" onClick={() => setVacationStatus({ id: e.id, status: "CONFIRMED" })}>
                        Подтвердить
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setVacationStatus({ id: e.id, status: "PLANNED" })}>
                        Вернуть в план
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(e.id)}>Удалить</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && <p className="text-s">Записей не найдено</p>}
      </div>

      <h2 className="text-h2">Остатки по сотрудникам за {year} год</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Отдел</th>
              <th>Отпуск (внесено / лимит)</th>
              <th>Отгулы (внесено / лимит)</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.department ?? "—"}</td>
                <td>{usedDays(u.id, "VACATION")} / {VACATION_LIMITS.VACATION}</td>
                <td>{usedDays(u.id, "DAY_OFF")} / {VACATION_LIMITS.DAY_OFF}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}