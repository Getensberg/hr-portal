"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGetAdminTestQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { TestEditor } from "@/components/TestEditor";

export default function AdminTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: test, isLoading } = useGetAdminTestQuery(params.id, { skip: !params.id });

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN" || isLoading) {
    return <p className="text-s">Загрузка...</p>;
  }
  if (!test) {
    return <PageShell title="Тест не найден"><p className="text-s">Возможно, он был удалён.</p></PageShell>;
  }

  return (
    <PageShell title={test.title} wide>
      {test.course && (
        <p className="text-s" style={{ marginBottom: 16 }}>
          Этот тест входит в курс «<Link href={`/admin/courses/${test.course.id}`}>{test.course.title}</Link>».
          Видимость и доступ определяются курсом.
        </p>
      )}
      <TestEditor
        testId={test.id}
        onDeleted={() => router.push(test.course ? `/admin/courses/${test.course.id}` : "/admin/tests")}
      />
    </PageShell>
  );
}