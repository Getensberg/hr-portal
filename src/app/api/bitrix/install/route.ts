import { NextRequest, NextResponse } from "next/server";
import { bindTaskEvents, } from "@/lib/bitrix/requests";
import { bitrixEnabled, saveConnection, verifyInstallToken } from "@/lib/bitrix/client";

// Сюда Битрикс присылает токены при установке приложения. Формат у Битрикса бывает разным
// (поля AUTH_ID/REFRESH_ID или auth[access_token]), поэтому читаем оба варианта.
async function readFields(req: NextRequest): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      Object.assign(out, flatten(await req.json()));
    } else {
      const form = await req.formData();
      form.forEach((v, k) => { if (typeof v === "string") out[k] = v; });
    }
  } catch {
    /* пустое тело */
  }
  new URL(req.url).searchParams.forEach((v, k) => { if (!(k in out)) out[k] = v; });
  return out;
}

function flatten(obj: unknown, prefix = "", out: Record<string, string> = {}) {
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flatten(v, prefix ? `${prefix}[${k}]` : k, out);
    }
  } else if (obj !== undefined && obj !== null) {
    out[prefix] = String(obj);
  }
  return out;
}

export async function POST(req: NextRequest) {
  if (!bitrixEnabled()) return NextResponse.json({ error: "Интеграция не настроена" }, { status: 503 });

  const f = await readFields(req);
  const accessToken = f["AUTH_ID"] || f["auth[access_token]"];
  const refreshToken = f["REFRESH_ID"] || f["auth[refresh_token]"];
  const domain = f["DOMAIN"] || f["auth[domain]"];
  const memberId = f["member_id"] || f["auth[member_id]"];
  const expiresIn = Number(f["AUTH_EXPIRES"] || f["auth[expires_in]"] || 3600);
  const endpoint = f["auth[client_endpoint]"] || (domain ? `https://${domain}/rest/` : "");

  if (!accessToken || !refreshToken || !domain || !memberId) {
    return NextResponse.json({ error: "Нет данных авторизации" }, { status: 400 });
  }

  // Принимаем токены только от нашего Битрикса и только настоящие (проверяем у самого Битрикса)
  if (!(await verifyInstallToken(domain, accessToken))) {
    return NextResponse.json({ error: "Токен не прошёл проверку" }, { status: 403 });
  }

  await saveConnection({
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    clientEndpoint: endpoint,
    domain,
    memberId,
    scope: f["auth[scope]"] || null,
    applicationToken: f["auth[application_token]"] || null,
  });

  try {
    await bindTaskEvents();
  } catch (err) {
    console.error("[bitrix] не удалось подписаться на события задач:", err);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
