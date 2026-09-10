import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const survey = await prisma.pulseSurvey.findUnique({ where: { id } });
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const already = await prisma.surveyCompletion.findUnique({
    where: { surveyId_userId: { surveyId: id, userId: session.user.id } },
  });
  if (already) return NextResponse.json({ error: "Уже пройден" }, { status: 409 });

  const body = await req.json();

  await prisma.$transaction(async (tx) => {
    const response = await tx.surveyResponse.create({
      data: { surveyId: id, userId: survey.isAnonymous ? null : session.user.id },
    });

    await tx.surveyAnswer.createMany({
      data: body.answers.map((a: { questionId: string; value: string }) => ({
        responseId: response.id,
        questionId: a.questionId,
        value: a.value,
      })),
    });

    await tx.surveyCompletion.create({ data: { surveyId: id, userId: session.user.id } });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}