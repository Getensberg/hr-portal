import { NextResponse } from "next/server";

// Страница-обработчик приложения. Интерфейса у приложения нет, поэтому просто отвечаем 200.
function page() {
  return new NextResponse("<!doctype html><meta charset=\"utf-8\"><title>HR-портал</title><p>Приложение «HR-портал» подключено.</p>", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const GET = page;
export const POST = page;
