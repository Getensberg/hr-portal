import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  let title: string | undefined;
  if (body.title !== undefined) {
    title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Название не может быть пустым" }, { status: 400 });
    title = title.slice(0, 200);
  }

  const videoUrl = body.videoUrl !== undefined ? String(body.videoUrl).trim() : undefined;
  if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
    return NextResponse.json({ error: "Ссылка на видео должна начинаться с http:// или https://" }, { status: 400 });
  }

  try {
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body.content !== undefined ? { content: String(body.content).trim() } : {}),
        ...(videoUrl !== undefined ? { videoUrl: videoUrl || null } : {}),
        ...(body.files !== undefined ? { files: body.files } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.lesson.delete({ where: { id: lessonId } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ id: lessonId, deleted: true });
}