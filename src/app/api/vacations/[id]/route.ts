import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.vacationEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (entry.status === "CONFIRMED") {
    return NextResponse.json({ error: "Запись подтверждена HR, изменить её может только HR" }, { status: 403 });
  }

  await prisma.vacationEntry.delete({ where: { id } });
  return NextResponse.json({ id, deleted: true });
}