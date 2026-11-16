-- Заявка: ошибка и число попыток создания задачи в Битриксе, дата архивации
ALTER TABLE "Request" ADD COLUMN "bitrixError" TEXT;
ALTER TABLE "Request" ADD COLUMN "bitrixAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Request" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Request_archivedAt_idx" ON "Request"("archivedAt");
