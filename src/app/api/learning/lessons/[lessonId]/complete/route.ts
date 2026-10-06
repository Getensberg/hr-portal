import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseAccessWhere } from "@/lib/learning";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, course: courseAccessWhere(userId) },
    select: { id: true },
  });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.done === false) {
    await prisma.lessonProgress.deleteMany({ where: { lessonId, userId } });
  } else {
    await prisma.lessonProgress.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      update: {},
      create: { lessonId, userId },
    });
  }
  return NextResponse.json({ lessonId, done: body.done !== false });
}