import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const people = await prisma.orgPerson.findMany({ orderBy: { fullName: "asc" } });
  return NextResponse.json(people);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: "Укажите ФИО" }, { status: 400 });
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
      where: { department, isDepartmentHead: true },
      data: { isDepartmentHead: false },
    });
  }

  const created = await prisma.orgPerson.create({
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
  return NextResponse.json(created, { status: 201 });
}