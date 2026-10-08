import { NextResponse } from "next/server";
import type { z } from "zod";

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

// Читает JSON из запроса и проверяет его схемой.
// При ошибке отдаёт 400 с текстом первой найденной проблемы в том же формате { error },
// который фронтенд уже читает через err?.data?.error.
export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S
): Promise<Parsed<z.output<S>>> {
  let raw: unknown;
  try {
    raw = await req.json();
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
