import { prisma } from "./prisma";
import { bitrixEnabled } from "./bitrix/client";
import { trySyncRequest } from "./bitrix/requests";

// Фоновые задачи портала. Приложение работает как один постоянный процесс, поэтому таймеры подходят.

const MIN = 60 * 1000;
const MAX_ATTEMPTS = 12; // при проверке раз в 5 минут это около часа попыток

// Заявки, по которым задачу в Битриксе создать не удалось (например, Битрикс был недоступен)
export async function retryFailedBitrixTasks() {
  if (!bitrixEnabled()) return;
  const since = new Date(Date.now() - 7 * 24 * 60 * MIN);
  const failed = await prisma.request.findMany({
    where: { bitrixTaskId: null, bitrixError: { not: null }, bitrixAttempts: { lt: MAX_ATTEMPTS }, requestedAt: { gt: since } },
    select: { id: true },
    orderBy: { requestedAt: "asc" },
    take: 20,
  });
  for (const r of failed) await trySyncRequest(r.id);
}

// Выполненные заявки старше нескольких месяцев уходят в архив (из списков скрываются, из базы не удаляются)
export async function archiveOldRequests() {
  const months = Number(process.env.REQUESTS_ARCHIVE_MONTHS) || 3;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  await prisma.request.updateMany({
    where: { archivedAt: null, status: "DONE", completedAt: { lt: cutoff } },
    data: { archivedAt: new Date() },
  });
}

async function safe(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[jobs] ${name}:`, err);
  }
}

export function startJobs() {
  const g = globalThis as { __jobsStarted?: boolean };
  if (g.__jobsStarted) return;
  g.__jobsStarted = true;

  setInterval(() => void safe("retry bitrix", retryFailedBitrixTasks), 5 * MIN).unref();
  setInterval(() => void safe("archive requests", archiveOldRequests), 6 * 60 * MIN).unref();
  setTimeout(() => void safe("archive requests", archiveOldRequests), MIN).unref();
}
