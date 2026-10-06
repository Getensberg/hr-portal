import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function GET() {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lessons: true, access: true, tests: true } } },
  });

  return NextResponse.json(
    courses.map(({ _count, ...course }) => ({
      ...course,
      lessonsCount: _count.lessons,
      testsCount: _count.tests,
      accessCount: _count.access,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Укажите название курса" }, { status: 400 });

  const created = await prisma.course.create({
    data: {
      title: title.slice(0, 200),
      description: body.description?.trim() || null,
      category: body.category?.trim() || null,
      accessMode: body.accessMode === "RESTRICTED" ? "RESTRICTED" : "OPEN",
      createdBy: session.user.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}