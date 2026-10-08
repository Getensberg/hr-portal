"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetTeamLearningQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { EmployeeProgress } from "@/components/EmployeeProgress";

export default function ManagerLearningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "MANAGER")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data, isLoading } = useGetTeamLearningQuery(undefined, { refetchOnMountOrArgChange: true });

  if (status === "loading" || !session || session.user.role !== "MANAGER" || isLoading || !data) {
    return <p className="text-s">Загрузка...</p>;
  }

  return (
    <PageShell title="Обучение команды" wide>
      <EmployeeProgress employees={data.employees} />
    </PageShell>
  );
}