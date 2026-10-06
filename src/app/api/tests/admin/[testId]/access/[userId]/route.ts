import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHRSession } from "@/lib/guards";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string; userId: string }> }
) {
  const { testId, userId } = await params;
  const session = await getHRSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.testAccess.deleteMany({ where: { testId, userId } });
  return NextResponse.json({ userId, deleted: true });
}