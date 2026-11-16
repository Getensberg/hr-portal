import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bitrixEnabled } from "@/lib/bitrix/client";
import { trySyncRequest } from "@/lib/bitrix/requests";

// HR вручную создаёт задачу в Битриксе по заявке, для которой она не создалась
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!bitrixEnabled()) return NextResponse.json({ error: "Интеграция с Битриксом не настроена" }, { status: 400 });

  const req = await prisma.request.findUnique({ where: { id }, select: { bitrixTaskId: true } });
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (req.bitrixTaskId) return NextResponse.json({ ok: true });

  await prisma.request.update({ where: { id }, data: { bitrixAttempts: 0 } });
  const ok = await trySyncRequest(id);
  const after = await prisma.request.findUnique({ where: { id }, select: { bitrixTaskId: true, bitrixError: true } });
  if (!ok || !after?.bitrixTaskId) {
    return NextResponse.json({ error: after?.bitrixError || "Не удалось создать задачу. Проверьте, что приложение установлено в Битриксе" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
