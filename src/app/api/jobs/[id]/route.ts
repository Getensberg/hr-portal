import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { jobUpdateSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Раньше тело запроса уходило в базу как есть, теперь меняются только перечисленные поля
  const parsed = await parseBody(req, jobUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const updated = await prisma.jobPosting.update({
      where: { id },
      data: {
        title: body.title,
        department: body.department,
        description: body.description,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.jobPosting.delete({ where: { id } });
  return NextResponse.json({ id, deleted: true });
}
