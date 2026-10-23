-- Заявка: id задачи в Битрикс24
ALTER TABLE "Request" ADD COLUMN "bitrixTaskId" TEXT;
CREATE INDEX "Request_bitrixTaskId_idx" ON "Request"("bitrixTaskId");

-- Подключение к Битрикс24 (токены в зашифрованном виде)
CREATE TABLE "BitrixConnection" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "memberId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "clientEndpoint" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "applicationToken" TEXT,
    "scope" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BitrixConnection_pkey" PRIMARY KEY ("id")
);
