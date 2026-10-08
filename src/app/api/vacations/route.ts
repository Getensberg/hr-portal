import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VACATION_LIMITS, parseISODate, rangesOverlap, daysInYearExcludingHolidays } from "@/lib/vacation";
import { parseBody } from "@/lib/validate";
import { vacationCreateSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.vacationEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, vacationCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const type = body.type;
  // Схема уже проверила формат и реальность дат, здесь только превращаем их в Date
  const start = parseISODate(body.startDate)!;
  const end = parseISODate(body.endDate)!;

  const [existing, holidays] = await Promise.all([
    prisma.vacationEntry.findMany({ where: { userId: session.user.id } }),
    prisma.companyHoliday.findMany(),
  ]);
  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));

  // Пересечение с любым уже внесённым периодом (отпуск и отгул нельзя брать в один день)
  const clash = existing.find((e) => rangesOverlap(start, end, e.startDate, e.endDate));
  if (clash) {
    return NextResponse.json({ error: "Эти даты пересекаются с уже внесённым периодом" }, { status: 409 });
  }

  // Лимит проверяем отдельно по каждому году, которого касается период. Праздники внутри
  // периода в счёт не идут — так же, как считаются календарные дни отпуска по ТК РФ.
  const limit = VACATION_LIMITS[type];
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
    const newDays = daysInYearExcludingHolidays(start, end, year, holidaySet);
    const used = existing
      .filter((e) => e.type === type)
      .reduce((sum, e) => sum + daysInYearExcludingHolidays(e.startDate, e.endDate, year, holidaySet), 0);

    if (used + newDays > limit) {
      return NextResponse.json(
        {
          error: `Превышен лимит на ${year} год: осталось ${Math.max(limit - used, 0)} дн. (праздники внутри периода не считаются), а в периоде ${newDays} дн.`,
        },
        { status: 409 }
      );
    }
  }

  const created = await prisma.vacationEntry.create({
    data: {
      userId: session.user.id,
      type,
      startDate: start,
      endDate: end,
      comment: body.comment,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
