import { NextRequest, NextResponse } from "next/server";
import { requireAppSecret } from "@/lib/auth";
import { getDraft, updateDraft } from "@/lib/store";
import { updateDraftSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const draft = await getDraft(params.id);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ draft });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAppSecret(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = updateDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const draft = await updateDraft(params.id, parsed.data);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ draft });
}
