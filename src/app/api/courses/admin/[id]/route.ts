import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { order: "asc" } },
      tests: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, _count: { select: { questions: true, attempts: true } } },
      },
      access: { include: { user: { select: { id: true, fullName: true, department: true } } } },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { tests, ...rest } = course;
  return NextResponse.json({
    ...rest,
    tests: tests.map(({ _count, ...t }) => ({
      ...t,
      questionsCount: _count.questions,
      attemptsCount: _count.attempts,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  let title: string | undefined;
  if (body.title !== undefined) {
    title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Название не может быть пустым" }, { status: 400 });
    title = title.slice(0, 200);
  }

  let status: "DRAFT" | "PUBLISHED" | undefined;
  if (body.status !== undefined) {
    if (body.status === "PUBLISHED") {
      const [lessons, emptyTests] = await Promise.all([
        prisma.lesson.count({ where: { courseId: id } }),
        prisma.test.count({ where: { courseId: id, questions: { none: {} } } }),
      ]);
      if (lessons === 0) {
        return NextResponse.json({ error: "Добавьте хотя бы один урок, чтобы опубликовать курс" }, { status: 400 });
      }
      if (emptyTests > 0) {
        return NextResponse.json({ error: "В курсе есть тест без вопросов: добавьте вопросы или удалите тест" }, { status: 400 });
      }
      status = "PUBLISHED";
    } else {
      status = "DRAFT";
    }
  }

  try {
    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.category !== undefined ? { category: body.category?.trim() || null } : {}),
        ...(body.accessMode !== undefined
          ? { accessMode: body.accessMode === "RESTRICTED" ? ("RESTRICTED" as const) : ("OPEN" as const) }
          : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.course.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ id, deleted: true });
}