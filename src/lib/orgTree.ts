export interface FlatOrgPerson {
  id: string;
  fullName: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  managerId: string | null;
  linkedUserId?: string | null;
}

export interface OrgPersonNode extends FlatOrgPerson {
  children: OrgPersonNode[];
}

export function buildTree(flat: FlatOrgPerson[], filter: (p: FlatOrgPerson) => boolean): OrgPersonNode[] {
  const group = flat.filter(filter);
  const groupIds = new Set(group.map((p) => p.id));
  const byId = new Map<string, OrgPersonNode>(group.map((p) => [p.id, { ...p, children: [] }]));
  const roots: OrgPersonNode[] = [];

  byId.forEach((node: OrgPersonNode) => {
    if (node.managerId && groupIds.has(node.managerId)) {
      byId.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// Все подчинённые (и подчинённые подчинённых) конкретного человека — нужно,
// чтобы нельзя было назначить руководителем собственного потомка
export function getDescendantIds(flat: { id: string; managerId: string | null }[], rootId: string): Set<string> {
  const children = new Map<string, string[]>();
  flat.forEach((p) => {
    if (p.managerId) {
      const list = children.get(p.managerId) ?? [];
      list.push(p.id);
      children.set(p.managerId, list);
    }
  });
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    (children.get(id) ?? []).forEach((childId) => {
      if (!result.has(childId)) {
        result.add(childId);
        stack.push(childId);
      }
    });
  }
  return result;
}

// Глубина человека в общем дереве: у самых верхних — 0, у их подчинённых — 1, и так далее
export function computeDepths(flat: { id: string; managerId: string | null }[]): Map<string, number> {
  const byId = new Map(flat.map((p) => [p.id, p]));
  const depths = new Map<string, number>();

  function getDepth(id: string, visited: Set<string>): number {
    if (depths.has(id)) return depths.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    const person = byId.get(id);
    if (!person || !person.managerId || !byId.has(person.managerId)) {
      depths.set(id, 0);
      return 0;
    }
    const d = getDepth(person.managerId, visited) + 1;
    depths.set(id, d);
    return d;
  }

  flat.forEach((p) => getDepth(p.id, new Set()));
  return depths;
}

// Отделы упорядочены по тому, насколько высоко в иерархии стоит их вход
// человек в этом отделе, чей руководитель либо отсутствует, либо находится в другом отделе
export function orderDepartments(flat: FlatOrgPerson[]): string[] {
  const depths = computeDepths(flat);
  const byId = new Map(flat.map((p) => [p.id, p]));
  const deptMinDepth = new Map<string, number>();

  flat.forEach((p) => {
    if (!p.department) return;
    const manager = p.managerId ? byId.get(p.managerId) : null;
    const isEntryPoint = !manager || manager.department !== p.department;
    if (isEntryPoint) {
      const d = depths.get(p.id) ?? 0;
      const current = deptMinDepth.get(p.department);
      if (current === undefined || d < current) deptMinDepth.set(p.department, d);
    }
  });

  const names = Array.from(new Set(flat.filter((p) => p.department).map((p) => p.department as string)));
  return names.sort((a, b) => {
    const da = deptMinDepth.get(a) ?? 999;
    const db = deptMinDepth.get(b) ?? 999;
    return da !== db ? da - db : a.localeCompare(b);
  });
}