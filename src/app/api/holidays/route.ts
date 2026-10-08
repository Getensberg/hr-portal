import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/vacation";
import { parseBody } from "@/lib/validate";
import { holidaysSchema } from "@/lib/schemas";

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

  const parsed = await parseBody(req, holidaysSchema);
  if (!parsed.ok) return parsed.response;

  // Схема уже проверила, что каждая дата реальна
  const data = parsed.data.items.map((item) => ({
    date: parseISODate(item.date)!,
    name: item.name,
  }));

  const result = await prisma.companyHoliday.createMany({ data, skipDuplicates: true });
  return NextResponse.json({ created: result.count }, { status: 201 });
}
