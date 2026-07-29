import type { Client, GeneratedPost, Platform } from "./types";

function postizBase(): string {
  const base = (process.env.POSTIZ_BASE_URL || "http://localhost:4007").replace(
    /\/$/,
    ""
  );
  // Cloud uses api.postiz.com/public/v1; self-host uses {host}/public/v1
  if (base.includes("api.postiz.com")) {
    return `${base}/public/v1`;
  }
  return `${base}/public/v1`;
}

function apiKey(): string {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new Error("POSTIZ_API_KEY is not set");
  return key;
}

export async function listIntegrations(): Promise<unknown> {
  const res = await fetch(`${postizBase()}/integrations`, {
    headers: { Authorization: apiKey() },
  });
  if (!res.ok) {
    throw new Error(`Postiz integrations error ${res.status}`);
  }
  return res.json();
}

function settingsFor(platform: Platform): Record<string, unknown> {
  switch (platform) {
    case "x":
      return { __type: "x", who_can_reply_post: "everyone" };
    case "linkedin":
      return { __type: "linkedin" };
    case "instagram":
      return { __type: "instagram", post_type: "post" };
    case "threads":
      return { __type: "threads" };
    case "tiktok":
      return {
        __type: "tiktok",
        privacy_level: "PUBLIC_TO_EVERYONE",
        content_posting_method: "UPLOAD",
      };
    case "youtube":
      return {
        __type: "youtube",
        title: "Untitled",
        type: "public",
        selfDeclaredMadeForKids: "no",
      };
    case "facebook":
      return { __type: "facebook" };
    case "bluesky":
      return { __type: "bluesky" };
    case "reddit":
      return { __type: "reddit", subreddit: [] };
    default:
      return { __type: platform };
  }
}

function nextPreferredDate(client: Client): string {
  const hours = client.scheduleDefaults?.preferredHours?.length
    ? client.scheduleDefaults.preferredHours
    : [9, 12, 17];
  const now = new Date();
  const candidate = new Date(now.getTime() + 60 * 60 * 1000);
  const hour = hours[0] ?? 9;
  candidate.setUTCHours(hour, 0, 0, 0);
  if (candidate <= now) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate.toISOString();
}

export async function schedulePosts(
  client: Client,
  posts: GeneratedPost[],
  options?: { type?: "schedule" | "now"; date?: string }
): Promise<{ ids: string[]; raw: unknown }> {
  const integrationMap = new Map(
    client.platforms
      .filter((p) => p.enabled && p.postizIntegrationId)
      .map((p) => [p.platform, p.postizIntegrationId!])
  );

  const payloadPosts = posts
    .map((post) => {
      const integrationId = integrationMap.get(post.platform);
      if (!integrationId) return null;
      let content = post.content;
      if (post.hashtags?.length) {
        content = `${content}\n\n${post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
      }
      if (post.cta) content = `${content}\n\n${post.cta}`;

      const settings = settingsFor(post.platform);
      if (post.platform === "youtube" && post.title) {
        settings.title = post.title;
      }

      return {
        integration: { id: integrationId },
        value: [{ content, image: [] as unknown[] }],
        settings,
      };
    })
    .filter(Boolean);

  if (!payloadPosts.length) {
    throw new Error(
      "No posts mapped to Postiz integration IDs. Set postizIntegrationId on client platforms."
    );
  }

  const body = {
    type: options?.type || "schedule",
    date: options?.date || nextPreferredDate(client),
    shortLink: false,
    tags: [] as unknown[],
    posts: payloadPosts,
  };

  const res = await fetch(`${postizBase()}/posts`, {
    method: "POST",
    headers: {
      Authorization: apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  let raw: unknown = rawText;
  try {
    raw = JSON.parse(rawText);
  } catch {
    /* keep text */
  }

  if (!res.ok) {
    throw new Error(`Postiz schedule error ${res.status}: ${rawText.slice(0, 400)}`);
  }

  const ids: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === "object" && "id" in item) {
        ids.push(String((item as { id: string }).id));
      }
    }
  } else if (raw && typeof raw === "object" && "id" in (raw as object)) {
    ids.push(String((raw as { id: string }).id));
  }

  return { ids, raw };
}
