import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VACATION_LIMITS, parseISODate, rangesOverlap, daysInYear } from "@/lib/vacation";

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

  const body = await req.json();

  const type = body.type as keyof typeof VACATION_LIMITS;
  if (!(type in VACATION_LIMITS)) {
    return NextResponse.json({ error: "Неизвестный тип" }, { status: 400 });
  }

  const start = parseISODate(body.startDate);
  const end = parseISODate(body.endDate);
  if (!start || !end) {
    return NextResponse.json({ error: "Некорректные даты" }, { status: 400 });
  }
  if (start.getTime() > end.getTime()) {
    return NextResponse.json({ error: "Дата начала позже даты окончания" }, { status: 400 });
  }

  const existing = await prisma.vacationEntry.findMany({ where: { userId: session.user.id } });

  // Пересечение с любым уже внесённым периодом (отпуск и отгул нельзя брать в один день)
  const clash = existing.find((e) => rangesOverlap(start, end, e.startDate, e.endDate));
  if (clash) {
    return NextResponse.json({ error: "Эти даты пересекаются с уже внесённым периодом" }, { status: 409 });
  }

  // Лимит проверяем отдельно по каждому году, которого касается период
  const limit = VACATION_LIMITS[type];
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
    const newDays = daysInYear(start, end, year);
    const used = existing
      .filter((e) => e.type === type)
      .reduce((sum, e) => sum + daysInYear(e.startDate, e.endDate, year), 0);

    if (used + newDays > limit) {
      return NextResponse.json(
        { error: `Превышен лимит на ${year} год: осталось ${Math.max(limit - used, 0)} дн., а в периоде ${newDays} дн.` },
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
      comment: body.comment || null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}