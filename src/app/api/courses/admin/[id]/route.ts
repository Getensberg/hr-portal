import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { parseBody } from "@/lib/validate";
import { courseUpdateSchema } from "@/lib/schemas";

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

  const parsed = await parseBody(req, courseUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

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
  }

  try {
    const updated = await prisma.course.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        accessMode: body.accessMode,
        status: body.status,
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
