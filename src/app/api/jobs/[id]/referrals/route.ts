import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { referralSchema } from "@/lib/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, referralSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const job = await prisma.jobPosting.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!job || !job.isActive) return NextResponse.json({ error: "Вакансия не найдена" }, { status: 404 });

  const created = await prisma.referral.create({
    data: {
      jobPostingId: id,
      referrerId: session.user.id,
      candidateName: body.candidateName,
      candidateContact: body.candidateContact,
      comment: body.comment,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
