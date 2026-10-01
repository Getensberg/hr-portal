import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Укажите название" }, { status: 400 });
  }

  const existing = await prisma.department.findUnique({ where: { name: body.name } });
  if (existing) {
    return NextResponse.json({ error: "Такой отдел уже существует" }, { status: 409 });
  }

  const created = await prisma.department.create({
    data: { name: body.name, color: body.color || "#CADCFC" },
  });
  return NextResponse.json(created, { status: 201 });
}