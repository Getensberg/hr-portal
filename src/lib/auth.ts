import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, hit, isBlocked, reset } from "@/lib/rateLimit";

// Хеш-пустышка: если пользователя нет, всё равно считаем bcrypt, чтобы по времени ответа нельзя было угадать, есть ли такой email
const DUMMY_HASH = "$2b$10$aOYC5BIk3rNw1KS4aPfa1OvUUPin3J0PTEWI43mLUq2p3X9WVmXVi";

const LOGIN_FAIL_LIMIT = 5; // неудачных попыток на один email
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 30; // попыток входа с одного IP

// Роль берём из базы (с короткой памятью), чтобы удалённый или понижённый сотрудник терял доступ сразу, а не через недели
const roleCache = new Map<string, { role: string | null; at: number }>();
const ROLE_TTL_MS = 30_000;

async function currentRole(id: string): Promise<string | null> {
  const cached = roleCache.get(id);
  if (cached && Date.now() - cached.at < ROLE_TTL_MS) return cached.role;
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (roleCache.size > 2000) roleCache.clear();
  roleCache.set(id, { role: u?.role ?? null, at: Date.now() });
  return u?.role ?? null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.password.length > 200) return null;

        const email = credentials.email.trim().toLowerCase();
        const emailKey = `login:fail:${email}`;
        const ipKey = `login:ip:${clientIp(req?.headers ?? {})}`;

        if (!hit(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS).ok || isBlocked(emailKey, LOGIN_FAIL_LIMIT)) {
          throw new Error("RATE_LIMIT");
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email.trim() } });
        const valid = await bcrypt.compare(credentials.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) {
          hit(emailKey, LOGIN_FAIL_LIMIT, LOGIN_WINDOW_MS);
          return null;
        }

        reset(emailKey);
        return { id: user.id, email: user.email, name: user.fullName, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        return token;
      }
      const id = token.id as string | undefined;
      if (!id) throw new Error("Нет пользователя в сессии");
      const role = await currentRole(id);
      // Сотрудника удалили: бросаем ошибку, NextAuth в этом случае считает сессию недействительной
      if (!role) throw new Error("Пользователь удалён");
      token.role = role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
