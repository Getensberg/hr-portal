// Ссылка на файл допустима, только если это https-адрес или путь внутри сайта.
// Так в базу не попадают javascript:, data: и подобные адреса.
export function isSafeFileUrl(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 2000) return false;
  if (v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
