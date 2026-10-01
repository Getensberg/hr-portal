"use client";
import { useState } from "react";
import { buildTree, orderDepartments, type OrgPersonNode } from "@/lib/orgTree";
import { useGetOrgPeopleQuery, useGetOrgDocumentsQuery, useGetDepartmentsQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";

import styles from "./org.module.css";

function PersonCard({ node, depth }: { node: OrgPersonNode; depth: number }): React.ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div className={styles.personCard} onClick={() => setOpen(!open)}>
        <div className={styles.personName}>{node.fullName}</div>
        {node.position && <div className={styles.personPosition}>{node.position}</div>}
        {open && (
          <div className={styles.contacts}>
            {node.phone && <div>{node.phone}</div>}
            {node.email && <div>{node.email}</div>}
            {!node.phone && !node.email && <div className="text-xs">Контакты не указаны</div>}
          </div>
        )}
      </div>
      {node.children.map((c) => <PersonCard key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}

export default function OrgPage() {
  const { data: people, isLoading } = useGetOrgPeopleQuery();
  const { data: docs } = useGetOrgDocumentsQuery();

  const { data: departmentMeta } = useGetDepartmentsQuery();
  const colorMap = new Map((departmentMeta ?? []).map((d) => [d.name, d.color]));

  const all = people ?? [];
  const leadership = buildTree(all, (p) => !p.department);
  const departments = orderDepartments(all);
    

  return (
    <PageShell title="Оргструктура" wide>
      {isLoading && <p className="text-s">Загрузка...</p>}

      {leadership.length > 0 && (
        <div className={styles.leadership}>
          <h3 className={`${styles.leadershipTitle} text-h4`}>Руководство компании</h3>
          {leadership.map((n) => <PersonCard key={n.id} node={n} depth={0} />)}
        </div>
      )}

      <div className={styles.columns}>
        {departments.map((dept) => {
          const tree = buildTree(all, (p) => p.department === dept);
          return (
            <div key={dept} className={styles.column} style={{ background: colorMap.get(dept) }}>
              <h4 className={`${styles.columnTitle} text-h4`}>{dept}</h4>
              {tree.map((n) => <PersonCard key={n.id} node={n} depth={0} />)}
            </div>
          );
        })}
      </div>

      {all.length === 0 && !isLoading && <p className="text-s">Оргструктура пока не заполнена</p>}

      <div className={styles.filesSection}>
        <h2 className="text-h2">Файлы</h2>
        {docs?.map((d) => (
          <Card key={d.id}>
            <CardTitle>{d.title}</CardTitle>
            {d.description && <p className="text-s">{d.description}</p>}
            {d.fileUrl ? (
              <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">📎 Скачать файл</a>
            ) : (
              <p className="text-xs">Файл появится здесь позже</p>
            )}
          </Card>
        ))}
        {docs?.length === 0 && <p className="text-s">Файлы пока не добавлены</p>}
      </div>
    </PageShell>
  );
}