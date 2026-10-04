import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamUserIds } from "@/lib/team";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "HR_ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role === "MANAGER") {
    const plan = await prisma.onboardingPlan.findUnique({ where: { id: planId }, select: { newcomerId: true } });
    const teamIds = await getTeamUserIds(session.user.id);
    if (!plan || !teamIds.includes(plan.newcomerId)) {
      return NextResponse.json({ error: "Этот план не из твоей команды" }, { status: 403 });
    }
  }

  const body = await req.json();
 const last = await prisma.onboardingTask.findFirst({
  where: { planId },
  orderBy: { order: "desc" },
  select: { order: true },
});
const nextOrder = last ? last.order + 1 : 0;

  const created = await prisma.onboardingTask.create({
    data: {
      planId,
      title: body.title,
      description: body.description || null,
      dueDate: body.dueDate ? new Date(body.dueDate + "T00:00:00") : null,
      order: nextOrder,
    },
  });
  return NextResponse.json(created, { status: 201 });
}