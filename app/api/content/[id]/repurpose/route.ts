import { NextRequest, NextResponse } from "next/server";
import { requireAppSecret } from "@/lib/auth";
import { repurposeWithGrok } from "@/lib/grok";
import { triggerN8nRepurpose } from "@/lib/n8n";
import { schedulePosts } from "@/lib/postiz";
import {
  createDraft,
  getClient,
  getContent,
  updateContent,
  updateDraft,
} from "@/lib/store";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = requireAppSecret(req);
  if (denied) return denied;

  const content = await getContent(params.id);
  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const client = await getClient(content.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const mode = (process.env.REPURPOSE_MODE || "direct").toLowerCase();

  await updateContent(content.id, { status: "repurposing", error: undefined });

  try {
    if (mode === "n8n") {
      const result = await triggerN8nRepurpose(client, content);
      if (!result.ok) {
        await updateContent(content.id, {
          status: "failed",
          error: `n8n webhook failed (${result.status})`,
        });
        return NextResponse.json(
          { error: "n8n webhook failed", details: result.body },
          { status: 502 }
        );
      }
      await updateContent(content.id, { status: "repurposing" });
      return NextResponse.json({
        mode: "n8n",
        message: "Webhook triggered; drafts will appear when the workflow posts back or you sync manually.",
        n8n: result.body,
      });
    }

    const result = await repurposeWithGrok(client, content);
    const draft = await createDraft({
      contentId: content.id,
      clientId: client.id,
      posts: result.posts,
      summary: result.summary,
      status: "ready",
    });

    let scheduled = null;
    let finalDraft = draft;
    if (client.scheduleDefaults?.autoSchedule) {
      try {
        const push = await schedulePosts(client, result.posts);
        await updateContent(content.id, { status: "scheduled" });
        scheduled = push;
        finalDraft =
          (await updateDraft(draft.id, {
            status: "scheduled",
            postizIds: push.ids,
          })) || draft;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Schedule failed";
        await updateContent(content.id, { status: "ready", error: message });
        return NextResponse.json({
          mode: "direct",
          draft,
          scheduleError: message,
        });
      }
    } else {
      await updateContent(content.id, { status: "ready" });
    }

    return NextResponse.json({ mode: "direct", draft: finalDraft, scheduled });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Repurpose failed";
    await updateContent(content.id, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
