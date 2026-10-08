import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { orgPersonSchema } from "@/lib/schemas";

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

  const parsed = await parseBody(req, orgPersonSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.managerId) {
    const cycle = await wouldCreateCycle(id, body.managerId);
    if (cycle) {
      return NextResponse.json(
        { error: "Нельзя назначить руководителем собственного подчинённого" },
        { status: 400 }
      );
    }
  }

  if (body.department) {
    await prisma.department.upsert({
      where: { name: body.department },
      update: {},
      create: { name: body.department },
    });
  }

  // Отметка имеет смысл только при заполненном отделе
  const isHead = body.isDepartmentHead && body.department !== null;

  // Руководитель у отдела один: у остальных отметка снимается
  if (isHead) {
    await prisma.orgPerson.updateMany({
      where: { department: body.department, isDepartmentHead: true, NOT: { id } },
      data: { isDepartmentHead: false },
    });
  }

  const updated = await prisma.orgPerson.update({
    where: { id },
    data: {
      fullName: body.fullName,
      position: body.position,
      department: body.department,
      phone: body.phone,
      email: body.email,
      managerId: body.managerId,
      linkedUserId: body.linkedUserId,
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
