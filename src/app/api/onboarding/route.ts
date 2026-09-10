import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
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