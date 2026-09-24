import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const types = searchParams.get("types");
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const limit = searchParams.get("limit");

  const items = await prisma.contentItem.findMany({
    where: {
      ...(type ? { type: type as any } : {}),
      ...(types ? { type: { in: types.split(",") as any[] } } : {}),
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
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: Number(limit) } : {}),
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const created = await prisma.contentItem.create({
    data: {
      title: body.title,
      content: body.content,
      type: body.type,
      category: body.category ?? null,
      createdBy: session.user.id,
      ...(body.fileUrl !== undefined ? { fileUrl: body.fileUrl, fileName: body.fileName } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      ...(body.files !== undefined ? { files: body.files } : {}),
    },
  });
  return NextResponse.json(created, { status: 201 });
}