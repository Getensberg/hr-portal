import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTeamUserIds } from "@/lib/team";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const updated = await prisma.onboardingTaskProgress.upsert({
    where: { taskId_userId: { taskId, userId: session.user.id } },
    update: { isDone: body.done, completedAt: body.done ? new Date() : null },
    create: { taskId, userId: session.user.id, isDone: body.done, completedAt: body.done ? new Date() : null },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "HR_ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = await prisma.onboardingTask.findUnique({
    where: { id: taskId },
    select: { plan: { select: { newcomerId: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "MANAGER") {
    const teamIds = await getTeamUserIds(session.user.id);
    if (!teamIds.includes(task.plan.newcomerId)) {
      return NextResponse.json({ error: "Эта задача не из твоей команды" }, { status: 403 });
    }
  }

  await prisma.onboardingTask.delete({ where: { id: taskId } });
  return NextResponse.json({ id: taskId, deleted: true });
}