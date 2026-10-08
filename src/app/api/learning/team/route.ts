import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamUserIds } from "@/lib/team";
import { buildUserProgress } from "@/lib/learningReport";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teamIds = await getTeamUserIds(session.user.id);
  const users = await prisma.user.findMany({
    where: { id: { in: teamIds } },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, department: true, position: true },
  });
  const progress = await buildUserProgress(users.map((u) => u.id));

  return NextResponse.json({
    employees: users.map((u) => ({ ...u, items: progress[u.id] ?? [] })),
  });
}