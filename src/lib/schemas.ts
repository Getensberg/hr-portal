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
  managerId: optionalId,
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

// ======================================================================
// Дальше: обучение, календарь, справочники, вакансии, контент, онбординг, опросы
// ======================================================================

// Для PATCH: поле не пришло -> undefined (не трогаем), пришло пустым -> null (очищаем)
const patchText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, "Слишком длинное значение")
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null));

const accessModeEnum = z.enum(["OPEN", "RESTRICTED"], { error: "Неизвестный режим доступа" });

const httpUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Ссылка на видео должна начинаться с http:// или https://");

// ---------- Курсы ----------

export const courseCreateSchema = z.object({
  title: z.string({ error: "Укажите название курса" }).trim().min(1, "Укажите название курса").max(200, "Название слишком длинное"),
  description: optionalText(5000),
  category: optionalText(100),
  accessMode: accessModeEnum.optional().default("OPEN"),
});

export const courseUpdateSchema = z.object({
  title: z.string().trim().min(1, "Название не может быть пустым").max(200, "Название слишком длинное").optional(),
  description: patchText(5000),
  category: patchText(100),
  accessMode: accessModeEnum.optional(),
  status: z.enum(["DRAFT", "PUBLISHED"], { error: "Неизвестный статус" }).optional(),
});

// ---------- Уроки ----------

export const lessonCreateSchema = z
  .object({
    title: z.string({ error: "Укажите название урока" }).trim().min(1, "Укажите название урока").max(200, "Название слишком длинное"),
    content: z.string().trim().max(50000, "Текст урока слишком длинный").nullish().transform((v) => v ?? ""),
    videoUrl: httpUrl.nullish().transform((v) => v ?? ""),
    files: z.array(fileRef).max(20, "Слишком много файлов").nullish().transform((v) => v?.map((f) => ({ url: f.url, name: f.name }))),
  })
  .refine((v) => v.content !== "" || v.videoUrl !== "" || (v.files?.length ?? 0) > 0, {
    message: "Добавьте текст, ссылку на видео или файл",
    path: ["content"],
  });

export const lessonUpdateSchema = z.object({
  title: z.string().trim().min(1, "Название не может быть пустым").max(200, "Название слишком длинное").optional(),
  content: z.string().trim().max(50000, "Текст урока слишком длинный").optional(),
  videoUrl: httpUrl.nullish().transform((v) => (v === undefined ? undefined : v || null)),
  files: z.array(fileRef).max(20, "Слишком много файлов").optional().transform((v) => v?.map((f) => ({ url: f.url, name: f.name }))),
});

export const lessonCompleteSchema = z.object({
  done: z.boolean().optional().default(true),
});

// ---------- Тесты ----------

export const testCreateSchema = z.object({
  title: z.string({ error: "Укажите название теста" }).trim().min(1, "Укажите название теста").max(200, "Название слишком длинное"),
  description: optionalText(5000),
  category: optionalText(100),
  accessMode: accessModeEnum.optional().default("OPEN"),
  courseId: optionalId,
});

export const testUpdateSchema = z.object({
  title: z.string().trim().min(1, "Название не может быть пустым").max(200, "Название слишком длинное").optional(),
  description: patchText(5000),
  category: patchText(100),
  accessMode: accessModeEnum.optional(),
  passingScore: z
    .number({ error: "Проходной балл должен быть от 1 до 100" })
    .transform((n) => Math.round(n))
    .refine((n) => n >= 1 && n <= 100, "Проходной балл должен быть от 1 до 100")
    .optional(),
  maxAttempts: z
    .number({ error: "Число попыток должно быть от 1 до 20" })
    .transform((n) => Math.round(n))
    .refine((n) => n >= 1 && n <= 20, "Число попыток должно быть от 1 до 20")
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED"], { error: "Неизвестный статус" }).optional(),
});

export const questionCreateSchema = z.object({
  text: z.string({ error: "Введите текст вопроса" }).trim().min(1, "Введите текст вопроса").max(2000, "Текст вопроса слишком длинный"),
  kind: z.enum(["CHOICE", "OPEN"]).optional().default("CHOICE"),
  options: z
    .array(
      z.object({
        text: z.string().trim().max(500, "Вариант слишком длинный"),
        isCorrect: z.boolean().optional().default(false),
      })
    )
    .max(30, "Слишком много вариантов")
    .optional()
    .default([]),
});

// Выдача доступа к курсу или тесту: конкретным людям и/или целому отделу
export const accessGrantSchema = z.object({
  userIds: z.array(z.string()).max(1000).optional().default([]),
  department: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null)),
});

export const reviewSchema = z.object({
  verdicts: z.record(z.string(), z.boolean()).optional().default({}),
});

// ---------- Праздники и запретные периоды ----------

export const holidaysSchema = z.object({
  items: z
    .array(
      z.object({
        date: z.string({ error: "Некорректная дата в списке" }).refine((v) => parseISODate(v) !== null, "Некорректная дата в списке"),
        name: z
          .string()
          .trim()
          .max(200)
          .nullish()
          .transform((v) => v || "Нерабочий день"),
      })
    )
    .min(1, "Нужно от 1 до 400 дат за раз")
    .max(400, "Нужно от 1 до 400 дат за раз"),
});

export const blockedPeriodSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    reason: z.string({ error: "Укажите причину" }).trim().min(1, "Укажите причину").max(200, "Причина слишком длинная"),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "Дата начала позже даты окончания",
    path: ["endDate"],
  });

// ---------- Отделы ----------

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Цвет должен быть в формате #RRGGBB");

export const departmentCreateSchema = z.object({
  name: z.string({ error: "Укажите название" }).trim().min(1, "Укажите название").max(100, "Название слишком длинное"),
  color: hexColor.nullish().transform((v) => v || "#CADCFC"),
});

export const departmentColorSchema = z.object({ color: hexColor });

// ---------- Вакансии и рекомендации ----------

export const jobCreateSchema = z.object({
  title: z.string({ error: "Укажите название вакансии" }).trim().min(1, "Укажите название вакансии").max(200, "Название слишком длинное"),
  department: optionalText(200),
  description: z.string({ error: "Добавьте описание" }).trim().min(1, "Добавьте описание").max(10000, "Описание слишком длинное"),
});

export const jobUpdateSchema = z.object({
  title: z.string().trim().min(1, "Название не может быть пустым").max(200).optional(),
  department: patchText(200),
  description: z.string().trim().min(1, "Описание не может быть пустым").max(10000).optional(),
  isActive: z.boolean().optional(),
});

export const referralSchema = z.object({
  candidateName: z.string({ error: "Укажите имя кандидата" }).trim().min(1, "Укажите имя кандидата").max(200),
  candidateContact: z.string({ error: "Укажите контакт кандидата" }).trim().min(1, "Укажите контакт кандидата").max(300),
  comment: optionalText(2000),
});

// ---------- База знаний ----------

const contentType = z.enum(["KNOWLEDGE_ARTICLE", "NEWS_POST", "POLICY_DOCUMENT", "GALLERY_ALBUM"], { error: "Неизвестный тип материала" });

const contentBase = {
  title: z.string({ error: "Укажите заголовок" }).trim().min(1, "Укажите заголовок").max(300, "Заголовок слишком длинный"),
  content: z.string().max(100000, "Текст слишком длинный").nullish().transform((v) => v ?? ""),
  type: contentType,
  category: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .transform((v) => v ?? null),
  fileUrl: z.string().nullish().transform((v) => v ?? undefined),
  fileName: z.string().nullish().transform((v) => v ?? undefined),
  imageUrl: z.string().nullish().transform((v) => v ?? undefined),
  files: z.array(fileRef).max(30, "Слишком много файлов").nullish().transform((v) => v?.map((f) => ({ url: f.url, name: f.name }))),
};

export const contentSchema = z.object(contentBase);

// Файлы оргструктуры
export const orgDocumentSchema = z.object({
  title: z.string({ error: "Укажите название" }).trim().min(1, "Укажите название").max(300),
  description: optionalText(5000),
  fileUrl: optionalText(2000),
  fileName: optionalText(300),
});

// ---------- Онбординг ----------

const dateOnly = z
  .string()
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && parseISODate(v) !== null, "Некорректная дата");

const optionalDateOnly = dateOnly.nullish().transform((v) => v || null);

export const onboardingPlanSchema = z.object({
  newcomerId: z.string({ error: "Выберите сотрудника" }).min(1, "Выберите сотрудника"),
  mentorId: optionalId,
  startDate: optionalDateOnly,
  endDate: optionalDateOnly,
});

export const onboardingTaskSchema = z.object({
  title: z.string({ error: "Укажите название задачи" }).trim().min(1, "Укажите название задачи").max(300),
  description: optionalText(5000),
  dueDate: optionalDateOnly,
});

export const taskProgressSchema = z.object({ done: z.boolean({ error: "Некорректные данные" }) });

// ---------- Опросы ----------

const dateTimeString = z
  .string({ error: "Некорректная дата" })
  .refine((v) => !isNaN(new Date(v).getTime()), "Некорректная дата");

export const surveyCreateSchema = z.object({
  title: z.string({ error: "Укажите название опроса" }).trim().min(1, "Укажите название опроса").max(300),
  frequency: z.enum(["ONCE", "WEEKLY", "BIWEEKLY"], { error: "Неизвестная периодичность" }).optional().default("ONCE"),
  isAnonymous: z.boolean().optional().default(true),
  isSuggestionBox: z.boolean().optional().default(false),
  startDate: dateTimeString,
  endDate: dateTimeString.nullish().transform((v) => v || null),
  questions: z
    .array(
      z.object({
        text: z.string().trim().min(1, "Введите текст вопроса").max(1000),
        type: z.enum(["SCALE_1_5", "YES_NO", "TEXT"], { error: "Неизвестный тип вопроса" }),
      })
    )
    .min(1, "Добавьте хотя бы один вопрос")
    .max(50, "Слишком много вопросов"),
});

export const surveySubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.string().max(5000, "Ответ слишком длинный"),
      })
    )
    .max(100, "Слишком много ответов"),
});

// ---------- Прохождение теста ----------

export const attemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionIds: z.array(z.string()).max(50).optional(),
        textAnswer: z.string().max(10000, "Ответ слишком длинный").optional(),
      })
    )
    .max(200, "Слишком много ответов")
    .optional()
    .default([]),
});
