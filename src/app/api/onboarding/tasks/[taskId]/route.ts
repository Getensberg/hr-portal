import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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