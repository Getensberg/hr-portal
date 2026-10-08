import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { parseBody } from "@/lib/validate";
import { courseCreateSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lessons: true, access: true, tests: true } } },
  });

  return NextResponse.json(
    courses.map(({ _count, ...course }) => ({
      ...course,
      lessonsCount: _count.lessons,
      testsCount: _count.tests,
      accessCount: _count.access,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = await parseBody(req, courseCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.course.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      accessMode: body.accessMode,
      createdBy: session.user.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
