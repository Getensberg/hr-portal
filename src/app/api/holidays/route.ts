import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/vacation";
import { parseBody } from "@/lib/validate";
import { holidaysSchema } from "@/lib/schemas";
import { expandHolidayPeriods, daysToPeriods } from "@/lib/holidays";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Для остального кода отдаём праздники по дням (id у дней одного периода общий)
  const periods = await prisma.companyHoliday.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json(expandHolidayPeriods(periods));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, holidaysSchema);
  if (!parsed.ok) return parsed.response;

  // Схема уже проверила, что каждая дата реальна
  const data = parsed.data.items.map((item) => ({
    date: parseISODate(item.date)!,
    name: item.name,
  }));

  // Дни, которые уже отмечены, пропускаем; остальные склеиваем в периоды
  const existing = expandHolidayPeriods(await prisma.companyHoliday.findMany());
  const taken = new Set(existing.map((h) => h.date.toISOString().slice(0, 10)));
  const unique = new Map<string, { date: Date; name: string }>();
  for (const d of data) {
    const key = d.date.toISOString().slice(0, 10);
    if (!taken.has(key)) unique.set(key, d);
  }

  const periods = daysToPeriods(Array.from(unique.values()));
  if (periods.length > 0) await prisma.companyHoliday.createMany({ data: periods });
  return NextResponse.json({ created: unique.size }, { status: 201 });
}
