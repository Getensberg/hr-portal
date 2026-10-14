"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetTeamRequestsQuery, useUpdateRequestStatusMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { RequestsBoard } from "@/components/RequestsBoard";

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
      <RequestsBoard
        requests={requests ?? []}
        onStatus={(id, s) => updateStatus({ id, status: s as any })}
        emptyText="В вашей команде пока нет заявок"
      />
    </PageShell>
  );
}
