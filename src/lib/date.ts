// Автоформат при вводе: превращает "10092026" в "10.09.2026" по мере печати
export function autoFormatRuDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8); // только цифры, максимум 8 (ддммгггг)
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));
  return parts.join(".");
}

// "10.09.2026" -> "2026-09-10" (для отправки на сервер) либо null если формат неверный
export function parseRuDate(input: string): string | null {
  const match = input.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd), month = Number(mm);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${yyyy}-${mm}-${dd}`;
}