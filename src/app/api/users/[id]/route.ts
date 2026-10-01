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

  if (body.email) {
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Этот email уже занят другим пользователем" }, { status: 409 });
    }
  }

  if (body.department) {
  await prisma.department.upsert({
    where: { name: body.department },
    update: {},
    create: { name: body.department },
  });
}

  const updated = await prisma.user.update({
    where: { id },
    data: {
      fullName: body.fullName,
      email: body.email,
      department: body.department || null,
      position: body.position || null,
      phone: body.phone || null,
      role: body.role,
    },
    select: { id: true, fullName: true, email: true, role: true, department: true, position: true, phone: true },
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
  if (id === session.user.id) {
    return NextResponse.json({ error: "Нельзя удалить самого себя" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ id, deleted: true });
}