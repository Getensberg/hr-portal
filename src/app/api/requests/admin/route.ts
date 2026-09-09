import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.request.findMany({
    orderBy: { requestedAt: "desc" },
    include: { user: { select: { fullName: true, email: true, department: true } } },
  });
  return NextResponse.json(requests);
}