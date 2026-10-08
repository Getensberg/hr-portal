"use client";
import { useGetOrgPeopleQuery, useGetDepartmentsQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { OrgChart } from "@/components/OrgChart";

export default function OrgPage() {
  const { data: people, isLoading } = useGetOrgPeopleQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: departments } = useGetDepartmentsQuery();

  if (isLoading) return <p className="text-s">Загрузка...</p>;

  return (
    <PageShell title="Оргструктура" wide>
      <OrgChart people={people ?? []} departments={departments ?? []} />
    </PageShell>
  );
}