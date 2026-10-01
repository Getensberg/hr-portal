import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const updated = await prisma.department.update({ where: { id }, data: { color: body.color } });
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

  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [peopleCount, usersCount] = await Promise.all([
    prisma.orgPerson.count({ where: { department: dept.name } }),
    prisma.user.count({ where: { department: dept.name } }),
  ]);
if (peopleCount > 0 || usersCount > 0) {
  const parts: string[] = [];
  if (peopleCount > 0) parts.push(`в оргструктуре: ${peopleCount}`);
  if (usersCount > 0) parts.push(`у аккаунтов сотрудников: ${usersCount}`);
  return NextResponse.json(
    { error: `Отдел ещё используется (${parts.join(", ")}). Поменяйте его там, прежде чем удалять.` },
    { status: 409 }
  );
}

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ id, deleted: true });
}