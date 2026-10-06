import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseAccessWhere, deriveTestState } from "@/lib/learning";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const course = await prisma.course.findFirst({
    where: { id, ...courseAccessWhere(userId) },
    include: {
      lessons: { orderBy: { order: "asc" } },
      tests: { orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const playableTests = course.tests.filter((t) => t._count.questions > 0);

  const [progress, attempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: course.lessons.map((l) => l.id) } },
      select: { lessonId: true },
    }),
    prisma.testAttempt.findMany({
      where: { userId, testId: { in: playableTests.map((t) => t.id) } },
      select: { testId: true, status: true, passed: true },
    }),
  ]);

  const doneLessons = new Set(progress.map((p) => p.lessonId));

  const tests = playableTests.map((t) => {
    const list = attempts.filter((a) => a.testId === t.id);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      questionsCount: t._count.questions,
      maxAttempts: t.maxAttempts,
      attemptsUsed: list.length,
      state: deriveTestState(list),
    };
  });

  const lessons = course.lessons.map((l) => ({
    id: l.id,
    title: l.title,
    content: l.content,
    videoUrl: l.videoUrl,
    files: l.files,
    done: doneLessons.has(l.id),
  }));

  const total = lessons.length + tests.length;
  const completed =
    total > 0 && lessons.every((l) => l.done) && tests.every((t) => t.state === "PASSED");

  return NextResponse.json({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    lessons,
    tests,
    completed,
  });
}