import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const videoUrl = String(body.videoUrl || "").trim();
  const files = Array.isArray(body.files) ? body.files : undefined;

  if (!title) return NextResponse.json({ error: "Укажите название урока" }, { status: 400 });
  if (!content && !videoUrl && !(files && files.length > 0)) {
    return NextResponse.json({ error: "Добавьте текст, ссылку на видео или файл" }, { status: 400 });
  }
  if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
    return NextResponse.json({ error: "Ссылка на видео должна начинаться с http:// или https://" }, { status: 400 });
  }

  const last = await prisma.lesson.findFirst({
    where: { courseId: id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const created = await prisma.lesson.create({
    data: {
      courseId: id,
      title: title.slice(0, 200),
      content,
      videoUrl: videoUrl || null,
      files,
      order: last ? last.order + 1 : 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}