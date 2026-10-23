import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "./crypto";

// Обращения к REST API Битрикс24 от имени приложения (OAuth).
// Секрет приложения и ключ шифрования берутся из переменных окружения, токены лежат в базе в зашифрованном виде.

const OAUTH_URL = process.env.BITRIX_OAUTH_URL || "https://oauth.bitrix.info/oauth/token/";

export function bitrixEnabled(): boolean {
  return Boolean(process.env.BITRIX_CLIENT_ID && process.env.BITRIX_CLIENT_SECRET && process.env.BITRIX_TOKEN_KEY && process.env.BITRIX_DOMAIN);
}

export function portalBaseUrl(): string {
  return (process.env.APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  clientEndpoint: string;
  domain: string;
  memberId: string;
  scope?: string | null;
  applicationToken?: string | null;
}

export async function saveConnection(t: TokenSet) {
  const data = {
    memberId: t.memberId,
    domain: t.domain,
    clientEndpoint: t.clientEndpoint,
    accessTokenEnc: encryptToken(t.accessToken),
    refreshTokenEnc: encryptToken(t.refreshToken),
    expiresAt: t.expiresAt,
    scope: t.scope ?? null,
    ...(t.applicationToken ? { applicationToken: t.applicationToken } : {}),
  };
  await prisma.bitrixConnection.upsert({ where: { id: "main" }, update: data, create: { id: "main", ...data } });
}

async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const url = new URL(OAUTH_URL);
  url.searchParams.set("grant_type", "refresh_token");
  url.searchParams.set("client_id", process.env.BITRIX_CLIENT_ID as string);
  url.searchParams.set("client_secret", process.env.BITRIX_CLIENT_SECRET as string);
  url.searchParams.set("refresh_token", refreshToken);

  const res = await fetch(url, { method: "GET" });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.access_token) {
    throw new Error(`Не удалось обновить токен Битрикса: ${json?.error_description || json?.error || res.status}`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + Number(json.expires_in ?? 3600) * 1000),
    clientEndpoint: json.client_endpoint,
    domain: String(json.client_endpoint).replace(/^https?:\/\//, "").split("/")[0],
    memberId: json.member_id,
    scope: json.scope,
  };
}

async function getAccessToken(forceRefresh = false): Promise<{ token: string; endpoint: string }> {
  const conn = await prisma.bitrixConnection.findUnique({ where: { id: "main" } });
  if (!conn) throw new Error("Приложение Битрикса ещё не установлено");

  // обновляем заранее, за минуту до истечения
  if (forceRefresh || conn.expiresAt.getTime() - Date.now() < 60_000) {
    const fresh = await refreshTokens(decryptToken(conn.refreshTokenEnc));
    await saveConnection({ ...fresh, domain: conn.domain });
    return { token: fresh.accessToken, endpoint: fresh.clientEndpoint };
  }
  return { token: decryptToken(conn.accessTokenEnc), endpoint: conn.clientEndpoint };
}

// Вызов метода REST. При устаревшем токене один раз обновляет его и повторяет запрос.
export async function bitrixCall<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { token, endpoint } = await getAccessToken(attempt > 0);
    const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
    const res = await fetch(`${base}${method}.json?auth=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => null);
    if (json?.error === "expired_token" || res.status === 401) {
      if (attempt === 0) continue;
    }
    if (!res.ok || json?.error) {
      throw new Error(`Битрикс ${method}: ${json?.error_description || json?.error || res.status}`);
    }
    return json.result as T;
  }
  throw new Error(`Битрикс ${method}: не удалось выполнить запрос`);
}

// Проверка токена, пришедшего при установке: спрашиваем сам Битрикс, чей это токен.
export async function verifyInstallToken(domain: string, accessToken: string): Promise<boolean> {
  if (domain.toLowerCase() !== String(process.env.BITRIX_DOMAIN).toLowerCase()) return false;
  try {
    const res = await fetch(`https://${domain}/rest/app.info.json?auth=${encodeURIComponent(accessToken)}`);
    const json = await res.json();
    return Boolean(json?.result);
  } catch {
    return false;
  }
}
