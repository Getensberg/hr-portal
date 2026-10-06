import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadTestForUser, isTestAccessible, deriveTestState, getBlockReason } from "@/lib/learning";

export async function GET(
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

  const attempts = await prisma.testAttempt.findMany({
    where: { testId, userId },
    orderBy: { submittedAt: "desc" },
    select: { id: true, status: true, passed: true, submittedAt: true },
  });

  const blockReason = getBlockReason(test.questions.length, test.maxAttempts, attempts);
  const canTake = blockReason === null;

  return NextResponse.json({
    id: test.id,
    title: test.title,
    description: test.description,
    courseId: test.course?.id ?? null,
    courseTitle: test.course?.title ?? null,
    passingScore: test.passingScore,
    maxAttempts: test.maxAttempts,
    attemptsUsed: attempts.length,
    state: deriveTestState(attempts),
    canTake,
    blockReason,
    questions: canTake
      ? test.questions.map((q) => ({
          id: q.id,
          text: q.text,
          kind: q.kind,
          multiple: q.options.filter((o) => o.isCorrect).length > 1,
          options: q.options.map((o) => ({ id: o.id, text: o.text })),
        }))
      : [],
    attempts,
  });
}