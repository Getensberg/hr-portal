import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plans = await prisma.onboardingPlan.findMany({
    include: {
      newcomer: { select: { id: true, fullName: true, email: true } },
      mentor: { select: { id: true, fullName: true, email: true } },
      tasks: { orderBy: { order: "asc" } },
    },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(plans);
}