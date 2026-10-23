import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Шифрование токенов Битрикса (AES-256-GCM). Ключ берётся из BITRIX_TOKEN_KEY (любая длинная случайная строка).
function key(): Buffer {
  const secret = process.env.BITRIX_TOKEN_KEY;
  if (!secret || secret.length < 16) throw new Error("BITRIX_TOKEN_KEY не задан или слишком короткий");
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString("base64")).join(".");
}

export function decryptToken(payload: string): string {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
