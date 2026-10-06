import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { computeScore } from "@/lib/learning";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { fullName: true, department: true } },
      test: { select: { title: true, course: { select: { title: true } } } },
      answers: { include: { question: { include: { options: { orderBy: { order: "asc" } } } } } },
    },
  });
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const answers = [...attempt.answers]
    .sort((a, b) => a.question.order - b.question.order)
    .map((a) => {
      const selectedIds: string[] = Array.isArray(a.selectedOptionIds) ? (a.selectedOptionIds as string[]) : [];
      return {
        id: a.id,
        text: a.question.text,
        kind: a.question.kind,
        selectedTexts: a.question.options.filter((o) => selectedIds.includes(o.id)).map((o) => o.text),
        correctTexts: a.question.options.filter((o) => o.isCorrect).map((o) => o.text),
        isCorrect: a.isCorrect,
        textAnswer: a.textAnswer,
      };
    });

  return NextResponse.json({
    id: attempt.id,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    user: attempt.user,
    test: { title: attempt.test.title, courseTitle: attempt.test.course?.title ?? null },
    answers,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    select: {
      status: true,
      test: { select: { passingScore: true } },
      answers: { select: { id: true, isCorrect: true, question: { select: { kind: true } } } },
    },
  });
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attempt.status !== "IN_REVIEW") {
    return NextResponse.json({ error: "Эта попытка уже проверена" }, { status: 409 });
  }

  const body = await req.json();
  const verdicts: Record<string, unknown> =
    body.verdicts && typeof body.verdicts === "object" ? body.verdicts : {};

  let correct = 0;
  const updates = [];
  for (const a of attempt.answers) {
    if (a.question.kind === "OPEN") {
      const v = verdicts[a.id];
      if (typeof v !== "boolean") {
        return NextResponse.json({ error: "Оцените все свободные ответы" }, { status: 400 });
      }
      if (v) correct++;
      updates.push(prisma.testAnswer.update({ where: { id: a.id }, data: { isCorrect: v } }));
    } else if (a.isCorrect) {
      correct++;
    }
  }

  const score = computeScore(correct, attempt.answers.length);
  const passed = score >= attempt.test.passingScore;

  await prisma.$transaction([
    ...updates,
    prisma.testAttempt.update({ where: { id: attemptId }, data: { status: "GRADED", score, passed } }),
  ]);

  return NextResponse.json({ passed, score });
}