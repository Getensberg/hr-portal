import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 640px)";

// true на телефоне; на сервере и при первой отрисовке считается компьютером
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(QUERY);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
