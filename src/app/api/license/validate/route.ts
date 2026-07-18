import { validateLicenseKey, formatRemaining } from "@/lib/license";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const key = body.key as string | undefined;
    const result = validateLicenseKey(key || "");

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          reason: result.reason,
          expiresAt: result.expiresAt?.toISOString() ?? null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      expiresAt: result.expiresAt?.toISOString(),
      remainingMs: result.remainingMs,
      remainingLabel: formatRemaining(result.remainingMs || 0),
    });
  } catch {
    return NextResponse.json(
      { valid: false, reason: "Requisição inválida" },
      { status: 400 }
    );
  }
}
