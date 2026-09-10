import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const count = await prisma.onboardingTask.count({ where: { planId } });

  const created = await prisma.onboardingTask.create({
    data: {
      planId,
      title: body.title,
      description: body.description || null,
      dueDate: body.dueDate ? new Date(body.dueDate + "T00:00:00") : null,
      order: count,
    },
  });
  return NextResponse.json(created, { status: 201 });
}