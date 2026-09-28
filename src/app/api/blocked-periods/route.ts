import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/vacation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periods = await prisma.blockedPeriod.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json(periods);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const start = typeof body.startDate === "string" ? parseISODate(body.startDate) : null;
  const end = typeof body.endDate === "string" ? parseISODate(body.endDate) : null;
  const reason = String(body.reason || "").trim();

  if (!start || !end) return NextResponse.json({ error: "Некорректные даты" }, { status: 400 });
  if (start.getTime() > end.getTime()) {
    return NextResponse.json({ error: "Дата начала позже даты окончания" }, { status: 400 });
  }
  if (!reason) return NextResponse.json({ error: "Укажите причину" }, { status: 400 });

  const created = await prisma.blockedPeriod.create({
    data: { startDate: start, endDate: end, reason: reason.slice(0, 200) },
  });
  return NextResponse.json(created, { status: 201 });
}