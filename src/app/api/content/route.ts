import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { contentSchema, contentType } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  // Параметры из адреса проверяем: неизвестные значения игнорируем, размер выборки ограничиваем
  const typeParse = contentType.safeParse(searchParams.get("type"));
  const type = typeParse.success ? typeParse.data : null;
  const types = (searchParams.get("types") ?? "")
    .split(",")
    .map((t) => contentType.safeParse(t.trim()))
    .flatMap((r) => (r.success ? [r.data] : []));
  const category = (searchParams.get("category") ?? "").slice(0, 100);
  const q = (searchParams.get("q") ?? "").slice(0, 100);
  const limitNum = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(Math.floor(limitNum), 200) : null;

  const items = await prisma.contentItem.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(types.length ? { type: { in: types } } : {}),
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
    ...(limit ? { take: limit } : {}),
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, contentSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.contentItem.create({
    data: {
      title: body.title,
      content: body.content,
      type: body.type,
      category: body.category,
      ...(body.isImportant !== undefined ? { isImportant: body.isImportant } : {}),
      createdBy: session.user.id,
      ...(body.fileUrl !== undefined ? { fileUrl: body.fileUrl, fileName: body.fileName } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      ...(body.files !== undefined ? { files: body.files } : {}),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
