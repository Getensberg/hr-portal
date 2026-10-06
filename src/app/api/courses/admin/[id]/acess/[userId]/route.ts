import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.courseAccess.deleteMany({ where: { courseId: id, userId } });
  return NextResponse.json({ userId, deleted: true });
}