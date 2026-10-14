"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Сбрасывает прокрутку в начало при переходе на другую страницу (на телефоне страницы открывались «с середины»). */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
