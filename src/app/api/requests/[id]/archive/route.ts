import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";

const schema = z.object({ archived: z.boolean({ error: "Некорректный запрос" }) });

// Сотрудник сам отправляет свою выполненную заявку в архив или возвращает её из архива
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const target = await prisma.request.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!target || (target.userId !== session.user.id && session.user.role !== "HR_ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (parsed.data.archived && target.status !== "DONE") {
    return NextResponse.json({ error: "В архив можно отправить только выполненную заявку" }, { status: 400 });
  }

  await prisma.request.update({ where: { id }, data: { archivedAt: parsed.data.archived ? new Date() : null } });
  return NextResponse.json({ id, archived: parsed.data.archived });
}
