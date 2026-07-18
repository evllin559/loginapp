import crypto from "crypto";

const LICENSE_SECRET =
  process.env.LICENSE_SECRET || "prospeccao-whatsapp-trial-secret-2026";

export interface LicensePayload {
  exp: number; // unix timestamp (seconds)
  iat: number;
  plan: "trial-1h";
}

export interface LicenseValidation {
  valid: boolean;
  reason?: string;
  expiresAt?: Date;
  remainingMs?: number;
}

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(data: string): string {
  return base64url(
    crypto.createHmac("sha256", LICENSE_SECRET).update(data).digest()
  );
}

/** Gera uma chave de licença válida por `hours` horas (padrão: 1). */
export function generateLicenseKey(hours = 1): {
  key: string;
  expiresAt: Date;
  expiresAtIso: string;
} {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + Math.floor(hours * 3600);
  const payload: LicensePayload = { exp, iat, plan: "trial-1h" };
  const body = base64url(JSON.stringify(payload));
  const signature = sign(body);
  const key = `PW1H.${body}.${signature}`;
  const expiresAt = new Date(exp * 1000);
  return {
    key,
    expiresAt,
    expiresAtIso: expiresAt.toISOString(),
  };
}

export function validateLicenseKey(key: string): LicenseValidation {
  if (!key || typeof key !== "string") {
    return { valid: false, reason: "Chave não informada" };
  }

  const trimmed = key.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== "PW1H") {
    return { valid: false, reason: "Formato de chave inválido" };
  }

  const [, body, signature] = parts;
  const expected = sign(body);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: "Assinatura inválida" };
  }

  try {
    const payload = JSON.parse(fromBase64url(body).toString("utf8")) as LicensePayload;
    if (!payload.exp || typeof payload.exp !== "number") {
      return { valid: false, reason: "Payload inválido" };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date(payload.exp * 1000);

    if (now >= payload.exp) {
      return {
        valid: false,
        reason: "Chave expirada (válida por 1 hora)",
        expiresAt,
        remainingMs: 0,
      };
    }

    return {
      valid: true,
      expiresAt,
      remainingMs: (payload.exp - now) * 1000,
    };
  } catch {
    return { valid: false, reason: "Não foi possível ler a chave" };
  }
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
