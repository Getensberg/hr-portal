import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { fullName: true, position: true, department: true, email: true },
    orderBy: [{ department: "asc" }, { fullName: "asc" }],
  });

  const grouped: Record<string, typeof users> = {};
  for (const u of users) {
    const dept = u.department || "Без отдела";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(u);
  }
  return NextResponse.json(grouped);
}