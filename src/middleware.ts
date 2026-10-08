export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // всё, кроме страницы входа, служебных путей NextAuth и статики
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};