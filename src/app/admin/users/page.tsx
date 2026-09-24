"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetUsersQuery, useCreateUserMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./users-admin.module.css";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: users } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [lastCreated, setLastCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [error, setError] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await createUser({ fullName, email, department, position, role }).unwrap();
      setLastCreated({ email: result.user.email, tempPassword: result.tempPassword });
      setFullName(""); setEmail(""); setDepartment(""); setPosition(""); setRole("EMPLOYEE");
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось создать пользователя");
    }
  }

  return (
    <PageShell title="Сотрудники" wide>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ФИО" />
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        </div>
        <div className={styles.formRow}>
          <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Отдел" />
          <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EMPLOYEE">Сотрудник</option>
            <option value="HR_ADMIN">HR</option>
          </select>
        </div>
        <Button type="submit" disabled={creating}>Создать сотрудника</Button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {lastCreated && (
        <Card>
          <CardTitle>Аккаунт создан</CardTitle>
          <p className="text-s">Email: {lastCreated.email}</p>
          <p className="text-s">Временный пароль: <strong>{lastCreated.tempPassword}</strong></p>
          <p className="text-xs">Передай эти данные сотруднику лично — здесь они больше не сохраняются и не показываются повторно.</p>
        </Card>
      )}

      <h2 className="text-h2">Все сотрудники</h2>
      {users?.map((u) => (
        <Card key={u.id}>
          <span className="text-s"><strong>{u.fullName}</strong> · {u.email} · {u.role}</span>
        </Card>
      ))}
    </PageShell>
  );
}