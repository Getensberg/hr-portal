import { prisma } from "./prisma";

export type TestState = "NOT_STARTED" | "IN_REVIEW" | "PASSED" | "FAILED";
export type BlockReason = "PASSED" | "IN_REVIEW" | "NO_ATTEMPTS" | "NO_QUESTIONS";

export const BLOCK_MESSAGES: Record<BlockReason, string> = {
  PASSED: "Тест уже сдан",
  IN_REVIEW: "Предыдущая попытка ещё на проверке",
  NO_ATTEMPTS: "Попытки закончились",
  NO_QUESTIONS: "В тесте пока нет вопросов",
};

export function deriveTestState(attempts: { status: string; passed: boolean | null }[]): TestState {
  if (attempts.some((a) => a.status === "GRADED" && a.passed)) return "PASSED";
  if (attempts.some((a) => a.status === "IN_REVIEW")) return "IN_REVIEW";
  if (attempts.length > 0) return "FAILED";
  return "NOT_STARTED";
}

export function getBlockReason(
  questionsCount: number,
  maxAttempts: number,
  attempts: { status: string; passed: boolean | null }[]
): BlockReason | null {
  if (questionsCount === 0) return "NO_QUESTIONS";
  const state = deriveTestState(attempts);
  if (state === "PASSED") return "PASSED";
  if (state === "IN_REVIEW") return "IN_REVIEW";
  if (attempts.length >= maxAttempts) return "NO_ATTEMPTS";
  return null;
}

// Курс виден сотруднику, если опубликован и либо открыт всем, либо доступ выдан лично
export function courseAccessWhere(userId: string) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ accessMode: "OPEN" as const }, { access: { some: { userId } } }],
  };
}

export function standaloneTestAccessWhere(userId: string) {
  return {
    courseId: null,
    status: "PUBLISHED" as const,
    OR: [{ accessMode: "OPEN" as const }, { access: { some: { userId } } }],
  };
}

export function isTestAccessible(t: {
  courseId: string | null;
  status: string;
  accessMode: string;
  access: { id: string }[];
  course: { status: string; accessMode: string; access: { id: string }[] } | null;
}): boolean {
  if (t.courseId) {
    const c = t.course;
    return !!c && c.status === "PUBLISHED" && (c.accessMode === "OPEN" || c.access.length > 0);
  }
  return t.status === "PUBLISHED" && (t.accessMode === "OPEN" || t.access.length > 0);
}

export function gradeChoice(selected: string[], correctIds: string[]): boolean {
  const s = new Set(selected);
  const c = new Set(correctIds);
  if (s.size !== c.size) return false;
  for (const id of s) if (!c.has(id)) return false;
  return true;
}

export function computeScore(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export async function loadTestForUser(testId: string, userId: string) {
  return prisma.test.findUnique({
    where: { id: testId },
    include: {
      access: { where: { userId }, select: { id: true } },
      course: {
        select: {
          id: true,
          title: true,
          status: true,
          accessMode: true,
          access: { where: { userId }, select: { id: true } },
        },
      },
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
    },
  });
}