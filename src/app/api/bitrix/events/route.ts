import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bitrixEnabled } from "@/lib/bitrix/client";
import { syncTaskStatusFromBitrix } from "@/lib/bitrix/requests";

// События Битрикса (изменение задачи). Приходят form-urlencoded: data[FIELDS_AFTER][ID], auth[application_token] и т.д.
export async function POST(req: NextRequest) {
  if (!bitrixEnabled()) return NextResponse.json({ ok: true });

  const form = await req.formData().catch(() => null);
  const get = (k: string) => {
    const v = form?.get(k);
    return typeof v === "string" ? v : "";
  };

  const event = get("event").toUpperCase();
  const taskId = get("data[FIELDS_AFTER][ID]") || get("data[FIELDS_BEFORE][ID]");
  if (event !== "ONTASKUPDATE" || !taskId) return NextResponse.json({ ok: true });

  // Если токен приложения известен, он должен совпадать. Дальше всё равно берём статус задачи у самого Битрикса.
  const conn = await prisma.bitrixConnection.findUnique({ where: { id: "main" }, select: { applicationToken: true } });
  const token = get("auth[application_token]");
  if (conn?.applicationToken && token && token !== conn.applicationToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await syncTaskStatusFromBitrix(taskId);
  } catch (err) {
    console.error("[bitrix] не удалось обновить статус заявки:", err);
  }
  return NextResponse.json({ ok: true });
}
