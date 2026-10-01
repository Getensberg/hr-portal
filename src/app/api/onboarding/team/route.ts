import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamUserIds } from "@/lib/team";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teamIds = await getTeamUserIds(session.user.id);
  if (teamIds.length === 0) return NextResponse.json([]);

  const plans = await prisma.onboardingPlan.findMany({
    where: { newcomerId: { in: teamIds } },
    include: {
      newcomer: { select: { id: true, fullName: true, email: true } },
      mentor: { select: { id: true, fullName: true, email: true } },
      tasks: { orderBy: { order: "asc" } },
    },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(plans);
}