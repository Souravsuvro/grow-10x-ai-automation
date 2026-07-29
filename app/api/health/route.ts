import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "grow-10x-content-hub",
    mode: process.env.REPURPOSE_MODE || "direct",
    hasXai: Boolean(process.env.XAI_API_KEY),
    hasPostiz: Boolean(process.env.POSTIZ_API_KEY),
    hasN8n: Boolean(process.env.N8N_WEBHOOK_URL),
  });
}
