import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseAccessWhere, standaloneTestAccessWhere, deriveTestState } from "@/lib/learning";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const [courses, tests, progress, attempts] = await Promise.all([
    prisma.course.findMany({
      where: courseAccessWhere(userId),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        lessons: { select: { id: true } },
        tests: { select: { id: true, _count: { select: { questions: true } } } },
      },
    }),
    prisma.test.findMany({
      where: standaloneTestAccessWhere(userId),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        maxAttempts: true,
        _count: { select: { questions: true } },
      },
    }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true } }),
    prisma.testAttempt.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        testId: true,
        status: true,
        passed: true,
        submittedAt: true,
        test: { select: { title: true, courseId: true, course: { select: { title: true } } } },
      },
    }),
  ]);

  const doneLessons = new Set(progress.map((p) => p.lessonId));
  const attemptsByTest = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const list = attemptsByTest.get(a.testId) ?? [];
    list.push(a);
    attemptsByTest.set(a.testId, list);
  }

  const courseCards = courses.map((c) => {
    const playableTests = c.tests.filter((t) => t._count.questions > 0);
    const lessonsDone = c.lessons.filter((l) => doneLessons.has(l.id)).length;
    const testsPassed = playableTests.filter(
      (t) => deriveTestState(attemptsByTest.get(t.id) ?? []) === "PASSED"
    ).length;
    const anyActivity =
      lessonsDone > 0 || playableTests.some((t) => (attemptsByTest.get(t.id)?.length ?? 0) > 0);
    const total = c.lessons.length + playableTests.length;
    const completed =
      total > 0 && lessonsDone === c.lessons.length && testsPassed === playableTests.length;

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      lessonsTotal: c.lessons.length,
      lessonsDone,
      testsTotal: playableTests.length,
      testsPassed,
      state: completed ? "COMPLETED" : anyActivity ? "IN_PROGRESS" : "NOT_STARTED",
    };
  });

  const testCards = tests
    .filter((t) => t._count.questions > 0)
    .map((t) => {
      const list = attemptsByTest.get(t.id) ?? [];
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        questionsCount: t._count.questions,
        maxAttempts: t.maxAttempts,
        attemptsUsed: list.length,
        state: deriveTestState(list),
      };
    });

  return NextResponse.json({
    courses: courseCards,
    tests: testCards,
    attempts: attempts.map((a) => ({
      id: a.id,
      testId: a.testId,
      testTitle: a.test.title,
      courseId: a.test.courseId,
      courseTitle: a.test.course?.title ?? null,
      status: a.status,
      passed: a.passed,
      submittedAt: a.submittedAt,
    })),
  });
}