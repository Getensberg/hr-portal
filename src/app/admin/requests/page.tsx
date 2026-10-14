"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAllRequestsQuery, useUpdateRequestStatusMutation, useDeleteRequestMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { RequestsBoard } from "@/components/RequestsBoard";
import { RequestTemplates } from "@/components/RequestTemplates";

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
      <RequestTemplates />
      <RequestsBoard
        requests={requests ?? []}
        onStatus={(id, s) => updateStatus({ id, status: s as any })}
        onDelete={handleDelete}
      />
    </PageShell>
  );
}
