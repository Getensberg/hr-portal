import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { portalBaseUrl } from "./bitrix/client";

// Одноразовые ссылки: для первого пароля нового сотрудника и для сброса пароля.
// В базе хранится только хеш ссылки, сама ссылка показывается HR один раз.

export const TOKEN_TTL_DAYS = 3;

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

export async function createPasswordToken(userId: string): Promise<string> {
  // Старые неиспользованные ссылки этого сотрудника перестают работать
  await prisma.passwordToken.deleteMany({ where: { userId, usedAt: null } });
  const raw = randomBytes(32).toString("base64url");
  await prisma.passwordToken.create({
    data: { userId, tokenHash: hash(raw), expiresAt: new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000) },
  });
  return raw;
}

export function passwordLink(raw: string): string {
  return `${portalBaseUrl()}/set-password?token=${raw}`;
}

export async function findValidToken(raw: string) {
  if (!/^[\w-]{20,100}$/.test(raw)) return null;
  const t = await prisma.passwordToken.findUnique({
    where: { tokenHash: hash(raw) },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });
  if (!t || t.usedAt || t.expiresAt < new Date()) return null;
  return t;
}

export async function setPasswordWithToken(raw: string, password: string) {
  const t = await findValidToken(raw);
  if (!t) return null;
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: t.userId }, data: { passwordHash } }),
    prisma.passwordToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
  ]);
  return t.user;
}

// Пароль, который никто не знает: пока сотрудник не задал свой по ссылке, войти нельзя
export async function unusablePasswordHash(): Promise<string> {
  return bcrypt.hash(randomBytes(32).toString("hex"), 10);
}
