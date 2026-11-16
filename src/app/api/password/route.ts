import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/validate";
import { passwordSetSchema } from "@/lib/schemas";
import { findValidToken, setPasswordWithToken } from "@/lib/passwordTokens";
import { hit, clientIp } from "@/lib/rateLimit";

// Страница по ссылке проверяет, что ссылка ещё действует
export async function GET(req: NextRequest) {
  if (!hit(`pwd-check:${clientIp(req.headers)}`, 60, 15 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Слишком много попыток, подождите немного" }, { status: 429 });
  }
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const t = await findValidToken(token);
  if (!t) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, fullName: t.user.fullName, email: t.user.email });
}

// Сотрудник задаёт пароль
export async function POST(req: NextRequest) {
  if (!hit(`pwd-set:${clientIp(req.headers)}`, 10, 15 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Слишком много попыток, подождите немного" }, { status: 429 });
  }
  const parsed = await parseBody(req, passwordSetSchema);
  if (!parsed.ok) return parsed.response;

  const user = await setPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!user) return NextResponse.json({ error: "Ссылка недействительна или устарела. Попросите HR прислать новую" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
