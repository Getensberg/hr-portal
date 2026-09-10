import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const created = await prisma.referral.create({
    data: {
      jobPostingId: id,
      referrerId: session.user.id,
      candidateName: body.candidateName,
      candidateContact: body.candidateContact,
      comment: body.comment || null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}