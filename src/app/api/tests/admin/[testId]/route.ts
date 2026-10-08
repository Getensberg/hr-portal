import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { parseBody } from "@/lib/validate";
import { testUpdateSchema } from "@/lib/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
      access: { include: { user: { select: { id: true, fullName: true, department: true } } } },
      course: { select: { id: true, title: true } },
      _count: { select: { attempts: true } },
    },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { _count, ...rest } = test;
  return NextResponse.json({ ...rest, attemptsCount: _count.attempts });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = await parseBody(req, testUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.status === "PUBLISHED") {
    const count = await prisma.testQuestion.count({ where: { testId } });
    if (count === 0) {
      return NextResponse.json({ error: "Добавьте хотя бы один вопрос, чтобы опубликовать тест" }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.test.update({
      where: { id: testId },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        accessMode: body.accessMode,
        passingScore: body.passingScore,
        maxAttempts: body.maxAttempts,
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
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { _count: { select: { attempts: true } } },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (test._count.attempts > 0) {
    return NextResponse.json({ error: "У теста уже есть попытки прохождения, удалить его нельзя" }, { status: 409 });
  }

  await prisma.test.delete({ where: { id: testId } });
  return NextResponse.json({ id: testId, deleted: true });
}
