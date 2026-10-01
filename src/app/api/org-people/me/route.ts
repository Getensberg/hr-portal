import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const person = await prisma.orgPerson.findUnique({
    where: { linkedUserId: session.user.id },
    include: { manager: { select: { fullName: true, position: true, phone: true, email: true } } },
  });
  return NextResponse.json(person);
}