import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { parseBody } from "@/lib/validate";
import { lessonCreateSchema } from "@/lib/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await parseBody(req, lessonCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const last = await prisma.lesson.findFirst({
    where: { courseId: id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const created = await prisma.lesson.create({
    data: {
      courseId: id,
      title: body.title,
      content: body.content,
      videoUrl: body.videoUrl || null,
      files: body.files,
      order: last ? last.order + 1 : 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
