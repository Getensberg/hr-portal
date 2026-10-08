import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const question = await prisma.testQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, kind: true, testId: true },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attempts = await prisma.testAttempt.count({ where: { testId: question.testId } });
  if (attempts > 0) {
    return NextResponse.json(
      { error: "Вопросы нельзя менять: по тесту уже есть попытки" },
      { status: 409 }
    );
  }

  const body = await req.json();
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Введите текст вопроса" }, { status: 400 });

  let options: { text: string; isCorrect: boolean }[] = [];
  if (question.kind === "CHOICE") {
    const raw: any[] = Array.isArray(body.options) ? body.options : [];
    options = raw
      .map((o) => ({ text: String(o?.text ?? "").trim(), isCorrect: Boolean(o?.isCorrect) }))
      .filter((o) => o.text);
    if (options.length < 2) {
      return NextResponse.json({ error: "Нужно минимум два варианта ответа" }, { status: 400 });
    }
    if (!options.some((o) => o.isCorrect)) {
      return NextResponse.json({ error: "Отметьте хотя бы один верный вариант" }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.testQuestion.update({ where: { id: questionId }, data: { text } });
    if (question.kind === "CHOICE") {
      await tx.testOption.deleteMany({ where: { questionId } });
      await tx.testOption.createMany({
        data: options.map((o, i) => ({ questionId, text: o.text, isCorrect: o.isCorrect, order: i })),
      });
    }
  });

  return NextResponse.json({ id: questionId, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const question = await prisma.testQuestion.findUnique({
    where: { id: questionId },
    select: { test: { select: { _count: { select: { attempts: true } } } } },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (question.test._count.attempts > 0) {
    return NextResponse.json({ error: "У теста уже есть попытки прохождения, вопросы менять нельзя" }, { status: 409 });
  }

  await prisma.testQuestion.delete({ where: { id: questionId } });
  return NextResponse.json({ id: questionId, deleted: true });
}