import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jobs = await prisma.jobPosting.findMany({
    include: { _count: { select: { referrals: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(jobs.map((j) => ({ ...j, referralsCount: j._count.referrals })));
}