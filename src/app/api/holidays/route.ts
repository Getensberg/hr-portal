import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/vacation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const holidays = await prisma.companyHoliday.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(holidays);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 400) {
    return NextResponse.json({ error: "Нужно от 1 до 400 дат за раз" }, { status: 400 });
  }

  const data: { date: Date; name: string }[] = [];
  for (const item of rawItems) {
    const date = typeof item.date === "string" ? parseISODate(item.date) : null;
    if (!date) {
      return NextResponse.json({ error: "Некорректная дата в списке" }, { status: 400 });
    }
    data.push({ date, name: String(item.name || "Нерабочий день").trim().slice(0, 200) });
  }

  const result = await prisma.companyHoliday.createMany({ data, skipDuplicates: true });
  return NextResponse.json({ created: result.count }, { status: 201 });
}