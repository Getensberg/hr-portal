import { prisma } from "./prisma";
import { deriveTestState } from "./learning";

export type ProgressState = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "IN_REVIEW" | "FAILED";

export interface ProgressItem {
  kind: "course" | "test";
  id: string;
  title: string;
  courseTitle: string | null; // для теста внутри курса
  state: ProgressState;
  percent: number | null; // только для курсов
  restricted: boolean;
}

function testProgressState(state: string): ProgressState {
  if (state === "PASSED") return "DONE";
  if (state === "IN_REVIEW") return "IN_REVIEW";
  if (state === "FAILED") return "FAILED";
  return "NOT_STARTED";
}

// Для каждого пользователя: курсы и тесты, которые он видит, и его статус по каждому
export async function buildUserProgress(userIds: string[]): Promise<Record<string, ProgressItem[]>> {
  if (userIds.length === 0) return {};

  const [courses, standalone, lessonProgress, attempts] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        accessMode: true,
        access: { select: { userId: true } },
        lessons: { select: { id: true } },
        tests: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, _count: { select: { questions: true } } },
        },
      },
    }),
    prisma.test.findMany({
      where: { courseId: null, status: "PUBLISHED", questions: { some: {} } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, accessMode: true, access: { select: { userId: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, lessonId: true },
    }),
    prisma.testAttempt.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, testId: true, status: true, passed: true },
    }),
  ]);

  const doneByUser = new Map<string, Set<string>>();
  for (const p of lessonProgress) {
    const set = doneByUser.get(p.userId) ?? new Set<string>();
    set.add(p.lessonId);
    doneByUser.set(p.userId, set);
  }

  const attemptsByKey = new Map<string, { status: string; passed: boolean | null }[]>();
  for (const a of attempts) {
    const key = `${a.userId}:${a.testId}`;
    const list = attemptsByKey.get(key) ?? [];
    list.push({ status: a.status, passed: a.passed });
    attemptsByKey.set(key, list);
  }

  const result: Record<string, ProgressItem[]> = {};

  for (const userId of userIds) {
    const done = doneByUser.get(userId) ?? new Set<string>();
    const items: ProgressItem[] = [];

    for (const c of courses) {
      const restricted = c.accessMode !== "OPEN";
      if (restricted && !c.access.some((a) => a.userId === userId)) continue;

      const playable = c.tests.filter((t) => t._count.questions > 0);
      const lessonsDone = c.lessons.filter((l) => done.has(l.id)).length;

      const testItems: ProgressItem[] = [];
      let testsPassed = 0;
      let anyAttempt = false;
      for (const t of playable) {
        const list = attemptsByKey.get(`${userId}:${t.id}`) ?? [];
        const state = deriveTestState(list);
        if (state === "PASSED") testsPassed++;
        if (list.length > 0) anyAttempt = true;
        testItems.push({
          kind: "test",
          id: t.id,
          title: t.title,
          courseTitle: c.title,
          state: testProgressState(state),
          percent: null,
          restricted,
        });
      }

      const total = c.lessons.length + playable.length;
      const completed = total > 0 && lessonsDone === c.lessons.length && testsPassed === playable.length;
      const state: ProgressState = completed
        ? "DONE"
        : lessonsDone > 0 || anyAttempt
          ? "IN_PROGRESS"
          : "NOT_STARTED";

      items.push({
        kind: "course",
        id: c.id,
        title: c.title,
        courseTitle: null,
        state,
        percent: total > 0 ? Math.round(((lessonsDone + testsPassed) / total) * 100) : 0,
        restricted,
      });
      items.push(...testItems);
    }

    for (const t of standalone) {
      const restricted = t.accessMode !== "OPEN";
      if (restricted && !t.access.some((a) => a.userId === userId)) continue;
      const list = attemptsByKey.get(`${userId}:${t.id}`) ?? [];
      items.push({
        kind: "test",
        id: t.id,
        title: t.title,
        courseTitle: null,
        state: testProgressState(deriveTestState(list)),
        percent: null,
        restricted,
      });
    }

    result[userId] = items;
  }

  return result;
}