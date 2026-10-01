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
  useGetOrgDocumentsQuery,
  useCreateOrgDocumentMutation,
  useDeleteOrgDocumentMutation,
} from "@/store/api";
import { buildTree, getDescendantIds, type OrgPersonNode } from "@/lib/orgTree";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./org-admin.module.css";
import { DepartmentInput } from "@/components/DepartmentInput";
import { useGetDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentColorMutation, useDeleteDepartmentMutation } from "@/store/api";
import { useUploadFileMutation } from "@/store/api";

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

  const { data: docs } = useGetOrgDocumentsQuery();
  const [createDoc] = useCreateOrgDocumentMutation();
  const [deleteDoc] = useDeleteOrgDocumentMutation();

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [managerId, setManagerId] = useState("");
  const [linkedUserId, setLinkedUserId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [personError, setPersonError] = useState("");

  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");

  const { data: departments } = useGetDepartmentsQuery();
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartmentColor] = useUpdateDepartmentColorMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const [newDeptName, setNewDeptName] = useState("");
  const [uploadFile] = useUploadFileMutation();
  const [docFile, setDocFile] = useState<File | null>(null);

  const [docError, setDocError] = useState("");
  const [deptError, setDeptError] = useState("");

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  const excludedIds = editingId
    ? new Set([editingId, ...getDescendantIds(people ?? [], editingId)])
    : new Set<string>();
  const managerOptions = (people ?? []).filter((p) => !excludedIds.has(p.id));

  function handleLinkedUserChange(userId: string) {
    setLinkedUserId(userId);
    const u = (users ?? []).find((x) => x.id === userId);
    if (u) {
      setFullName(u.fullName);
      setDepartment(u.department ?? "");
      setPosition(u.position ?? "");
      setPhone(u.phone ?? "");
      setEmail(u.email);
    }
  }

  async function handleAddDepartment(e: React.FormEvent) {
  e.preventDefault();
  if (!newDeptName.trim()) return;
  try {
    await createDepartment({ name: newDeptName }).unwrap();
    setNewDeptName("");
  } catch {}
}

async function handleDeleteDepartment(id: string) {
  setDeptError("");
  try {
    await deleteDepartment(id).unwrap();
  } catch (err: any) {
    setDeptError(err?.data?.error || "Не удалось удалить отдел");
  }
}

  function resetPersonForm() {
    setFullName(""); setPosition(""); setDepartment(""); setPhone(""); setEmail("");
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
    };
    try {
      if (editingId) {
        await updateOrgPerson({ id: editingId, ...payload }).unwrap();
      } else {
        await createOrgPerson(payload).unwrap();
      }
      resetPersonForm();
    } catch (err: any) {
      setPersonError(err?.data?.error || "Не удалось сохранить");
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
        <div className={styles.treeRow} style={{ paddingLeft: depth * 24 }}>
          <span className="text-s">
            <strong>{node.fullName}</strong>
            {node.position ? ` · ${node.position}` : ""}
            {node.department ? ` · ${node.department}` : ""}
            {node.linkedUserId ? " · связан с аккаунтом" : ""}
          </span>
          <div className={styles.treeActions}>
            <Button size="sm" variant="secondary" onClick={() => startEditPerson(node)}>Изменить</Button>
            <Button size="sm" variant="danger" onClick={() => handleDeletePerson(node)}>Удалить</Button>
          </div>
        </div>
        {node.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  }

async function handleDocSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!docTitle) {
  setDocError("Укажите название");
  return;
}
setDocError("");

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  if (docFile) {
    const formData = new FormData();
    formData.append("file", docFile);
    const uploaded = await uploadFile(formData).unwrap();
    fileUrl = uploaded.url;
    fileName = uploaded.name;
  }

  await createDoc({ title: docTitle, description: docDescription, fileUrl, fileName });
  setDocTitle(""); setDocDescription(""); setDocFile(null);
}

  function handleDeleteDoc(id: string) {
    if (confirm("Удалить этот пункт оргструктуры?")) deleteDoc(id);
  }

  return (
    <PageShell title="Оргструктура — управление" wide>
      <h2 className="text-h2">Сотрудники и подчинённость</h2>
      <form onSubmit={handlePersonSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ФИО" />
          <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" />
        </div>
        <div className={styles.formRow}>
          <DepartmentInput value={department} onChange={setDepartment} placeholder="Отдел (пусто — руководство компании)" />
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        </div>
        <div className={styles.formRow}>
          <select className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">Без руководителя (верхний уровень)</option>
            {managerOptions.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
          <select className="input" value={linkedUserId} onChange={(e) => handleLinkedUserChange(e.target.value)}>
            <option value="">Без связанного аккаунта</option>
            {(users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
          </select>
        </div>
        {personError && <p className={styles.error}>{personError}</p>}
        <div>
          <Button type="submit">{editingId ? "Сохранить" : "Добавить в структуру"}</Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetPersonForm} style={{ marginLeft: 8 }}>Отмена</Button>
          )}
        </div>
      </form>

      <Card>
        {tree.length > 0 ? tree.map((n) => renderNode(n, 0)) : <p className="text-s">Пока никто не добавлен</p>}
      </Card>

      <h2 className="text-h2">Файлы оргструктуры</h2>
      <Card>
        <p className="text-xs">
          Можно отдельно прикрепить готовый файл (например, экспорт из Miro) — он не связан с деревом выше.
        </p>
      </Card>

      <form onSubmit={handleDocSubmit} className={styles.form}>
        <input className="input" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Название (например, «Схема отделов 2026»)" />
        <textarea className="textarea" value={docDescription} onChange={(e) => setDocDescription(e.target.value)} placeholder="Описание (необязательно)" rows={3} />
                  <div>
  <label className="text-xs">Файл (например, экспорт схемы из Miro)</label>
  <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
</div>
        <Button type="submit">Добавить</Button>
        {docError && <p className={styles.error}>{docError}</p>}
      </form>

      {docs?.map((d) => (
        <Card key={d.id}>
          <div className={styles.itemRow}>
            <div>
              <CardTitle>{d.title}</CardTitle>
              {d.description && <p className="text-xs">{d.description}</p>}
            </div>
            <Button variant="danger" onClick={() => handleDeleteDoc(d.id)}>Удалить</Button>
          </div>
        </Card>
      ))}
      {docs?.length === 0 && <p className="text-s">Пока ничего не добавлено</p>}

      <h2 className="text-h2">Отделы и цвета</h2>
<form onSubmit={handleAddDepartment} className={styles.form}>
  <input className="input" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Название нового отдела" />
  <div><Button type="submit">Добавить отдел</Button></div>
</form>
<Card>
  {departments?.map((d) => (
    <div key={d.id} className={styles.deptRow}>
      <span className={`${styles.deptName} text-s`}>{d.name}</span>
      <input
        type="color"
        className={styles.colorInput}
        value={d.color}
        onChange={(e) => updateDepartmentColor({ id: d.id, color: e.target.value })}
      />
      <Button size="sm" variant="danger" onClick={() => handleDeleteDepartment(d.id)}>Удалить</Button>
    </div>
  ))}
  {departments?.length === 0 && <p className="text-s">Отделов пока нет</p>}
</Card>
{deptError && <p className={styles.error}>{deptError}</p>}
    </PageShell>
  );
}