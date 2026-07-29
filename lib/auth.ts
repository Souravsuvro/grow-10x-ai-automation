import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function secretsEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function getAppSecret(): string {
  return process.env.APP_SECRET || "dev-insecure-secret";
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Require x-app-secret on mutating requests. */
export function requireAppSecret(req: NextRequest): NextResponse | null {
  const expected = getAppSecret();
  const provided = req.headers.get("x-app-secret") || "";
  if (!provided || !secretsEqual(provided, expected)) {
    return unauthorized();
  }
  return null;
}
