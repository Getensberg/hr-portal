// Достаёт понятный текст ошибки из ответа сервера (RTK Query .unwrap()) или из исключения
export function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: { error?: unknown }; message?: unknown } | null;
  if (typeof e?.data?.error === "string" && e.data.error) return e.data.error;
  if (typeof e?.message === "string" && e.message) return e.message;
  return fallback;
}
