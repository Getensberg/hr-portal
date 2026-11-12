import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/vacation";
import { checkPeriodRules } from "@/lib/vacationRules";
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

  const problem = await checkPeriodRules(session.user.id, type, start, end);
  if (problem) return NextResponse.json({ error: problem }, { status: 409 });

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
