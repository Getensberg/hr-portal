import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/vacation";
import { parseBody } from "@/lib/validate";
import { blockedPeriodSchema } from "@/lib/schemas";

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

  const parsed = await parseBody(req, blockedPeriodSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.blockedPeriod.create({
    data: {
      startDate: parseISODate(body.startDate)!,
      endDate: parseISODate(body.endDate)!,
      reason: body.reason,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
