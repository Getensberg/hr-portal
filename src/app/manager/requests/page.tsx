"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetTeamRequestsQuery, useUpdateRequestStatusMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import styles from "./manager-requests.module.css";

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "DONE"];

export default function ManagerRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "MANAGER")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: requests, isLoading } = useGetTeamRequestsQuery();
  const [updateStatus] = useUpdateRequestStatusMutation();

  if (status === "loading" || !session || session.user.role !== "MANAGER" || isLoading) {
    return <p className="text-s">Загрузка...</p>;
  }

  return (
    <PageShell title="Заявки моей команды" wide>
      <table className={styles.table}>
        <thead>
          <tr><th>Сотрудник</th><th>Тип</th><th>Детали</th><th>Статус</th></tr>
        </thead>
        <tbody>
          {requests?.map((r) => (
            <tr key={r.id}>
              <td>{r.user?.fullName}</td>
              <td>{r.type}</td>
              <td>{r.payload?.description ?? "—"}</td>
              <td>
                <select
                  className={styles.select}
                  value={r.status}
                  onChange={(e) => updateStatus({ id: r.id, status: e.target.value as any })}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {requests?.length === 0 && <p className="text-s">В твоей команде пока нет заявок</p>}
    </PageShell>
  );
}