import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function GET() {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempts = await prisma.testAttempt.findMany({
    where: { status: "IN_REVIEW" },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      submittedAt: true,
      user: { select: { fullName: true, department: true } },
      test: { select: { title: true, course: { select: { title: true } } } },
    },
  });

  return NextResponse.json(
    attempts.map((a) => ({
      id: a.id,
      submittedAt: a.submittedAt,
      userName: a.user.fullName,
      department: a.user.department,
      testTitle: a.test.title,
      courseTitle: a.test.course?.title ?? null,
    }))
  );
}