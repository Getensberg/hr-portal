import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { requestCreateSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.request.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, requestCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.request.create({
    data: {
      userId: session.user.id,
      type: body.type,
      payload: body.payload,
      files: body.files,
      note: body.note,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
