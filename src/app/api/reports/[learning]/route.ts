import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { buildUserProgress } from "@/lib/learningReport";

export async function GET() {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: { not: "HR_ADMIN" } },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, department: true, position: true },
  });
  const progress = await buildUserProgress(users.map((u) => u.id));
  const employees = users.map((u) => ({ ...u, items: progress[u.id] ?? [] }));

  // Курсы: сводка из статусов сотрудников
  const courseRows = new Map<
    string,
    {
      id: string;
      title: string;
      restricted: boolean;
      audience: number;
      notStarted: number;
      inProgress: number;
      done: number;
      notStartedNames: string[];
    }
  >();
  for (const e of employees) {
    for (const i of e.items) {
      if (i.kind !== "course") continue;
      const row = courseRows.get(i.id) ?? {
        id: i.id,
        title: i.title,
        restricted: i.restricted,
        audience: 0,
        notStarted: 0,
        inProgress: 0,
        done: 0,
        notStartedNames: [] as string[],
      };
      row.audience++;
      if (i.state === "DONE") row.done++;
      else if (i.state === "IN_PROGRESS") row.inProgress++;
      else {
        row.notStarted++;
        row.notStartedNames.push(e.fullName);
      }
      courseRows.set(i.id, row);
    }
  }

  // Тесты: попытки всех сотрудников (кроме HR)
  const [tests, attempts] = await Promise.all([
    prisma.test.findMany({
      where: {
        questions: { some: {} },
        OR: [{ courseId: null, status: "PUBLISHED" }, { course: { status: "PUBLISHED" } }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, passingScore: true, course: { select: { title: true } } },
    }),
    prisma.testAttempt.findMany({
      where: { user: { role: { not: "HR_ADMIN" } } },
      select: { testId: true, userId: true, status: true, passed: true, score: true },
    }),
  ]);

  const attemptsByTest = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const list = attemptsByTest.get(a.testId) ?? [];
    list.push(a);
    attemptsByTest.set(a.testId, list);
  }

  const testRows = tests.map((t) => {
    const list = attemptsByTest.get(t.id) ?? [];
    const people = new Set(list.map((a) => a.userId));
    const passedPeople = new Set(list.filter((a) => a.status === "GRADED" && a.passed).map((a) => a.userId));
    const scores = list.filter((a) => a.status === "GRADED" && a.score !== null).map((a) => a.score as number);
    return {
      id: t.id,
      title: t.title,
      courseTitle: t.course?.title ?? null,
      passingScore: t.passingScore,
      attempts: list.length,
      people: people.size,
      passedPeople: passedPeople.size,
      inReview: list.filter((a) => a.status === "IN_REVIEW").length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null,
    };
  });

  return NextResponse.json({
    employees,
    courses: Array.from(courseRows.values()),
    tests: testRows,
  });
}