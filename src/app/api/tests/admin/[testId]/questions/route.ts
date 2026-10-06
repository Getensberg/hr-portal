import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { id: true, _count: { select: { attempts: true } } },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (test._count.attempts > 0) {
    return NextResponse.json({ error: "У теста уже есть попытки прохождения, вопросы менять нельзя" }, { status: 409 });
  }

  const body = await req.json();
  const text = String(body.text || "").trim();
  const kind: "CHOICE" | "OPEN" = body.kind === "OPEN" ? "OPEN" : "CHOICE";
  if (!text) return NextResponse.json({ error: "Введите текст вопроса" }, { status: 400 });

  const options = (Array.isArray(body.options) ? body.options : [])
    .map((o: any) => ({ text: String(o.text || "").trim(), isCorrect: Boolean(o.isCorrect) }))
    .filter((o: { text: string }) => o.text);

  if (kind === "CHOICE") {
    if (options.length < 2) {
      return NextResponse.json({ error: "Нужно минимум два варианта ответа" }, { status: 400 });
    }
    if (options.length > 10) {
      return NextResponse.json({ error: "Не больше десяти вариантов ответа" }, { status: 400 });
    }
    if (!options.some((o: { isCorrect: boolean }) => o.isCorrect)) {
      return NextResponse.json({ error: "Отметьте хотя бы один правильный ответ" }, { status: 400 });
    }
  }

  const last = await prisma.testQuestion.findFirst({
    where: { testId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const created = await prisma.testQuestion.create({
    data: {
      testId,
      text,
      kind,
      order: last ? last.order + 1 : 0,
      ...(kind === "CHOICE"
        ? {
            options: {
              create: options.map((o: { text: string; isCorrect: boolean }, i: number) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                order: i,
              })),
            },
          }
        : {}),
    },
    include: { options: true },
  });
  return NextResponse.json(created, { status: 201 });
}