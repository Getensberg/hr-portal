import { NextResponse } from "next/server";
import type { z } from "zod";

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

const MAX_BODY_BYTES = 1_000_000; // 1 МБ: для текстовых данных достаточно, файлы идут через /api/upload

// Читает JSON из запроса и проверяет его схемой.
// При ошибке отдаёт 400 с текстом первой найденной проблемы в том же формате { error },
// который фронтенд уже читает через err?.data?.error.
export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S
): Promise<Parsed<z.output<S>>> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return { ok: false, response: NextResponse.json({ error: "Слишком большой запрос" }, { status: 413 }) };
  }

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return { ok: false, response: NextResponse.json({ error: "Слишком большой запрос" }, { status: 413 }) };
    }
    raw = JSON.parse(text);
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Некорректный JSON" }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Некорректные данные";
    return { ok: false, response: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { ok: true, data: result.data };
}
