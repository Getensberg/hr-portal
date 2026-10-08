import { z } from "zod";
import { parseISODate } from "./vacation";

// ---------- Общие кирпичики ----------

// Пустая строка и null превращаются в null, остальное обрезается по пробелам
const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, "Слишком длинное значение")
    .nullish()
    .transform((v) => (v ? v : null));

const optionalEmail = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Некорректный email");

const optionalId = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null));

const requiredName = z
  .string({ error: "Укажите ФИО" })
  .trim()
  .min(1, "Укажите ФИО")
  .max(200, "ФИО слишком длинное");

const requiredEmail = z
  .string({ error: "Укажите email" })
  .trim()
  .min(1, "Укажите email")
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Некорректный email");

// ---------- Оргструктура ----------

export const orgPersonSchema = z.object({
  fullName: requiredName,
  position: optionalText(200),
  department: optionalText(200),
  phone: optionalText(50),
  email: optionalEmail,
  managerId: optionalId,
  linkedUserId: optionalId,
  isDepartmentHead: z.boolean().optional().default(false),
});

// ---------- Сотрудники ----------

const roleEnum = z.enum(["EMPLOYEE", "MANAGER", "HR_ADMIN"], { error: "Неизвестная роль" });

export const userCreateSchema = z.object({
  fullName: requiredName,
  email: requiredEmail,
  role: roleEnum.default("EMPLOYEE"),
  department: optionalText(200),
  position: optionalText(200),
  phone: optionalText(50),
});

export const userUpdateSchema = z.object({
  fullName: requiredName,
  email: requiredEmail,
  role: roleEnum,
  department: optionalText(200),
  position: optionalText(200),
  phone: optionalText(50),
  managerId: optionalId,
});

// ---------- Заявки ----------

const fileRef = z.object({ url: z.string().min(1), name: z.string() });

export const requestCreateSchema = z.object({
  type: z.enum(["DOCUMENT", "LEAVE", "BUSINESS_TRIP", "EQUIPMENT", "ACCESS"], { error: "Неизвестный тип заявки" }),
  // Содержимое зависит от шаблона заявки, поэтому проверяем только что это объект
  payload: z.record(z.string(), z.any()).optional().default({}),
  files: z.array(fileRef).max(20, "Слишком много файлов").nullish().transform((v) => v?.map((f) => ({ url: f.url, name: f.name }))),
  note: optionalText(2000),
});

export const requestStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"], { error: "Неизвестный статус" }),
});

// ---------- Календарь отпусков ----------

const isoDate = z
  .string({ error: "Некорректные даты" })
  .refine((v) => parseISODate(v) !== null, "Некорректные даты");

export const vacationCreateSchema = z
  .object({
    type: z.enum(["VACATION", "DAY_OFF"], { error: "Неизвестный тип" }),
    startDate: isoDate,
    endDate: isoDate,
    comment: optionalText(500),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "Дата начала позже даты окончания",
    path: ["endDate"],
  });

export const vacationStatusSchema = z.object({
  status: z.enum(["PLANNED", "CONFIRMED"], { error: "Неизвестный статус" }),
});

// ---------- Вопросы теста: правка ----------

export const questionUpdateSchema = z.object({
  text: z
    .string({ error: "Введите текст вопроса" })
    .trim()
    .min(1, "Введите текст вопроса")
    .max(2000, "Текст вопроса слишком длинный"),
  options: z
    .array(
      z.object({
        text: z.string().trim().max(500, "Вариант слишком длинный"),
        isCorrect: z.boolean().optional().default(false),
      })
    )
    .max(20, "Слишком много вариантов")
    .optional(),
});
