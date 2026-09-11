"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAllRequestsQuery, useUpdateRequestStatusMutation, useDeleteRequestMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import styles from "./requests-admin.module.css";

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "DONE"];

export default function AdminRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: requests, isLoading } = useGetAllRequestsQuery();
  const [updateStatus] = useUpdateRequestStatusMutation();
  const [deleteRequest] = useDeleteRequestMutation();

  function handleDelete(id: string) {
    if (confirm("Удалить эту заявку без возможности восстановления?")) {
      deleteRequest(id);
    }
  }

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN" || isLoading) {
    return <p className="text-s">Загрузка...</p>;
  }

  return (
    <PageShell title="Очередь заявок" wide>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Сотрудник</th>
            <th>Тип</th>
            <th>Детали</th>
            <th>Статус</th>
            <th></th>
          </tr>
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
              <td>
                <Button variant="danger" onClick={() => handleDelete(r.id)}>Удалить</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PageShell>
  );
}