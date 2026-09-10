import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const surveys = await prisma.pulseSurvey.findMany({
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { completions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(surveys.map((s) => ({ ...s, completionsCount: s._count.completions })));
}