// Простое ограничение частоты запросов в памяти процесса.
// На одном сервере (Docker на Timeweb) работает полностью, на Vercel действует в пределах одного экземпляра.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

// Считает попытку и говорит, можно ли продолжать
export function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  cleanup(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

// Только проверка без подсчёта
export function isBlocked(key: string, limit: number): boolean {
  const b = buckets.get(key);
  return Boolean(b && b.resetAt > Date.now() && b.count >= limit);
}

export function reset(key: string) {
  buckets.delete(key);
}

export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string) => {
    const v = headers instanceof Headers ? headers.get(name) : headers[name];
    return Array.isArray(v) ? v[0] : v ?? "";
  };
  const fwd = get("x-forwarded-for");
  return (fwd.split(",")[0] || get("x-real-ip") || "unknown").trim();
}
