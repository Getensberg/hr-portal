"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAllRequestsQuery, useUpdateRequestStatusMutation } from "@/store/api";

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

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN" || isLoading) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1>Очередь заявок</h1>
      <table border={1} cellPadding={8} style={{ width: "100%" }}>
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
    </div>
  );
}