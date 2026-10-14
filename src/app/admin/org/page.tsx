"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetOrgPeopleQuery,
  useCreateOrgPersonMutation,
  useUpdateOrgPersonMutation,
  useDeleteOrgPersonMutation,
  useGetUsersQuery,
} from "@/store/api";
import { buildTree, getDescendantIds, type OrgPersonNode } from "@/lib/orgTree";
import { PageShell } from "@/components/PageShell";
import { Select } from "@/components/Select";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/Button";
import styles from "./org-admin.module.css";
import { DepartmentInput } from "@/components/DepartmentInput";
import { useGetDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentColorMutation, useDeleteDepartmentMutation } from "@/store/api";
import { getErrorMessage } from "@/lib/errors";

export default function AdminOrgPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: people } = useGetOrgPeopleQuery();
  const { data: users } = useGetUsersQuery();
  const [createOrgPerson] = useCreateOrgPersonMutation();
  const [updateOrgPerson] = useUpdateOrgPersonMutation();
  const [deleteOrgPerson] = useDeleteOrgPersonMutation();

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [managerId, setManagerId] = useState("");
  const [linkedUserId, setLinkedUserId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [personError, setPersonError] = useState("");

  const { data: departments } = useGetDepartmentsQuery();
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartmentColor] = useUpdateDepartmentColorMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const [newDeptName, setNewDeptName] = useState("");
  const [deptError, setDeptError] = useState("");

  const [isHead, setIsHead] = useState(false);
  const [managerTouched, setManagerTouched] = useState(false);

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  const excludedIds = editingId
    ? new Set([editingId, ...getDescendantIds(people ?? [], editingId)])
    : new Set<string>();
  const managerOptions = (people ?? []).filter((p) => !excludedIds.has(p.id));

  function applyDepartment(value: string) {
  setDepartment(value);
  if (editingId || isHead || managerTouched) return;
  const head = (people ?? []).find((p: any) => p.isDepartmentHead && p.department === value);
  setManagerId(head ? head.id : "");
}

  function handleLinkedUserChange(userId: string) {
    setLinkedUserId(userId);
    const u = (users ?? []).find((x) => x.id === userId);
    if (u) {
      setFullName(u.fullName);
      applyDepartment(u.department ?? "");
      setPosition(u.position ?? "");
      setPhone(u.phone ?? "");
      setEmail(u.email);
    }
  }

  async function handleAddDepartment(e: React.FormEvent) {
  e.preventDefault();
  if (!newDeptName.trim()) return;
  setDeptError("");
  try {
    await createDepartment({ name: newDeptName }).unwrap();
    setNewDeptName("");
  } catch (err) {
    setDeptError(getErrorMessage(err, "Не удалось добавить отдел"));
  }
}

async function handleDeleteDepartment(id: string) {
  setDeptError("");
  try {
    await deleteDepartment(id).unwrap();
  } catch (err) {
    setDeptError(getErrorMessage(err, "Не удалось удалить отдел"));
  }
}

  function resetPersonForm() {
    setFullName(""); setPosition(""); setDepartment(""); setPhone(""); setEmail(""); setIsHead(false); setManagerTouched(false);
    setManagerId(""); setLinkedUserId(""); setEditingId(null); setPersonError("");
  }

  async function handlePersonSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPersonError("");
    if (!fullName.trim()) {
      setPersonError("Укажите ФИО");
      return;
    }
    const payload = {
      fullName, position, department, phone, email,
      managerId: managerId || null,
      linkedUserId: linkedUserId || null,
      isDepartmentHead: isHead && Boolean(department.trim()),
    };
    try {
      if (editingId) {
        await updateOrgPerson({ id: editingId, ...payload }).unwrap();
      } else {
        await createOrgPerson(payload).unwrap();
      }
      resetPersonForm();
    } catch (err) {
      setPersonError(getErrorMessage(err, "Не удалось сохранить"));
    }
  }

  function startEditPerson(p: any) {
    setEditingId(p.id);
    setFullName(p.fullName);
    setPosition(p.position ?? "");
    setDepartment(p.department ?? "");
    setPhone(p.phone ?? "");
    setEmail(p.email ?? "");
    setManagerId(p.managerId ?? "");
    setLinkedUserId(p.linkedUserId ?? "");
    setPersonError("");
    setIsHead(Boolean(p.isDepartmentHead));
  }

  function handleDeletePerson(p: any) {
    const ok = confirm(
      `Удалить ${p.fullName} из оргструктуры? Если у него есть подчинённые, они автоматически перейдут к его руководителю.`
    );
    if (ok) deleteOrgPerson(p.id);
  }

  const tree = buildTree(people ?? [], () => true);

function renderNode(node: OrgPersonNode, depth: number): React.ReactNode {
  return (
    <div key={node.id}>
      <div className={styles.treeRow} style={{ marginLeft: depth * 20 }}>
        <div className={styles.treeInfo}>
          <div className={styles.treeName}>
            {node.fullName}
            {(node as any).isDepartmentHead && <span className={`${styles.pill} ${styles.pillLilac}`}>Руководитель отдела</span>}
            {node.linkedUserId && <span className={`${styles.pill} ${styles.pillMint}`}>Есть аккаунт</span>}
          </div>
          <div className={styles.treeMeta}>{[node.position, node.department].filter(Boolean).join(" · ") || "—"}</div>
        </div>
        <div className={styles.treeActions}>
          <Button size="sm" variant="secondary" onClick={() => startEditPerson(node)}>Изменить</Button>
          <Button size="sm" variant="danger" onClick={() => handleDeletePerson(node)}>Удалить</Button>
        </div>
      </div>
      {node.children.map((c) => renderNode(c, depth + 1))}
    </div>
  );
}

  return (
    <PageShell title="Оргструктура: управление" wide>
      <h2 className={styles.h2}>Сотрудники и подчинённость</h2>
      <form onSubmit={handlePersonSubmit} className={styles.panel}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>ФИО</span>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ФИО" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Должность</span>
            <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Отдел</span>
            <DepartmentInput value={department} onChange={applyDepartment} placeholder="Пусто: руководство компании" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Телефон</span>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.ru" />
          </label>
          <div className={styles.field}>
            <span className={styles.label}>Руководитель</span>
            <Select
              value={managerId}
              onChange={(v) => { setManagerId(v); setManagerTouched(true); }}
              ariaLabel="Руководитель"
              options={[{ value: "", label: "Без руководителя (верхний уровень)" }, ...managerOptions.map((p) => ({ value: p.id, label: p.fullName }))]}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Связанный аккаунт</span>
            <Select
              value={linkedUserId}
              onChange={handleLinkedUserChange}
              ariaLabel="Связанный аккаунт"
              options={[{ value: "", label: "Без связанного аккаунта" }, ...(users ?? []).map((u: any) => ({ value: u.id, label: `${u.fullName} (${u.email})` }))]}
            />
          </div>
        </div>
        <button
          type="button"
          className={`${styles.toggle} ${isHead ? styles.toggleOn : ""}`}
          aria-pressed={isHead}
          disabled={!department.trim()}
          onClick={() => {
            const next = !isHead;
            setIsHead(next);
            if (next && !managerTouched && !editingId) setManagerId("");
          }}
        >
          <span className={styles.check}>{isHead ? "✓" : ""}</span>
          Руководитель отдела{department.trim() ? ` «${department}»` : ""}
        </button>
        <FormError message={personError || null} />
        <div className={styles.actions}>
          <Button type="submit">{editingId ? "Сохранить" : "Добавить в структуру"}</Button>
          {editingId && <Button type="button" variant="secondary" onClick={resetPersonForm}>Отмена</Button>}
        </div>
      </form>

      <div className={styles.tree}>
        {tree.length > 0 ? tree.map((n) => renderNode(n, 0)) : <p className={styles.muted}>Пока никто не добавлен</p>}
      </div>

      <h2 className={styles.h2}>Отделы и цвета</h2>
      <form onSubmit={handleAddDepartment} className={styles.deptForm}>
        <input className="input" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Название нового отдела" />
        <Button type="submit">Добавить отдел</Button>
      </form>
      <FormError message={deptError || null} />
      <div className={styles.items}>
        {departments?.map((d) => (
          <div key={d.id} className={styles.item}>
            <span className={styles.dot} style={{ background: d.color }} />
            <span className={styles.itemTitle} style={{ flex: 1 }}>{d.name}</span>
            <input
              type="color"
              className={styles.colorInput}
              value={d.color}
              onChange={(e) => updateDepartmentColor({ id: d.id, color: e.target.value })}
              aria-label={`Цвет отдела ${d.name}`}
            />
            <Button size="sm" variant="danger" onClick={() => handleDeleteDepartment(d.id)}>Удалить</Button>
          </div>
        ))}
        {departments?.length === 0 && <p className={styles.muted}>Отделов пока нет</p>}
      </div>
    </PageShell>
  );
}
