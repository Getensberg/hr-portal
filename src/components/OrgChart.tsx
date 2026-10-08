"use client";
import { useMemo, useRef, useState } from "react";
import { hexToRgba } from "@/lib/color";
import styles from "./OrgChart.module.css";

export interface ChartPerson {
  id: string;
  fullName: string;
  position: string | null;
  department: string | null;
  phone?: string | null;
  email?: string | null;
  managerId: string | null;
}

export interface ChartDepartment {
  name: string;
  color: string | null;
}

interface TreeNode {
  person: ChartPerson;
  children: TreeNode[];
  size: number;
}

const FALLBACK_COLOR = "#999A9D";

function buildForest(people: ChartPerson[]): TreeNode[] {
  const ids = new Set(people.map((p) => p.id));
  const kids = new Map<string, ChartPerson[]>();
  const roots: ChartPerson[] = [];

  for (const p of people) {
    if (p.managerId && p.managerId !== p.id && ids.has(p.managerId)) {
      const list = kids.get(p.managerId) ?? [];
      list.push(p);
      kids.set(p.managerId, list);
    } else {
      roots.push(p);
    }
  }

  const seen = new Set<string>();
  function make(p: ChartPerson): TreeNode {
    seen.add(p.id);
    const children = (kids.get(p.id) ?? []).filter((c) => !seen.has(c.id)).map(make);
    return { person: p, children, size: 1 + children.reduce((s, c) => s + c.size, 0) };
  }

  const forest = roots.map(make);
  // Страховка от циклов: кого не достали от корней, показываем отдельными корнями
  for (const p of people) if (!seen.has(p.id)) forest.push(make(p));
  return forest.sort((a, b) => b.size - a.size || a.person.fullName.localeCompare(b.person.fullName, "ru"));
}

function countDept(node: TreeNode, dept: string): number {
  return (node.person.department === dept ? 1 : 0) + node.children.reduce((s, c) => s + countDept(c, dept), 0);
}

const byName = (a: TreeNode, b: TreeNode) => a.person.fullName.localeCompare(b.person.fullName, "ru");
const bySize = (a: TreeNode, b: TreeNode) => b.size - a.size || byName(a, b);

function PersonCard({ person, colors }: { person: ChartPerson; colors: Map<string, string> }) {
  const color = (person.department && colors.get(person.department)) || FALLBACK_COLOR;
  const details = [person.fullName, person.position, person.phone, person.email].filter(Boolean).join("\n");
  return (
    <div className={styles.card} style={{ borderLeftColor: color }} title={details}>
      <div className={styles.name}>{person.fullName}</div>
      {person.position && <div className={styles.position}>{person.position}</div>}
    </div>
  );
}

function Unit({
  node,
  parentDept,
  colors,
}: {
  node: TreeNode;
  parentDept: string | null;
  colors: Map<string, string>;
}) {
  const { person, children } = node;
  const dept = person.department;
  const startsZone = !!dept && dept !== parentDept;

  const branches = children.filter((c) => c.children.length > 0).sort(bySize);
  const leaves = children.filter((c) => c.children.length === 0).sort(byName);

  const content = (
    <>
      <PersonCard person={person} colors={colors} />

      {children.length > 0 &&
        (branches.length === 0 ? (
          <ul className={styles.stack}>
            {leaves.map((l) => (
              <li key={l.person.id}>
                <PersonCard person={l.person} colors={colors} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.row}>
            {branches.map((b) => (
              <li key={b.person.id}>
                <Unit node={b} parentDept={dept} colors={colors} />
              </li>
            ))}
            {leaves.length > 0 && (
              <li className={styles.leafCol}>
                <ul className={`${styles.stack} ${styles.stackFlush}`}>
                  {leaves.map((l) => (
                    <li key={l.person.id}>
                      <PersonCard person={l.person} colors={colors} />
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        ))}
    </>
  );

  if (!startsZone || !dept) return <div className={styles.unit}>{content}</div>;

  const color = colors.get(dept) ?? FALLBACK_COLOR;
  return (
    <div
      className={`${styles.unit} ${styles.zone}`}
      style={{ background: hexToRgba(color, 0.12), borderColor: hexToRgba(color, 0.4) }}
    >
      <div className={styles.zoneLabel}>
        {dept} ({countDept(node, dept)})
      </div>
      {content}
    </div>
  );
}

export function OrgChart({ people, departments }: { people: ChartPerson[]; departments: ChartDepartment[] }) {
  const forest = useMemo(() => buildForest(people), [people]);
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) if (d.color) map.set(d.name, d.color);
    return map;
  }, [departments]);

  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  function fit() {
    if (!viewport.current || !canvas.current) return;
    const natural = canvas.current.scrollWidth / scale;
    const next = Math.min(1, (viewport.current.clientWidth - 8) / natural);
    setScale(Math.max(0.3, Math.round(next * 100) / 100));
    viewport.current.scrollTo({ left: 0, top: 0 });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !viewport.current) return;
    drag.current = { x: e.clientX, y: e.clientY, left: viewport.current.scrollLeft, top: viewport.current.scrollTop };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !viewport.current) return;
    viewport.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    viewport.current.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  }
  function endDrag() {
    drag.current = null;
  }

  if (people.length === 0) return <p className="text-s">Оргструктура пока не заполнена</p>;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.tool} onClick={() => setScale((s) => Math.max(0.3, Math.round((s - 0.1) * 10) / 10))}>−</button>
        <span className={styles.scale}>{Math.round(scale * 100)}%</span>
        <button type="button" className={styles.tool} onClick={() => setScale((s) => Math.min(1.3, Math.round((s + 0.1) * 10) / 10))}>+</button>
        <button type="button" className={styles.tool} onClick={() => setScale(1)}>100%</button>
        <button type="button" className={styles.tool} onClick={fit}>Вписать</button>
        <span className={styles.tip}>Схему можно двигать мышью</span>
      </div>

      <div
        ref={viewport}
        className={styles.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div ref={canvas} className={styles.canvas} style={{ zoom: scale }}>
          {forest.map((root) => (
            <Unit key={root.person.id} node={root} parentDept={null} colors={colors} />
          ))}
        </div>
      </div>
    </div>
  );
}