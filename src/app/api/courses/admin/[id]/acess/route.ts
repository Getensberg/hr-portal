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
  const ids = new Set<string>(
    Array.isArray(body.userIds) ? body.userIds.filter((x: unknown): x is string => typeof x === "string") : []
  );

  if (body.department) {
    const deptUsers = await prisma.user.findMany({
      where: { department: String(body.department) },
      select: { id: true },
    });
    deptUsers.forEach((u) => ids.add(u.id));
  }
  if (ids.size === 0) return NextResponse.json({ error: "Никого не выбрано" }, { status: 400 });

  const valid = await prisma.user.findMany({ where: { id: { in: Array.from(ids) } }, select: { id: true } });
  const result = await prisma.courseAccess.createMany({
    data: valid.map((u) => ({ courseId: id, userId: u.id })),
    skipDuplicates: true,
  });
  return NextResponse.json({ granted: result.count }, { status: 201 });
}