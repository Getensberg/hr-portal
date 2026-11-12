import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamUserIds } from "@/lib/team";

// Закрытые файлы: хранятся в S3 без публичного доступа, отдаются только вошедшим в портал.
// Вложения заявок видят только автор, HR и руководитель автора.

let client: S3Client | null = null;
function getClient() {
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || "ru-1",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
      },
    });
  }
  return client;
}

const KEY_RE = /^(requests|files)\/[0-9a-f-]{36}-[\w.-]{1,200}$/;

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.S3_BUCKET) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { key: parts } = await params;
  const key = parts.join("/");
  if (!KEY_RE.test(key)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (key.startsWith("requests/") && session.user.role !== "HR_ADMIN") {
    const ids = [session.user.id];
    if (session.user.role === "MANAGER") ids.push(...(await getTeamUserIds(session.user.id)));
    const mine = await prisma.request.findMany({ where: { userId: { in: ids } }, select: { files: true } });
    const url = `/api/files/${key}`;
    const allowed = mine.some((r) => Array.isArray(r.files) && (r.files as { url?: string }[]).some((f) => f?.url === url));
    if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const range = req.headers.get("range") ?? undefined;
    const obj = await getClient().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Range: range }));
    if (!obj.Body) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const headers = new Headers({
      "Content-Type": obj.ContentType || "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    });
    if (obj.ContentLength !== undefined) headers.set("Content-Length", String(obj.ContentLength));
    if (obj.ContentRange) headers.set("Content-Range", obj.ContentRange);

    return new Response(obj.Body.transformToWebStream(), { status: range && obj.ContentRange ? 206 : 200, headers });
  } catch (err) {
    const code = (err as { name?: string }).name;
    if (code === "NoSuchKey" || code === "NotFound") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("[files] не удалось получить файл:", err);
    return NextResponse.json({ error: "Не удалось получить файл" }, { status: 500 });
  }
}
