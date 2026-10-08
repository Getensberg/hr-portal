import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  loadTestForUser,
  isTestAccessible,
  getBlockReason,
  gradeChoice,
  computeScore,
  BLOCK_MESSAGES,
} from "@/lib/learning";
import { parseBody } from "@/lib/validate";
import { attemptSchema } from "@/lib/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const test = await loadTestForUser(testId, userId);
  if (!test || !isTestAccessible(test)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const previous = await prisma.testAttempt.findMany({
    where: { testId, userId },
    select: { status: true, passed: true },
  });
  const block = getBlockReason(test.questions.length, test.maxAttempts, previous);
  if (block) return NextResponse.json({ error: BLOCK_MESSAGES[block] }, { status: 409 });

  const parsed = await parseBody(req, attemptSchema);
  if (!parsed.ok) return parsed.response;
  const byQuestion = new Map(parsed.data.answers.map((a) => [a.questionId, a]));

  const rows: { questionId: string; selectedOptionIds?: string[]; textAnswer?: string; isCorrect: boolean | null }[] = [];
  let correctCount = 0;
  let hasOpen = false;

  for (const q of test.questions) {
    const a = byQuestion.get(q.id);

    if (q.kind === "CHOICE") {
      const validIds = new Set(q.options.map((o) => o.id));
      const selected: string[] = Array.isArray(a?.selectedOptionIds)
        ? a.selectedOptionIds.filter((id: unknown): id is string => typeof id === "string" && validIds.has(id))
        : [];
      if (selected.length === 0) {
        return NextResponse.json({ error: "Ответьте на все вопросы" }, { status: 400 });
      }
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const ok = gradeChoice(selected, correctIds);
      if (ok) correctCount++;
      rows.push({ questionId: q.id, selectedOptionIds: selected, isCorrect: ok });
    } else {
      hasOpen = true;
      const text = String(a?.textAnswer ?? "").trim();
      if (!text) return NextResponse.json({ error: "Ответьте на все вопросы" }, { status: 400 });
      rows.push({ questionId: q.id, textAnswer: text.slice(0, 5000), isCorrect: null });
    }
  }

  const score = computeScore(correctCount, test.questions.length);
  const passed = score >= test.passingScore;

  const created = await prisma.testAttempt.create({
    data: {
      testId,
      userId,
      status: hasOpen ? "IN_REVIEW" : "GRADED",
      ...(hasOpen ? {} : { score, passed }),
      answers: { create: rows },
    },
    select: { id: true, status: true, passed: true },
  });

  return NextResponse.json(created, { status: 201 });
}