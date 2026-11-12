import { prisma } from "./prisma";
import { expandHolidayPeriods } from "./holidays";
import { VACATION_LIMITS, rangesOverlap, daysInYearExcludingHolidays } from "./vacation";

export type PeriodType = "VACATION" | "DAY_OFF" | "BUSINESS_TRIP";

// Общие правила для периодов в календаре: и для прямого добавления, и для заявок.
// Возвращает текст ошибки или null, если период можно вносить.
export async function checkPeriodRules(userId: string, type: PeriodType, start: Date, end: Date): Promise<string | null> {
  const [existing, holidays] = await Promise.all([
    prisma.vacationEntry.findMany({ where: { userId } }),
    prisma.companyHoliday.findMany(),
  ]);

  // Пересечение с любым уже внесённым периодом (отпуск, отгул и командировку нельзя совмещать)
  const clash = existing.find((e) => rangesOverlap(start, end, e.startDate, e.endDate));
  if (clash) return "Эти даты пересекаются с уже внесённым периодом";

  if (type === "BUSINESS_TRIP") return null;

  const holidaySet = new Set(expandHolidayPeriods(holidays).map((h) => h.date.toISOString().slice(0, 10)));

  // Лимит проверяем отдельно по каждому году, которого касается период. Праздники внутри
  // периода в счёт не идут — так же, как считаются календарные дни отпуска по ТК РФ.
  const limit = VACATION_LIMITS[type];
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
    const newDays = daysInYearExcludingHolidays(start, end, year, holidaySet);
    const used = existing
      .filter((e) => e.type === type)
      .reduce((sum, e) => sum + daysInYearExcludingHolidays(e.startDate, e.endDate, year, holidaySet), 0);

    if (used + newDays > limit) {
      return `Превышен лимит на ${year} год: осталось ${Math.max(limit - used, 0)} дн. (праздники внутри периода не считаются), а в периоде ${newDays} дн.`;
    }
  }
  return null;
}
