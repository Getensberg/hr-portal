import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { requestTemplateSchema } from "@/lib/schemas";

const TYPES = ["DOCUMENT", "LEAVE", "BUSINESS_TRIP", "EQUIPMENT", "ACCESS"] as const;

// Шаблоны заявлений: по одному файлу на тип заявки. Читать может любой вошедший сотрудник.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.documentTemplate.findMany({
    where: { requestType: { not: null } },
    select: { id: true, requestType: true, title: true, fileUrl: true, updatedAt: true },
  });
  return NextResponse.json(templates);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, requestTemplateSchema);
  if (!parsed.ok) return parsed.response;
  const { requestType, title, fileUrl } = parsed.data;

  const saved = await prisma.documentTemplate.upsert({
    where: { requestType },
    update: { title, fileUrl },
    create: { requestType, title, fileUrl, fields: [], createdBy: session.user.id },
    select: { id: true, requestType: true, title: true, fileUrl: true, updatedAt: true },
  });
  return NextResponse.json(saved);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = new URL(req.url).searchParams.get("type");
  if (!type || !(TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Неизвестный тип заявки" }, { status: 400 });
  }

  await prisma.documentTemplate.deleteMany({ where: { requestType: type as (typeof TYPES)[number] } });
  return NextResponse.json({ type, deleted: true });
}
