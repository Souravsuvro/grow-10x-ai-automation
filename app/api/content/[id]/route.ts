import { NextRequest, NextResponse } from "next/server";
import { requireAppSecret } from "@/lib/auth";
import { deleteContent, getContent, listDrafts } from "@/lib/store";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const content = await getContent(params.id);
  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const drafts = await listDrafts(params.id);
  return NextResponse.json({ content, drafts });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = requireAppSecret(req);
  if (denied) return denied;

  const ok = await deleteContent(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
