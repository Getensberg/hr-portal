import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";
import { parseBody } from "@/lib/validate";
import { accessGrantSchema } from "@/lib/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const test = await prisma.test.findUnique({ where: { id: testId }, select: { id: true } });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await parseBody(req, accessGrantSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const ids = new Set<string>(body.userIds);

  if (body.department) {
    const deptUsers = await prisma.user.findMany({
      where: { department: body.department },
      select: { id: true },
    });
    deptUsers.forEach((u) => ids.add(u.id));
  }
  if (ids.size === 0) return NextResponse.json({ error: "Никого не выбрано" }, { status: 400 });

  const valid = await prisma.user.findMany({ where: { id: { in: Array.from(ids) } }, select: { id: true } });
  const result = await prisma.testAccess.createMany({
    data: valid.map((u) => ({ testId, userId: u.id })),
    skipDuplicates: true,
  });
  return NextResponse.json({ granted: result.count }, { status: 201 });
}
