import { prisma } from "@/lib/prisma";
import { REQUEST_TYPE_LABELS } from "@/lib/requestTypes";
import { bitrixCall, bitrixEnabled, portalBaseUrl } from "./client";

// Заявка из портала -> задача в Битрикс24 (в группе «Заявки HR», исполнитель HR, постановщик сотрудник).
// Настройки (переменные окружения):
//   BITRIX_HR_EMAIL                 email HR-сотрудника в Битриксе: исполнитель по умолчанию
//   BITRIX_EXECUTOR_<ТИП>_EMAIL     необязательно: другой исполнитель для типа заявки, например BITRIX_EXECUTOR_EQUIPMENT_EMAIL
//   BITRIX_GROUP_ID или BITRIX_GROUP_NAME   группа для задач (по умолчанию ищем группу «Заявки HR»)

const idCache = new Map<string, number | null>();
let groupCache: number | null | undefined;

async function userIdByEmail(email: string | null | undefined): Promise<number | null> {
  if (!email) return null;
  const key = email.toLowerCase();
  if (idCache.has(key)) return idCache.get(key) ?? null;
  const found = await bitrixCall<{ ID: string }[]>("user.get", { FILTER: { EMAIL: email } });
  const id = found?.[0]?.ID ? Number(found[0].ID) : null;
  idCache.set(key, id);
  return id;
}

async function groupId(): Promise<number | null> {
  if (process.env.BITRIX_GROUP_ID) return Number(process.env.BITRIX_GROUP_ID);
  if (groupCache !== undefined) return groupCache;
  const name = process.env.BITRIX_GROUP_NAME || "Заявки HR";
  const groups = await bitrixCall<{ ID: string }[]>("sonet_group.get", { FILTER: { NAME: name } });
  groupCache = groups?.[0]?.ID ? Number(groups[0].ID) : null;
  return groupCache;
}

function shortName(fullName: string): string {
  const [last, first] = fullName.trim().split(/\s+/);
  return first ? `${last} ${first[0]}.` : last;
}

function fmtDay(v: unknown): string | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  const [y, m, d] = v.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export async function syncRequestToBitrix(requestId: string): Promise<void> {
  if (!bitrixEnabled()) return;
  const connected = await prisma.bitrixConnection.findUnique({ where: { id: "main" }, select: { id: true } });
  if (!connected) return;

  const req = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: { select: { fullName: true, email: true, department: true, position: true } } },
  });
  if (!req || req.bitrixTaskId) return;

  const payload = (req.payload ?? {}) as Record<string, unknown>;
  const files = (Array.isArray(req.files) ? req.files : []) as { url: string; name: string }[];
  const typeLabel = REQUEST_TYPE_LABELS[req.type] ?? req.type;
  const start = fmtDay(payload.startDate);
  const end = fmtDay(payload.endDate);
  const period = start ? (end && end !== start ? `${start} – ${end}` : start) : "";

  const title = `${typeLabel} — ${shortName(req.user.fullName)}${period ? ` (${period})` : ""}`;

  const lines = [
    `[B]Тип заявки:[/B] ${typeLabel}`,
    `[B]Сотрудник:[/B] ${req.user.fullName}${req.user.position ? `, ${req.user.position}` : ""}`,
    req.user.department ? `[B]Отдел:[/B] ${req.user.department}` : null,
    period ? `[B]Даты:[/B] ${period}` : null,
    typeof payload.description === "string" && payload.description ? `[B]Комментарий сотрудника:[/B] ${payload.description}` : null,
    req.note ? `[B]Примечание:[/B] ${req.note}` : null,
    files.length ? `[B]Файлы:[/B]\n${files.map((f) => `[URL=${f.url}]${f.name}[/URL]`).join("\n")}` : null,
    portalBaseUrl() ? `[B]Заявка в портале:[/B] [URL=${portalBaseUrl()}/admin/requests]открыть[/URL]` : null,
  ].filter(Boolean);

  const executorEmail = process.env[`BITRIX_EXECUTOR_${req.type}_EMAIL`] || process.env.BITRIX_HR_EMAIL;
  const [responsibleId, creatorId, group] = await Promise.all([
    userIdByEmail(executorEmail),
    userIdByEmail(req.user.email),
    groupId(),
  ]);
  if (!responsibleId) throw new Error("Не найден исполнитель в Битриксе (проверьте BITRIX_HR_EMAIL)");

  const fields: Record<string, unknown> = {
    TITLE: title,
    DESCRIPTION: lines.join("\n"),
    RESPONSIBLE_ID: responsibleId,
    ...(group ? { GROUP_ID: group } : {}),
  };

  // Постановщик: сам сотрудник. Если Битрикс не позволяет (права приложения), создаём от имени приложения.
  let result: { task?: { id: string | number } };
  try {
    result = await bitrixCall("tasks.task.add", { fields: { ...fields, ...(creatorId ? { CREATED_BY: creatorId } : {}) } });
  } catch (err) {
    if (!creatorId) throw err;
    result = await bitrixCall("tasks.task.add", { fields });
  }

  const taskId = result?.task?.id;
  if (taskId) await prisma.request.update({ where: { id: requestId }, data: { bitrixTaskId: String(taskId) } });
}

// Статус задачи Битрикса -> статус заявки. 2 новая, 3 выполняется, 4 ждёт контроля, 5 завершена, 6 отложена
export function requestStatusFromBitrix(status: string | number): "PENDING" | "IN_PROGRESS" | "DONE" {
  const s = Number(status);
  if (s === 5) return "DONE";
  if (s === 3 || s === 4) return "IN_PROGRESS";
  return "PENDING";
}

export async function syncTaskStatusFromBitrix(taskId: string): Promise<void> {
  const req = await prisma.request.findFirst({ where: { bitrixTaskId: taskId } });
  if (!req) return;
  // Источник правды — сам Битрикс: берём статус задачи у него, а не из присланного события
  const res = await bitrixCall<{ task?: { status?: string | number } }>("tasks.task.get", { taskId, select: ["ID", "STATUS"] });
  const raw = res?.task?.status;
  if (raw === undefined) return;
  const status = requestStatusFromBitrix(raw);
  if (status === req.status) return;
  await prisma.request.update({
    where: { id: req.id },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
}

export async function bindTaskEvents(): Promise<void> {
  const handler = `${portalBaseUrl()}/api/bitrix/events`;
  for (const event of ["onTaskUpdate"]) {
    try {
      await bitrixCall("event.bind", { event, handler });
    } catch (err) {
      // уже подписаны на этот адрес — это не ошибка
      if (!String((err as Error).message).includes("Handler already binded")) throw err;
    }
  }
}
