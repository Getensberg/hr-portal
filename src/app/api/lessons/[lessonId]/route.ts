import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { parseBody } from "@/lib/validate";
import { lessonUpdateSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = await parseBody(req, lessonUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: body.title,
        content: body.content,
        videoUrl: body.videoUrl,
        files: body.files,
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
