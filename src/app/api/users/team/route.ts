import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamUserIds } from "@/lib/team";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teamIds = await getTeamUserIds(session.user.id);
  if (teamIds.length === 0) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: { id: { in: teamIds } },
    select: { id: true, fullName: true, email: true, department: true, position: true },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json(users);
}