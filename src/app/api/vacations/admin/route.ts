import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamUserIds } from "@/lib/team";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "HR_ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));

  const userFilter =
    session.user.role === "MANAGER" ? { userId: { in: await getTeamUserIds(session.user.id) } } : {};

  const entries = await prisma.vacationEntry.findMany({
    where: { startDate: { lte: yearEnd }, endDate: { gte: yearStart }, ...userFilter },
    include: { user: { select: { id: true, fullName: true, department: true, email: true } } },
    orderBy: [{ user: { fullName: "asc" } }, { startDate: "asc" }],
  });
  return NextResponse.json(entries);
}