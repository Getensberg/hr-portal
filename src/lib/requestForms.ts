import { parseISODate } from "./vacation";

// Поля заявок по типам. Один и тот же список использует форма (что показывать),
// сервер (что проверять) и Битрикс (как описать задачу).

export type FieldKind = "text" | "textarea" | "select" | "date" | "number";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  max?: number; // длина текста или верхняя граница числа
  min?: number; // нижняя граница числа
  // Поле показывается и проверяется, только когда другое поле равно значению
  showIf?: { key: string; value: string };
}

export interface FormDef {
  hint?: string;
  fields: FieldDef[];
}

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }));

const comment = (label = "Комментарий", required = false): FieldDef => ({
  key: "description",
  label,
  kind: "textarea",
  required,
  max: 1000,
  placeholder: "Необязательно",
});

export const REQUEST_FORMS: Record<string, FormDef> = {
  LEAVE: {
    hint: "После подтверждения HR период появится в календаре.",
    fields: [
      {
        key: "leaveKind",
        label: "Вид",
        kind: "select",
        required: true,
        options: [
          { value: "VACATION", label: "Отпуск" },
          { value: "DAY_OFF", label: "Отгул" },
        ],
      },
      { key: "startDate", label: "Первый день", kind: "date", required: true },
      { key: "endDate", label: "Последний день", kind: "date", required: true },
      comment(),
    ],
  },
  BUSINESS_TRIP: {
    hint: "После подтверждения HR период появится в календаре.",
    fields: [
      { key: "city", label: "Куда", kind: "text", required: true, max: 200, placeholder: "Город или место" },
      { key: "purpose", label: "Цель поездки", kind: "text", required: true, max: 300 },
      { key: "startDate", label: "Первый день", kind: "date", required: true },
      { key: "endDate", label: "Последний день", kind: "date", required: true },
      comment(),
    ],
  },
  DOCUMENT: {
    fields: [
      {
        key: "docKind",
        label: "Какая справка нужна",
        kind: "select",
        required: true,
        options: opts("Справка с места работы", "2-НДФЛ", "Справка о доходах для банка", "Копия трудовой книжки", "Другое"),
      },
      { key: "docOther", label: "Уточните, какая", kind: "text", required: true, max: 200, showIf: { key: "docKind", value: "Другое" } },
      { key: "docFormat", label: "Формат", kind: "select", required: true, options: opts("Бумажная", "Электронная") },
      { key: "copies", label: "Количество копий", kind: "number", min: 1, max: 10, showIf: { key: "docFormat", value: "Бумажная" } },
      comment(),
    ],
  },
  EQUIPMENT: {
    fields: [
      {
        key: "item",
        label: "Что нужно",
        kind: "select",
        required: true,
        options: opts("Ноутбук", "Монитор", "Клавиатура", "Мышь", "Гарнитура", "Телефон", "Другое"),
      },
      { key: "itemOther", label: "Уточните, что именно", kind: "text", required: true, max: 200, showIf: { key: "item", value: "Другое" } },
      { key: "reason", label: "Причина", kind: "select", required: true, options: opts("Новое рабочее место", "Замена", "Поломка") },
      comment(),
    ],
  },
  ACCESS: {
    fields: [
      {
        key: "system",
        label: "Куда нужен доступ",
        kind: "select",
        required: true,
        options: opts("Битрикс24", "1С", "Почта", "CRM", "Папка или диск", "Пропуск в офис", "Другое"),
      },
      { key: "systemOther", label: "Уточните, куда", kind: "text", required: true, max: 200, showIf: { key: "system", value: "Другое" } },
      comment("Что нужно открыть и зачем", true),
    ],
  },
};

function visible(def: FieldDef, data: Record<string, unknown>): boolean {
  return !def.showIf || data[def.showIf.key] === def.showIf.value;
}

export function visibleFields(type: string, data: Record<string, unknown>): FieldDef[] {
  return (REQUEST_FORMS[type]?.fields ?? []).filter((f) => visible(f, data));
}

export function emptyPayload(type: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of REQUEST_FORMS[type]?.fields ?? []) {
    out[f.key] = f.kind === "select" && f.options ? f.options[0].value : f.key === "copies" ? "1" : "";
  }
  return out;
}

// Проверка и очистка содержимого заявки: остаются только известные поля, лишнее отбрасывается
export function validateRequestPayload(
  type: string,
  input: Record<string, unknown>
): { ok: true; data: Record<string, string | number> } | { ok: false; error: string } {
  const form = REQUEST_FORMS[type];
  if (!form) return { ok: false, error: "Неизвестный тип заявки" };

  const data: Record<string, string | number> = {};
  const raw: Record<string, unknown> = {};
  for (const f of form.fields) raw[f.key] = typeof input[f.key] === "string" ? (input[f.key] as string).trim() : input[f.key];

  for (const f of form.fields) {
    if (!visible(f, raw)) continue;
    const v = raw[f.key];
    const empty = v === undefined || v === null || v === "";
    if (empty) {
      if (f.required) return { ok: false, error: `Заполните поле «${f.label}»` };
      continue;
    }

    if (f.kind === "number") {
      const n = Number(v);
      if (!Number.isInteger(n) || n < (f.min ?? 0) || n > (f.max ?? 1000)) {
        return { ok: false, error: `Поле «${f.label}»: число от ${f.min ?? 0} до ${f.max ?? 1000}` };
      }
      data[f.key] = n;
    } else if (f.kind === "date") {
      if (typeof v !== "string" || !parseISODate(v)) return { ok: false, error: `Поле «${f.label}»: укажите дату` };
      data[f.key] = v;
    } else if (f.kind === "select") {
      if (typeof v !== "string" || !f.options?.some((o) => o.value === v)) {
        return { ok: false, error: `Поле «${f.label}»: выберите значение из списка` };
      }
      data[f.key] = v;
    } else {
      if (typeof v !== "string") return { ok: false, error: `Поле «${f.label}»: неверное значение` };
      if (v.length > (f.max ?? 1000)) return { ok: false, error: `Поле «${f.label}» слишком длинное` };
      data[f.key] = v;
    }
  }

  const start = data.startDate as string | undefined;
  const end = data.endDate as string | undefined;
  if (start && end && start > end) return { ok: false, error: "Дата начала позже даты окончания" };

  return { ok: true, data };
}

export function fmtIsoDay(v: unknown): string | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  const [y, m, d] = v.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

// Период заявки (для названия задачи и календаря)
export function requestPeriod(payload: Record<string, unknown> | null | undefined): { start: string; end: string } | null {
  const s = payload?.startDate;
  const e = payload?.endDate ?? s;
  return typeof s === "string" && typeof e === "string" && parseISODate(s) && parseISODate(e) ? { start: s, end: e } : null;
}

// Человекочитаемые пары «поле: значение». Старые заявки (одно поле description) тоже подходят
export function describePayload(type: string, payload: Record<string, unknown> | null | undefined): { label: string; value: string }[] {
  const p = payload ?? {};
  const out: { label: string; value: string }[] = [];
  for (const f of visibleFields(type, p)) {
    const v = p[f.key];
    if (v === undefined || v === null || v === "") continue;
    let value = String(v);
    if (f.kind === "date") value = fmtIsoDay(v) ?? value;
    if (f.kind === "select") value = f.options?.find((o) => o.value === v)?.label ?? value;
    out.push({ label: f.label, value });
  }
  return out;
}

// Короткая строка для списка заявок
export function summarizePayload(type: string, payload: Record<string, unknown> | null | undefined): string {
  const p = payload ?? {};
  const period = requestPeriod(p);
  const periodText = period ? (period.start === period.end ? fmtIsoDay(period.start) : `${fmtIsoDay(period.start)} – ${fmtIsoDay(period.end)}`) : null;
  const parts: string[] = [];
  if (type === "LEAVE") parts.push(p.leaveKind === "DAY_OFF" ? "Отгул" : "Отпуск");
  if (type === "BUSINESS_TRIP" && typeof p.city === "string") parts.push(p.city);
  if (type === "DOCUMENT") parts.push(String(p.docKind === "Другое" ? p.docOther ?? "Другое" : p.docKind ?? ""));
  if (type === "EQUIPMENT") parts.push(String(p.item === "Другое" ? p.itemOther ?? "Другое" : p.item ?? ""));
  if (type === "ACCESS") parts.push(String(p.system === "Другое" ? p.systemOther ?? "Другое" : p.system ?? ""));
  if (periodText) parts.push(periodText);
  const base = parts.filter(Boolean).join(", ");
  const desc = typeof p.description === "string" ? p.description : "";
  return [base, desc].filter(Boolean).join(" — ");
}
