import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const survey = await prisma.pulseSurvey.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId: id },
    include: { answers: true },
  });
  const completionsCount = await prisma.surveyCompletion.count({ where: { surveyId: id } });

  const questions = survey.questions.map((q) => {
    const values = responses.flatMap((r) => r.answers.filter((a) => a.questionId === q.id).map((a) => a.value));

    if (q.type === "SCALE_1_5") {
      const nums = values.map(Number).filter((n) => !isNaN(n));
      const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      return { id: q.id, text: q.text, type: q.type, average };
    }
    if (q.type === "YES_NO") {
      const counts: Record<string, number> = {};
      values.forEach((v) => { counts[v] = (counts[v] ?? 0) + 1; });
      return { id: q.id, text: q.text, type: q.type, counts };
    }
    return { id: q.id, text: q.text, type: q.type, texts: values };
  });

  return NextResponse.json({
    survey: { id: survey.id, title: survey.title, isAnonymous: survey.isAnonymous },
    completionsCount,
    questions,
  });
}

// пока результат считаем из ответов на лету, нигде не храним не кешируем, потом надо будет переделать