import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { parseBody } from "@/lib/validate";
import { testCreateSchema } from "@/lib/schemas";

// Список отдельных тестов (не входящих в курсы)
export async function GET() {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tests = await prisma.test.findMany({
    where: { courseId: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true, access: true } } },
  });

  return NextResponse.json(
    tests.map(({ _count, ...t }) => ({
      ...t,
      questionsCount: _count.questions,
      attemptsCount: _count.attempts,
      accessCount: _count.access,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = await parseBody(req, testCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const courseId = body.courseId;
  let order = 0;
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    const last = await prisma.test.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    order = last ? last.order + 1 : 0;
  }

  const created = await prisma.test.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      accessMode: body.accessMode,
      courseId,
      order,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
