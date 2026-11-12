import colors from "./calendarColors.module.css";

export function entryClass(type: string, status: string): string {
  if (type === "VACATION") {
    return status === "CONFIRMED" ? colors.vacationConfirmed : colors.vacationPlanned;
  }
  if (type === "BUSINESS_TRIP") {
    return status === "CONFIRMED" ? colors.tripConfirmed : colors.tripPlanned;
  }
  return status === "CONFIRMED" ? colors.dayOffConfirmed : colors.dayOffPlanned;
}

export { colors };