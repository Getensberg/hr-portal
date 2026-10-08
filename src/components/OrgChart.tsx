"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

// Участник колонки отдела
interface ColNode {
  person: ChartPerson;
  children: ColNode[];
  size: number;
}

// Карточка верхнего яруса: руководство компании или руководитель отдела
interface TopNode {
  person: ChartPerson;
  column: { dept: string | null; members: ColNode[]; count: number } | null;
  children: TopNode[];
  size: number;
}

const FALLBACK_COLOR = "#999A9D";
const SelectContext = createContext<(p: ChartPerson) => void>(() => {});

const byName = (a: { person: ChartPerson }, b: { person: ChartPerson }) =>
  a.person.fullName.localeCompare(b.person.fullName, "ru");
const bySize = (a: { person: ChartPerson; size: number }, b: { person: ChartPerson; size: number }) =>
  b.size - a.size || byName(a, b);

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
  return forest;
}

// Карточка верхнего яруса: без отдела (руководство) или руководитель с подчинёнными из другого отдела
function isTop(node: TreeNode, parent: TreeNode | null): boolean {
  const dept = node.person.department;
  if (!parent || !dept) return true;
  return dept !== parent.person.department && node.children.length > 0;
}

function mostCommonDept(nodes: ColNode[]): string | null {
  const counts = new Map<string, number>();
  const walk = (list: ColNode[]) => {
    for (const n of list) {
      if (n.person.department) counts.set(n.person.department, (counts.get(n.person.department) ?? 0) + 1);
      walk(n.children);
    }
  };
  walk(nodes);
  let best: string | null = null;
  let max = 0;
  for (const [dept, n] of counts) {
    if (n > max) {
      best = dept;
      max = n;
    }
  }
  return best;
}

function buildTop(node: TreeNode): TopNode {
  const lifted: TopNode[] = [];

  // Копия поддерева для колонки; руководители других отделов уходят в верхний ярус
  const colify = (n: TreeNode): ColNode => {
    const children: ColNode[] = [];
    for (const c of n.children) {
      if (isTop(c, n)) lifted.push(buildTop(c));
      else children.push(colify(c));
    }
    return { person: n.person, children, size: 1 + children.reduce((s, c) => s + c.size, 0) };
  };

  const members: ColNode[] = [];
  for (const c of node.children) {
    if (isTop(c, node)) lifted.push(buildTop(c));
    else members.push(colify(c));
  }

  const membersSize = members.reduce((s, m) => s + m.size, 0);
  let column: TopNode["column"] = null;
  if (members.length > 0) {
    const own = node.person.department;
    const dept = own ?? mostCommonDept(members);
    column = { dept, members, count: membersSize + (own && own === dept ? 1 : 0) };
  }

  return {
    person: node.person,
    column,
    children: lifted,
    size: 1 + membersSize + lifted.reduce((s, c) => s + c.size, 0),
  };
}

function PersonCard({ person, colors }: { person: ChartPerson; colors: Map<string, string> }) {
  const onSelect = useContext(SelectContext);
  const color = (person.department && colors.get(person.department)) || FALLBACK_COLOR;
  const details = [person.fullName, person.position, person.phone, person.email].filter(Boolean).join("\n");
  return (
    <button
      type="button"
      className={styles.card}
      style={{ borderLeftColor: color }}
      title={details}
      onClick={() => onSelect(person)}
    >
      <div className={styles.name}>{person.fullName}</div>
      {person.position && <div className={styles.position}>{person.position}</div>}
    </button>
  );
}

// Руководители направлений горизонтально, сотрудники без подчинённых столбиком
function Members({ nodes, colors }: { nodes: ColNode[]; colors: Map<string, string> }) {
  if (nodes.length === 0) return null;
  const branches = nodes.filter((n) => n.children.length > 0).sort(bySize);
  const leaves = nodes.filter((n) => n.children.length === 0).sort(byName);

  const stack = (
    <ul className={`${styles.stack} ${branches.length > 0 ? styles.stackFlush : ""}`}>
      {leaves.map((l) => (
        <li key={l.person.id}>
          <PersonCard person={l.person} colors={colors} />
        </li>
      ))}
    </ul>
  );

  if (branches.length === 0) return stack;

  return (
    <ul className={styles.row}>
      {branches.map((b) => (
        <li key={b.person.id}>
          <ColUnit node={b} colors={colors} />
        </li>
      ))}
      {leaves.length > 0 && <li className={styles.leafCol}>{stack}</li>}
    </ul>
  );
}

function ColUnit({ node, colors }: { node: ColNode; colors: Map<string, string> }) {
  return (
    <div className={styles.unit}>
      <PersonCard person={node.person} colors={colors} />
      <Members nodes={node.children} colors={colors} />
    </div>
  );
}

function TopUnit({ node, colors }: { node: TopNode; colors: Map<string, string> }) {
  const items: { key: string; size: number; el: React.ReactNode }[] = [];

  if (node.column) {
    const { dept, members, count } = node.column;
    const color = (dept && colors.get(dept)) || FALLBACK_COLOR;
    items.push({
      key: `col-${node.person.id}`,
      size: count,
      el: (
        <div
          className={`${styles.unit} ${styles.zone}`}
          style={{ background: hexToRgba(color, 0.12), borderColor: hexToRgba(color, 0.4) }}
        >
          {dept && (
            <div className={styles.zoneLabel}>
              {dept} ({count})
            </div>
          )}
          <Members nodes={members} colors={colors} />
        </div>
      ),
    });
  }
  for (const c of node.children) {
    items.push({ key: c.person.id, size: c.size, el: <TopUnit node={c} colors={colors} /> });
  }
  items.sort((a, b) => b.size - a.size);

  return (
    <div className={styles.unit}>
      <PersonCard person={node.person} colors={colors} />
      {items.length > 0 && (
        <ul className={styles.row}>
          {items.map((i) => (
            <li key={i.key}>{i.el}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrgChart({ people, departments }: { people: ChartPerson[]; departments: ChartDepartment[] }) {
  const tops = useMemo(
    () => buildForest(people).map(buildTop).sort(bySize),
    [people]
  );
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) if (d.color) map.set(d.name, d.color);
    return map;
  }, [departments]);

  const [scale, setScale] = useState(1);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<ChartPerson | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const moved = useRef(false);

  // Реальный размер схемы без масштаба: нужен, чтобы прокрутка соответствовала масштабу
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [people.length]);

  function fit() {
    if (!viewport.current || size.w === 0) return;
    const next = Math.min(1, (viewport.current.clientWidth - 8) / size.w);
    setScale(Math.max(0.3, Math.round(next * 100) / 100));
    viewport.current.scrollTo({ left: 0, top: 0 });
  }

  function handleSelect(p: ChartPerson) {
    if (!moved.current) setSelected(p);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !viewport.current) return;
    moved.current = false;
    drag.current = { x: e.clientX, y: e.clientY, left: viewport.current.scrollLeft, top: viewport.current.scrollTop };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !viewport.current) return;
    if (Math.abs(e.clientX - drag.current.x) + Math.abs(e.clientY - drag.current.y) > 5) moved.current = true;
    viewport.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    viewport.current.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  }
  function endDrag() {
    drag.current = null;
  }

  if (people.length === 0) return <p className="text-s">Оргструктура пока не заполнена</p>;

  const manager = selected?.managerId ? people.find((p) => p.id === selected.managerId) : null;
  const reports = selected ? people.filter((p) => p.managerId === selected.id) : [];
  const selectedColor = (selected?.department && colors.get(selected.department)) || FALLBACK_COLOR;

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
        <div style={size.w > 0 ? { width: size.w * scale, height: size.h * scale } : undefined}>
          <div ref={canvas} className={styles.canvas} style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <SelectContext.Provider value={handleSelect}>
              {tops.map((t) => (
                <TopUnit key={t.person.id} node={t} colors={colors} />
              ))}
            </SelectContext.Provider>
          </div>
        </div>
      </div>

      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button type="button" className={styles.close} onClick={() => setSelected(null)} aria-label="Закрыть">×</button>
            <div className={styles.modalName}>{selected.fullName}</div>
            {selected.position && <div className={styles.modalPosition}>{selected.position}</div>}
            {selected.department && (
              <div className={styles.modalDept}>
                <span className={styles.dot} style={{ background: selectedColor }} />
                {selected.department}
              </div>
            )}
            <dl className={styles.modalList}>
              {manager && (<><dt>Руководитель</dt><dd>{manager.fullName}</dd></>)}
              {reports.length > 0 && (<><dt>Прямых подчинённых</dt><dd>{reports.length}</dd></>)}
              {selected.phone && (<><dt>Телефон</dt><dd><a href={`tel:${selected.phone}`}>{selected.phone}</a></dd></>)}
              {selected.email && (<><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></>)}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}