import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPasswordToken, passwordLink, TOKEN_TTL_DAYS } from "@/lib/passwordTokens";

// HR создаёт для сотрудника ссылку на установку нового пароля (старый пароль при этом не меняется, пока ссылка не использована)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const link = passwordLink(await createPasswordToken(user.id));
  return NextResponse.json({ link, days: TOKEN_TTL_DAYS });
}
