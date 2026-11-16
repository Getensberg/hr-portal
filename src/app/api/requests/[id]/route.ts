import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { getTeamUserIds } from "@/lib/team";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { requestStatusSchema } from "@/lib/schemas";
import { setRequestStatus } from "@/lib/requestStatus";
import { pushStatusToBitrix, deleteBitrixTask } from "@/lib/bitrix/requests";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "HR_ADMIN") {
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const teamIds = await getTeamUserIds(session.user.id);
    const target = await prisma.request.findUnique({ where: { id }, select: { userId: true } });
    if (!target || !teamIds.includes(target.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const parsed = await parseBody(req, requestStatusSchema);
  if (!parsed.ok) return parsed.response;
  const { status } = parsed.data;

  const updated = await setRequestStatus(id, status);

  // Задача в Битриксе закрывается вместе с заявкой (после ответа, сбой Битрикса не мешает)
  after(async () => {
    try {
      await pushStatusToBitrix(id, status);
    } catch (err) {
      console.error("[bitrix] не удалось обновить задачу по заявке", id, err);
    }
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = await prisma.request.findUnique({ where: { id }, select: { userId: true, status: true, bitrixTaskId: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let allowed = session.user.role === "HR_ADMIN";
  // Сотрудник может удалить свою заявку, пока её не взяли в работу
  if (!allowed && target.userId === session.user.id) {
    if (target.status !== "PENDING") {
      return NextResponse.json({ error: "Заявку уже взяли в работу, удалить её может только HR" }, { status: 403 });
    }
    allowed = true;
  }
  if (!allowed && session.user.role === "MANAGER") {
    allowed = (await getTeamUserIds(session.user.id)).includes(target.userId);
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.request.delete({ where: { id } });
  after(() => deleteBitrixTask(target.bitrixTaskId));
  return NextResponse.json({ id, deleted: true });
}
