export const REQUEST_TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "Справка",
  LEAVE: "Отпуск/отгул",
  BUSINESS_TRIP: "Командировка",
  EQUIPMENT: "Техника",
  ACCESS: "Доступ",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "На рассмотрении",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
};

export const REQUEST_STATUS_OPTIONS = Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label }));
