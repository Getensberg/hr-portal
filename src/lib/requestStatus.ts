import { prisma } from "./prisma";

type Status = "PENDING" | "IN_PROGRESS" | "DONE";

// Единое место смены статуса заявки (из портала и из Битрикса): заодно подтверждает
// или снимает подтверждение с периода в календаре, если заявка его создала.
export async function setRequestStatus(id: string, status: Status) {
  const updated = await prisma.request.update({
    where: { id },
    // Если заявку вернули из «Готово», она снова появляется в списках (убирается из архива)
    data: { status, completedAt: status === "DONE" ? new Date() : null, ...(status !== "DONE" ? { archivedAt: null } : {}) },
  });
  await prisma.vacationEntry.updateMany({
    where: { requestId: id },
    data: { status: status === "DONE" ? "CONFIRMED" : "PLANNED" },
  });
  return updated;
}
