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

  if (body.department) {
  await prisma.department.upsert({
    where: { name: body.department },
    update: {},
    create: { name: body.department },
  });
}

  const updated = await prisma.orgPerson.update({
    where: { id },
    data: {
      fullName: body.fullName,
      position: body.position || null,
      department: body.department || null,
      phone: body.phone || null,
      email: body.email || null,
      managerId: body.managerId || null,
      linkedUserId: body.linkedUserId || null,
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