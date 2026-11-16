"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetAllRequestsQuery, useUpdateRequestStatusMutation, useDeleteRequestMutation, useRetryBitrixTaskMutation } from "@/store/api";
import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { FormError } from "@/components/FormError";
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
  const [retryTask] = useRetryBitrixTaskMutation();
  const [error, setError] = useState("");

  async function handleRetry(id: string) {
    setError("");
    try {
      await retryTask(id).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось создать задачу в Битриксе"));
    }
  }

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
      <FormError message={error || null} />
      <RequestsBoard
        requests={requests ?? []}
        onRetry={handleRetry}
        onStatus={(id, s) => updateStatus({ id, status: s as any })}
        onDelete={handleDelete}
      />
    </PageShell>
  );
}
