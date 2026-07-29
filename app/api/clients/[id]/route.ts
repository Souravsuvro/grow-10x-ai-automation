import { NextRequest, NextResponse } from "next/server";
import { requireAppSecret } from "@/lib/auth";
import { deleteClient, getClient, updateClient } from "@/lib/store";
import { updateClientSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const client = await getClient(params.id);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAppSecret(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const client = await updateClient(params.id, parsed.data);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ client });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = requireAppSecret(req);
  if (denied) return denied;

  const ok = await deleteClient(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
