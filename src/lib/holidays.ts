// Праздники хранятся периодами (startDate–endDate), а остальной код работает с отдельными днями.

const DAY = 86400000;

interface HolidayPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  name: string;
}

export interface HolidayDay {
  id: string; // id периода, к которому относится день
  date: Date;
  name: string;
}

export function expandHolidayPeriods(periods: HolidayPeriod[]): HolidayDay[] {
  const days: HolidayDay[] = [];
  for (const p of periods) {
    for (let t = p.startDate.getTime(); t <= p.endDate.getTime(); t += DAY) {
      days.push({ id: p.id, date: new Date(t), name: p.name });
    }
  }
  return days.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Отдельные дни -> периоды: подряд идущие дни с одним названием склеиваются
export function daysToPeriods(days: { date: Date; name: string }[]): { startDate: Date; endDate: Date; name: string }[] {
  const sorted = [...days].sort((a, b) => a.date.getTime() - b.date.getTime());
  const result: { startDate: Date; endDate: Date; name: string }[] = [];
  for (const d of sorted) {
    const last = result[result.length - 1];
    if (last && last.name === d.name && d.date.getTime() - last.endDate.getTime() === DAY) {
      last.endDate = d.date;
    } else {
      result.push({ startDate: d.date, endDate: d.date, name: d.name });
    }
  }
  return result;
}
