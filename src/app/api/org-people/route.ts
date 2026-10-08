import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { orgPersonSchema } from "@/lib/schemas";

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

  const parsed = await parseBody(req, orgPersonSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

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
      where: { department: body.department, isDepartmentHead: true },
      data: { isDepartmentHead: false },
    });
  }

  const created = await prisma.orgPerson.create({
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
  return NextResponse.json(created, { status: 201 });
}
