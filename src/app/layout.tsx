import type { Metadata } from "next";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import "./globals.css";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";



export const metadata: Metadata = {
  title: "HR-портал",
  description: "Внутренний портал для сотрудников компании",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
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