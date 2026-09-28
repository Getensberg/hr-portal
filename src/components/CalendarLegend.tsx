import { colors } from "./calendarStyles";

const ITEMS = [
  { cls: colors.vacationConfirmed, label: "Отпуск подтверждён" },
  { cls: colors.vacationPlanned, label: "Отпуск запланирован" },
  { cls: colors.dayOffConfirmed, label: "Отгул подтверждён" },
  { cls: colors.dayOffPlanned, label: "Отгул запланирован" },
  { cls: colors.holiday, label: "Праздник" },
  { cls: colors.blocked, label: "Не рекомендуется" },
  { cls: colors.weekend, label: "Выходной" },
];

export function CalendarLegend() {
  return (
    <div className={colors.legend}>
      {ITEMS.map((item) => (
        <span key={item.label} className={colors.legendItem}>
          <span className={`${colors.swatch} ${item.cls}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}