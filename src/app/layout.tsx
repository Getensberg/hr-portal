import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "HR-портал",
  description: "Внутренний портал для сотрудников компании",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={montserrat.variable}>
      <body>
        <Providers>
          <Nav />
          <Breadcrumbs />
          {children}
        </Providers>
      </body>
    </html>
  );
}