# Сборка и запуск портала в Docker (Timeweb Cloud App Platform или любой Docker-хостинг).
# Версия Node: не ниже 24.22.1 (в образе node:24-slim всегда свежий патч ветки 24).
FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# 1. Зависимости
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
  # скрипты установки отключены, поэтому движок миграций Prisma скачиваем отдельно
  && node node_modules/@prisma/engines/scripts/postinstall.js

# 2. Сборка (адреса базы здесь фиктивные: во время сборки к базе никто не подключается)
FROM deps AS build
COPY . .
# Публичные ссылки (соцсети, чаты) вшиваются в сайт при сборке: передайте их как переменные сборки
ARG NEXT_PUBLIC_TELEGRAM_CHAT_URL
ARG NEXT_PUBLIC_TELEGRAM_AI_BOT_URL
ARG NEXT_PUBLIC_SOCIAL_VK_URL
ARG NEXT_PUBLIC_SOCIAL_TELEGRAM_URL
ARG NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL
ARG NEXT_PUBLIC_SOCIAL_WEBSITE_URL
ENV NEXT_PUBLIC_TELEGRAM_CHAT_URL=$NEXT_PUBLIC_TELEGRAM_CHAT_URL \
    NEXT_PUBLIC_TELEGRAM_AI_BOT_URL=$NEXT_PUBLIC_TELEGRAM_AI_BOT_URL \
    NEXT_PUBLIC_SOCIAL_VK_URL=$NEXT_PUBLIC_SOCIAL_VK_URL \
    NEXT_PUBLIC_SOCIAL_TELEGRAM_URL=$NEXT_PUBLIC_SOCIAL_TELEGRAM_URL \
    NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL=$NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL \
    NEXT_PUBLIC_SOCIAL_WEBSITE_URL=$NEXT_PUBLIC_SOCIAL_WEBSITE_URL
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    DIRECT_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

# 3. Запуск
FROM base AS run
ENV NODE_ENV=production \
    PORT=3000
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
# Сначала применяются миграции базы (prisma migrate deploy), затем стартует сайт
CMD ["npm", "run", "start:prod"]
