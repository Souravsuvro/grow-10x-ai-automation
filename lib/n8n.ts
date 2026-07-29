import type { Client, SourceContent } from "./types";

export async function triggerN8nRepurpose(
  client: Client,
  content: SourceContent
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_WEBHOOK_URL is not set");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret) headers["x-webhook-secret"] = secret;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: content.id,
      client,
      content: {
        id: content.id,
        title: content.title,
        body: content.body,
      },
      callbackHint: "Update draft via Content Hub after workflow completes",
    }),
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep */
  }

  return { ok: res.ok, status: res.status, body };
}
