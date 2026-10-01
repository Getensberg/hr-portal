"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { DepartmentInput } from "@/components/DepartmentInput";
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
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [error, setError] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  function resetForm() {
    setFullName(""); setEmail(""); setDepartment(""); setPosition(""); setPhone(""); setRole("EMPLOYEE");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await updateUser({ id: editingId, fullName, email, department, position, phone, role }).unwrap();
        resetForm();
      } else {
        const result = await createUser({ fullName, email, department, position, phone, role }).unwrap();
        setLastCreated({ email: result.user.email, tempPassword: result.tempPassword });
        resetForm();
      }
    } catch (err: any) {
      setError(err?.data?.error || "Не удалось сохранить");
    }
  }

  function startEdit(u: any) {
    setEditingId(u.id);
    setFullName(u.fullName);
    setEmail(u.email);
    setDepartment(u.department ?? "");
    setPosition(u.position ?? "");
    setPhone(u.phone ?? "");
    setRole(u.role);
    setLastCreated(null);
  }

  function handleDelete(u: any) {
    const ok = confirm(
      `Удалить ${u.fullName}? Вместе с аккаунтом безвозвратно удалятся все его заявки, записи в календаре отпусков и другая история в портале. Это необратимо.`
    );
    if (ok) deleteUser(u.id);
  }

  return (
    <PageShell title="Сотрудники" wide>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ФИО" />
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        </div>
        <div className={styles.formRow}>
          <DepartmentInput value={department} onChange={setDepartment} />
          <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" />
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EMPLOYEE">Сотрудник</option>
            <option value="HR_ADMIN">HR</option>
          </select>
        </div>
        <div>
          <Button type="submit" disabled={creating}>{editingId ? "Сохранить" : "Создать сотрудника"}</Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm} style={{ marginLeft: 8 }}>Отмена</Button>
          )}
        </div>
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
      {users?.map((u: any) => (
        <Card key={u.id}>
          <div className={styles.userRow}>
            <span className="text-s">
              <strong>{u.fullName}</strong> · {u.email} · {u.role}
              {u.department ? ` · ${u.department}` : ""}
              {u.phone ? ` · ${u.phone}` : ""}
            </span>
            <div className={styles.userActions}>
              <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>Изменить</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Удалить</Button>
            </div>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}