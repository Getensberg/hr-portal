import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamUserIds } from "@/lib/team";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "HR_ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (session.user.role === "MANAGER") {
    const teamIds = await getTeamUserIds(session.user.id);
    if (!teamIds.includes(body.newcomerId)) {
      return NextResponse.json({ error: "Этот сотрудник не в твоей команде" }, { status: 403 });
    }
  }

  const existingPlan = await prisma.onboardingPlan.findUnique({ where: { newcomerId: body.newcomerId } });
    if (existingPlan) {
  return NextResponse.json({ error: "У этого сотрудника уже есть план онбординга" }, { status: 409 });
}

  const created = await prisma.onboardingPlan.create({
    data: {
      newcomerId: body.newcomerId,
      mentorId: body.mentorId || null,
      startDate: body.startDate ? new Date(body.startDate + "T00:00:00") : new Date(),
      endDate: body.endDate ? new Date(body.endDate + "T00:00:00") : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}