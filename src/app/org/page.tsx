"use client";
import { useState } from "react";
import { useGetOrgPeopleQuery, useGetOrgDocumentsQuery, useGetDepartmentsQuery } from "@/store/api";
import { buildTree, orderDepartments, type OrgPersonNode } from "@/lib/orgTree";
import { hexToRgba } from "@/lib/color";
import { PageShell } from "@/components/PageShell";
import { Card, CardTitle } from "@/components/Card";
import styles from "./org.module.css";

// Отдел с таким числом людей и больше занимает отдельную строку на всю ширину
const LARGE_DEPARTMENT_SIZE = 8;

function PersonCard({ node }: { node: OrgPersonNode }) {
  const [open, setOpen] = useState(false);
  return (
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
  );
}

function OrgBranch({ nodes }: { nodes: OrgPersonNode[] }): React.ReactNode {
  return (
    <ul className={styles.branch}>
      {nodes.map((n) => (
        <li key={n.id} className={styles.item}>
          <PersonCard node={n} />
          {n.children.length > 0 && <OrgBranch nodes={n.children} />}
        </li>
      ))}
    </ul>
  );
}

function OrgTree({ roots }: { roots: OrgPersonNode[] }) {
  return (
    <div className={styles.roots}>
      {roots.map((r) => (
        <div key={r.id} className={styles.rootItem}>
          <PersonCard node={r} />
          {r.children.length > 0 && <OrgBranch nodes={r.children} />}
        </div>
      ))}
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

  // Численность каждого отдела
  const sizeOf = new Map<string, number>();
  all.forEach((p) => {
    if (p.department) sizeOf.set(p.department, (sizeOf.get(p.department) ?? 0) + 1);
  });

  // Сначала крупные отделы, при равной численности действует порядок по иерархии
  const hierarchyOrder = orderDepartments(all);
  const hierarchyIndex = new Map(hierarchyOrder.map((d, i) => [d, i]));
  const departments = [...hierarchyOrder].sort((a, b) => {
    const diff = (sizeOf.get(b) ?? 0) - (sizeOf.get(a) ?? 0);
    return diff !== 0 ? diff : (hierarchyIndex.get(a) ?? 0) - (hierarchyIndex.get(b) ?? 0);
  });

  return (
    <PageShell title="Оргструктура" wide>
      {isLoading && <p className="text-s">Загрузка...</p>}

      {leadership.length > 0 && (
        <div className={`${styles.block} ${styles.leadership}`}>
          <h3 className={`${styles.blockTitle} text-h4`}>Руководство компании</h3>
          <div className={styles.blockScroll}>
            <OrgTree roots={leadership} />
          </div>
        </div>
      )}

      <div className={styles.depts}>
        {departments.map((dept) => {
          const color = colorMap.get(dept) ?? "#CADCFC";
          const size = sizeOf.get(dept) ?? 0;
          const isLarge = size >= LARGE_DEPARTMENT_SIZE;
          return (
            <div
              key={dept}
              className={`${styles.block} ${isLarge ? styles.blockLarge : ""}`}
              style={{ background: hexToRgba(color, 0.16), borderColor: hexToRgba(color, 0.45) }}
            >
              <h4 className={`${styles.blockTitle} text-h4`}>
                {dept} <span className="text-xs">· {size}</span>
              </h4>
              <div className={styles.blockScroll}>
                <OrgTree roots={buildTree(all, (p) => p.department === dept)} />
              </div>
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