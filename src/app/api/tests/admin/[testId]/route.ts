import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

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

  const body = await req.json();

  let title: string | undefined;
  if (body.title !== undefined) {
    title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Название не может быть пустым" }, { status: 400 });
    title = title.slice(0, 200);
  }

  let passingScore: number | undefined;
  if (body.passingScore !== undefined) {
    passingScore = Math.round(Number(body.passingScore));
    if (!(passingScore >= 1 && passingScore <= 100)) {
      return NextResponse.json({ error: "Проходной балл должен быть от 1 до 100" }, { status: 400 });
    }
  }

  let maxAttempts: number | undefined;
  if (body.maxAttempts !== undefined) {
    maxAttempts = Math.round(Number(body.maxAttempts));
    if (!(maxAttempts >= 1 && maxAttempts <= 20)) {
      return NextResponse.json({ error: "Число попыток должно быть от 1 до 20" }, { status: 400 });
    }
  }

  let status: "DRAFT" | "PUBLISHED" | undefined;
  if (body.status !== undefined) {
    if (body.status === "PUBLISHED") {
      const count = await prisma.testQuestion.count({ where: { testId } });
      if (count === 0) {
        return NextResponse.json({ error: "Добавьте хотя бы один вопрос, чтобы опубликовать тест" }, { status: 400 });
      }
      status = "PUBLISHED";
    } else {
      status = "DRAFT";
    }
  }

  try {
    const updated = await prisma.test.update({
      where: { id: testId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.category !== undefined ? { category: body.category?.trim() || null } : {}),
        ...(body.accessMode !== undefined
          ? { accessMode: body.accessMode === "RESTRICTED" ? ("RESTRICTED" as const) : ("OPEN" as const) }
          : {}),
        ...(passingScore !== undefined ? { passingScore } : {}),
        ...(maxAttempts !== undefined ? { maxAttempts } : {}),
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