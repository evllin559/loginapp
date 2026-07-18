import { listMessageLogs } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prospectId = searchParams.get("prospectId");

  const logs = listMessageLogs(
    prospectId ? parseInt(prospectId, 10) : undefined
  );

  return NextResponse.json(logs);
}
