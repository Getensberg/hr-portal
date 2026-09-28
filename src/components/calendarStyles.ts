import colors from "./calendarColors.module.css";

export function entryClass(type: string, status: string): string {
  if (type === "VACATION") {
    return status === "CONFIRMED" ? colors.vacationConfirmed : colors.vacationPlanned;
  }
  return status === "CONFIRMED" ? colors.dayOffConfirmed : colors.dayOffPlanned;
}

export { colors };