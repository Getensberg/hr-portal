import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const question = await prisma.testQuestion.findUnique({
    where: { id: questionId },
    select: { test: { select: { _count: { select: { attempts: true } } } } },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (question.test._count.attempts > 0) {
    return NextResponse.json({ error: "У теста уже есть попытки прохождения, вопросы менять нельзя" }, { status: 409 });
  }

  await prisma.testQuestion.delete({ where: { id: questionId } });
  return NextResponse.json({ id: questionId, deleted: true });
}