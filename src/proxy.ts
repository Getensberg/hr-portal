import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

const authProxy = withAuth({
  pages: { signIn: "/login" },
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export default function proxy(req: NextRequest, event: Parameters<typeof authProxy>[1]) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    // Защита от запросов с чужих сайтов: изменяющие запросы принимаем только с нашего адреса.
    // Битрикс и вход (у NextAuth своя защита) приходят извне, их не трогаем.
    const external = pathname.startsWith("/api/bitrix/") || pathname.startsWith("/api/auth/");
    if (!SAFE_METHODS.has(req.method) && !external) {
      const origin = req.headers.get("origin");
      if (origin) {
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        let originHost = "";
        try {
          originHost = new URL(origin).host;
        } catch {
          /* некорректный Origin отклоняем ниже */
        }
        if (!originHost || originHost !== host) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }
    return NextResponse.next();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return authProxy(req as any, event as any);
}

export const config = {
  matcher: [
    "/api/:path*",
    // всё, кроме страницы входа, всех API-роутов и статики
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
