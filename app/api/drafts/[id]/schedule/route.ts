import { NextRequest, NextResponse } from "next/server";
import { requireAppSecret } from "@/lib/auth";
import { schedulePosts } from "@/lib/postiz";
import { getClient, getDraft, updateContent, updateDraft } from "@/lib/store";
import { scheduleDraftSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = requireAppSecret(req);
  if (denied) return denied;

  const draft = await getDraft(params.id);
  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const client = await getClient(draft.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = scheduleDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await schedulePosts(client, draft.posts, parsed.data);
    const updated = await updateDraft(draft.id, {
      status: "scheduled",
      postizIds: result.ids,
      error: undefined,
    });
    await updateContent(draft.contentId, { status: "scheduled" });
    return NextResponse.json({ draft: updated, postiz: result.raw });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Schedule failed";
    await updateDraft(draft.id, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
