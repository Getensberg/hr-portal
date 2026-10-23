import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { userCreateSchema } from "@/lib/schemas";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, department: true, position: true, phone: true, managerId: true },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, userCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
  }

  // Пароль из криптографически случайных символов (без похожих 0/O, 1/l/I)
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tempPassword = Array.from({ length: 14 }, () => alphabet[randomInt(alphabet.length)]).join("");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  if (body.department) {
    await prisma.department.upsert({
      where: { name: body.department },
      update: {},
      create: { name: body.department },
    });
  }

  const created = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      fullName: body.fullName,
      role: body.role,
      department: body.department,
      position: body.position,
      phone: body.phone,
    },
    select: { id: true, fullName: true, email: true, role: true, department: true, position: true, phone: true },
  });

  return NextResponse.json({ user: created, tempPassword }, { status: 201 });
}
