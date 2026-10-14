"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { FormError } from "@/components/FormError";
import { getErrorMessage } from "@/lib/errors";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { DepartmentInput } from "@/components/DepartmentInput";
import styles from "./users-admin.module.css";

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Сотрудник" },
  { value: "MANAGER", label: "Руководитель" },
  { value: "HR_ADMIN", label: "HR" },
];
const ROLE_LABEL: Record<string, string> = { EMPLOYEE: "Сотрудник", MANAGER: "Руководитель", HR_ADMIN: "HR" };
const ROLE_CLASS: Record<string, string> = { EMPLOYEE: "roleEmployee", MANAGER: "roleManager", HR_ADMIN: "roleHr" };

function initials(name: string) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

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
  const [managerId, setManagerId] = useState("");
  const [search, setSearch] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  function resetForm() {
    setFullName(""); setEmail(""); setDepartment(""); setPosition(""); setPhone(""); setRole("EMPLOYEE"), setManagerId("");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await updateUser({ id: editingId, fullName, email, department, position, phone, role, managerId: managerId || null }).unwrap();
        resetForm();
      } else {
        const result = await createUser({ fullName, email, department, position, phone, role, managerId: managerId || null }).unwrap();
        setLastCreated({ email: result.user.email, tempPassword: result.tempPassword });
        resetForm();
      }
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить"));
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
    setManagerId(u.managerId ?? "");
    setLastCreated(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(u: any) {
    const ok = confirm(
      `Удалить ${u.fullName}? Вместе с аккаунтом безвозвратно удалятся все его заявки, записи в календаре отпусков и другая история в портале. Это необратимо.`
    );
    if (ok) deleteUser(u.id);
  }

  const q = search.trim().toLowerCase();
  const filtered = (users ?? []).filter((u: any) =>
    !q || [u.fullName, u.email, u.department, u.position, u.phone].some((v) => (v ?? "").toLowerCase().includes(q))
  );

  return (
    <PageShell title="Сотрудники" wide>
      <form onSubmit={handleSubmit} className={styles.panel}>
        <h2 className={styles.panelTitle}>{editingId ? "Редактирование сотрудника" : "Новый сотрудник"}</h2>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>ФИО</span>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.ru" type="email" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Отдел</span>
            <DepartmentInput value={department} onChange={setDepartment} placeholder="Выберите или введите" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Должность</span>
            <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Телефон</span>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7" />
          </label>
          <div className={styles.field}>
            <span className={styles.label}>Роль</span>
            <Select value={role} onChange={setRole} options={ROLE_OPTIONS} ariaLabel="Роль" />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Руководитель</span>
            <Select
              value={managerId}
              onChange={setManagerId}
              ariaLabel="Руководитель"
              options={[
                { value: "", label: "Без руководителя" },
                ...(users ?? []).filter((u: any) => u.id !== editingId).map((u: any) => ({ value: u.id, label: u.fullName })),
              ]}
            />
          </div>
        </div>
        <FormError message={error || null} />
        <div className={styles.actions}>
          <Button type="submit" disabled={creating}>{editingId ? "Сохранить" : "Создать сотрудника"}</Button>
          {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Отмена</Button>}
        </div>
      </form>

      {lastCreated && (
        <div className={styles.created}>
          <div className={styles.createdTitle}>Аккаунт создан</div>
          <p>Email: <strong>{lastCreated.email}</strong></p>
          <p>Временный пароль: <strong className={styles.pass}>{lastCreated.tempPassword}</strong></p>
          <p className={styles.createdNote}>Передайте эти данные сотруднику лично: здесь они больше не сохраняются и не показываются повторно.</p>
        </div>
      )}

      <div className={styles.listHead}>
        <h2 className={styles.listTitle}>Все сотрудники <span className={styles.count}>{filtered.length}</span></h2>
        <input className={`input ${styles.search}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени, email, отделу" />
      </div>

      <div className={styles.list}>
        {filtered.map((u: any) => (
          <div key={u.id} className={styles.row}>
            <span className={styles.avatar}>{initials(u.fullName)}</span>
            <div className={styles.info}>
              <div className={styles.nameLine}>
                <span className={styles.name}>{u.fullName}</span>
                <span className={`${styles.role} ${styles[ROLE_CLASS[u.role] ?? "roleEmployee"]}`}>{ROLE_LABEL[u.role] ?? u.role}</span>
              </div>
              <div className={styles.meta}>
                {[u.position, u.department].filter(Boolean).join(" · ") || "—"}
              </div>
              <div className={styles.meta}>{[u.email, u.phone].filter(Boolean).join(" · ")}</div>
            </div>
            <div className={styles.rowActions}>
              <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>Изменить</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Удалить</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className={styles.empty}>Никого не найдено</p>}
      </div>
    </PageShell>
  );
}
