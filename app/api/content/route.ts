import { NextRequest, NextResponse } from "next/server";
import { requireAppSecret } from "@/lib/auth";
import { createContent, getClient, listContent } from "@/lib/store";
import { createContentSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId") || undefined;
  const content = await listContent(clientId);
  return NextResponse.json({ content });
}

export async function POST(req: NextRequest) {
  const denied = requireAppSecret(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = createContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const client = await getClient(parsed.data.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const item = await createContent(parsed.data);
  return NextResponse.json({ content: item }, { status: 201 });
}
