import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTeamUserIds } from "@/lib/team";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "HR_ADMIN") {
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const teamIds = await getTeamUserIds(session.user.id);
    const target = await prisma.request.findUnique({ where: { id }, select: { userId: true } });
    if (!target || !teamIds.includes(target.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const updated = await prisma.request.update({
    where: { id },
    data: {
      status: body.status,
      completedAt: body.status === "DONE" ? new Date() : null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "HR_ADMIN") {
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const teamIds = await getTeamUserIds(session.user.id);
    const target = await prisma.request.findUnique({ where: { id }, select: { userId: true } });
    if (!target || !teamIds.includes(target.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.request.delete({ where: { id } });
  return NextResponse.json({ id, deleted: true });
}