import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await prisma.onboardingPlan.findUnique({
    where: { newcomerId: session.user.id },
    include: {
      mentor: { select: { fullName: true, email: true } },
      tasks: { orderBy: { order: "asc" } },
    },
  });

  if (!plan) return NextResponse.json({ plan: null, tasks: [] });

  const progress = await prisma.onboardingTaskProgress.findMany({
    where: { userId: session.user.id, taskId: { in: plan.tasks.map((t) => t.id) } },
  });
  const doneIds = new Set(progress.filter((p) => p.isDone).map((p) => p.taskId));

  return NextResponse.json({
    plan: { id: plan.id, mentor: plan.mentor, startDate: plan.startDate, endDate: plan.endDate },
    tasks: plan.tasks.map((t) => ({ ...t, done: doneIds.has(t.id) })),
  });
}