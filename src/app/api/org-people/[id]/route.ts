import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function wouldCreateCycle(entryId: string, proposedManagerId: string): Promise<boolean> {
  if (entryId === proposedManagerId) return true;
  let current: string | null = proposedManagerId;
  const visited = new Set<string>();
  while (current) {
    if (current === entryId) return true;
    if (visited.has(current)) break;
    visited.add(current);
    const node: { managerId: string | null } | null = await prisma.orgPerson.findUnique({
      where: { id: current },
      select: { managerId: true },
    });
    current = node?.managerId ?? null;
  }
  return false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.managerId) {
    const cycle = await wouldCreateCycle(id, body.managerId);
    if (cycle) {
      return NextResponse.json(
        { error: "Нельзя назначить руководителем собственного подчинённого" },
        { status: 400 }
      );
    }
  }

  const department = String(body.department ?? "").trim();

  if (department) {
    await prisma.department.upsert({
      where: { name: department },
      update: {},
      create: { name: department },
    });
  }

  // Отметка имеет смысл только при заполненном отделе
  const isHead = Boolean(body.isDepartmentHead) && Boolean(department);

  // Руководитель у отдела один: у остальных отметка снимается
  if (isHead) {
    await prisma.orgPerson.updateMany({
      where: { department, isDepartmentHead: true, NOT: { id } },
      data: { isDepartmentHead: false },
    });
  }

  const updated = await prisma.orgPerson.update({
    where: { id },
    data: {
      fullName: body.fullName,
      position: body.position || null,
      department: department || null,
      phone: body.phone || null,
      email: body.email || null,
      managerId: body.managerId || null,
      linkedUserId: body.linkedUserId || null,
      isDepartmentHead: isHead,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entry = await prisma.orgPerson.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Подчинённых поднимаем на уровень выше, к руководителю удаляемого
  await prisma.orgPerson.updateMany({
    where: { managerId: id },
    data: { managerId: entry.managerId },
  });

  await prisma.orgPerson.delete({ where: { id } });
  return NextResponse.json({ id, deleted: true });
}