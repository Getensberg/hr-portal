import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { orgDocumentSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const docs = await prisma.orgDocument.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, orgDocumentSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.orgDocument.create({
    data: {
      title: body.title,
      description: body.description,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      createdBy: session.user.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
