import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    // всё, кроме страницы входа, всех API-роутов и статики
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ],
};