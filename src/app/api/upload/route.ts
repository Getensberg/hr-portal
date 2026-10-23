import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { hit } from "@/lib/rateLimit";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 МБ

// Разрешённые типы файлов: расширение -> content-type, с которым файл отдаётся браузеру.
// HTML, SVG, скрипты и исполняемые файлы не разрешены.
const ALLOWED: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  rtf: "application/rtf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  zip: "application/zip",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

// Проверка, что содержимое действительно такое, как заявлено расширением (для основных форматов)
function matchesSignature(ext: string, b: Uint8Array): boolean {
  const starts = (...sig: number[]) => sig.every((v, i) => b[i] === v);
  switch (ext) {
    case "jpg":
    case "jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "png":
      return starts(0x89, 0x50, 0x4e, 0x47);
    case "gif":
      return starts(0x47, 0x49, 0x46, 0x38);
    case "webp":
      return starts(0x52, 0x49, 0x46, 0x46);
    case "pdf":
      return starts(0x25, 0x50, 0x44, 0x46);
    case "docx":
    case "xlsx":
    case "pptx":
    case "odt":
    case "ods":
    case "odp":
    case "zip":
      return starts(0x50, 0x4b);
    default:
      return true;
  }
}

function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const safe = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").trim().slice(0, 150);
  return safe || "file";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hit(`upload:${session.user.id}`, 30, 10 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Слишком много загрузок, попробуйте позже" }, { status: 429 });
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_FILE_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "Файл слишком большой (максимум 20 МБ)" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });

  if (file.size === 0) return NextResponse.json({ error: "Файл пустой" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой (максимум 20 МБ)" }, { status: 413 });
  }

  const name = cleanName(file.name);
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const contentType = ALLOWED[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Этот тип файла загружать нельзя" }, { status: 400 });
  }

  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (!matchesSignature(ext, head)) {
    return NextResponse.json({ error: "Содержимое файла не соответствует его типу" }, { status: 400 });
  }

  const blob = await put(name, file, { access: "public", addRandomSuffix: true, contentType });

  return NextResponse.json({ url: blob.url, name });
}
