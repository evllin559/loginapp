import { generateLicenseKey } from "@/lib/license";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Gera uma chave de trial de 1 hora.
 * Em produção, proteja este endpoint (desabilitado por padrão se LICENSE_GENERATE_ENABLED != true).
 */
export async function POST(request: NextRequest) {
  const enabled =
    process.env.LICENSE_GENERATE_ENABLED === "true" ||
    process.env.NODE_ENV !== "production";

  if (!enabled) {
    return NextResponse.json(
      { error: "Geração de chave desabilitada neste ambiente" },
      { status: 403 }
    );
  }

  let hours = 1;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.hours && typeof body.hours === "number") {
      hours = Math.min(Math.max(body.hours, 0.1), 24);
    }
  } catch {
    // ignore
  }

  const license = generateLicenseKey(hours);
  return NextResponse.json({
    key: license.key,
    expiresAt: license.expiresAtIso,
    validityHours: hours,
    note: "Chave válida por 1 hora a partir da geração. Uma chave por sessão Windows.",
  });
}
