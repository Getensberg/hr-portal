import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const surveys = await prisma.pulseSurvey.findMany({
    where: {
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: { questions: { orderBy: { order: "asc" } } },
    orderBy: { startDate: "desc" },
  });

  const completions = await prisma.surveyCompletion.findMany({
    where: { userId: session.user.id, surveyId: { in: surveys.map((s) => s.id) } },
  });
  const completedIds = new Set(completions.map((c) => c.surveyId));

  return NextResponse.json(surveys.map((s) => ({ ...s, completed: completedIds.has(s.id) })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const created = await prisma.pulseSurvey.create({
    data: {
      title: body.title,
      frequency: body.frequency,
      isAnonymous: body.isAnonymous ?? true,
      isSuggestionBox: body.isSuggestionBox ?? false,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      createdBy: session.user.id,
      questions: {
        create: body.questions.map((q: any, i: number) => ({ text: q.text, type: q.type, order: i })),
      },
    },
    include: { questions: true },
  });
  return NextResponse.json(created, { status: 201 });
}