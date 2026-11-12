import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { requestCreateSchema } from "@/lib/schemas";
import { syncRequestToBitrix } from "@/lib/bitrix/requests";
import { validateRequestPayload, requestPeriod } from "@/lib/requestForms";
import { checkPeriodRules, type PeriodType } from "@/lib/vacationRules";
import { parseISODate } from "@/lib/vacation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.request.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, requestCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  // Поля зависят от типа заявки: проверяем и оставляем только известные
  const checked = validateRequestPayload(body.type, body.payload);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const payload = checked.data;

  // Отпуск, отгул и командировка сразу попадают в календарь как «запланировано»
  let period: { type: PeriodType; start: Date; end: Date; comment: string | null } | null = null;
  const range = requestPeriod(payload);
  if ((body.type === "LEAVE" || body.type === "BUSINESS_TRIP") && range) {
    const type: PeriodType = body.type === "BUSINESS_TRIP" ? "BUSINESS_TRIP" : payload.leaveKind === "DAY_OFF" ? "DAY_OFF" : "VACATION";
    const start = parseISODate(range.start)!;
    const end = parseISODate(range.end)!;
    const problem = await checkPeriodRules(session.user.id, type, start, end);
    if (problem) return NextResponse.json({ error: problem }, { status: 409 });
    const comment = type === "BUSINESS_TRIP" ? `${payload.city}: ${payload.purpose}`.slice(0, 500) : typeof payload.description === "string" ? payload.description.slice(0, 500) : null;
    period = { type, start, end, comment };
  }

  const created = await prisma.request.create({
    data: {
      userId: session.user.id,
      type: body.type,
      payload,
      files: body.files,
      note: body.note,
      ...(period
        ? { vacationEntry: { create: { userId: session.user.id, type: period.type, startDate: period.start, endDate: period.end, comment: period.comment } } }
        : {}),
    },
  });

  // Задача в Битриксе создаётся после ответа сотруднику: сбой Битрикса не должен мешать подать заявку
  after(async () => {
    try {
      await syncRequestToBitrix(created.id);
    } catch (err) {
      console.error("[bitrix] не удалось создать задачу по заявке", created.id, err);
    }
  });

  return NextResponse.json(created, { status: 201 });
}
