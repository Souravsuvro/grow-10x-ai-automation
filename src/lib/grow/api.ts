import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type ClientRow = {
  id: number;
  slug: string;
  business_name: string;
  business_category: string;
  audience: string;
  locations: string;
  brand_voice: string;
  platforms: string;
};

export type ContentRow = {
  id: number;
  client_id: number;
  business_name: string;
  campaign: string;
  source_model: string;
  content_type: string;
  topic: string;
  raw_content: string;
  summary: string;
  status: string;
  platform: string;
  audience: string;
  location_target: string;
  priority: string;
  approval_status: string;
  created_at: string;
};

export type DraftRow = {
  id: number;
  content_id: number;
  platform: string;
  variant_label: string;
  copy: string;
  suggested_time: string;
  seo_score: number;
  recommended: boolean;
  notes: string;
  topic: string;
  business_name: string;
};

export type SlotRow = {
  id: number;
  draft_id: number;
  client_id: number;
  platform: string;
  publish_at: string;
  status: string;
  business_name: string;
  topic: string;
  copy: string;
};

export type ImageRow = {
  id: number;
  title: string;
  caption: string;
  page_path: string;
  image_path: string;
  business_name: string;
};

const PLATFORMS = ["linkedin", "instagram", "x", "facebook", "tiktok", "youtube"] as const;

export const listOverview = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const [clients, byStatus, recent, logs] = await Promise.all([
    sql<{ n: number }>`select count(*)::int as n from clients`,
    sql<{ status: string; n: number }>`select status, count(*)::int as n from content_items group by status`,
    sql<ContentRow>`
      select i.id, i.client_id, c.business_name, i.campaign, i.source_model, i.content_type,
             i.topic, i.raw_content, i.summary, i.status, i.platform, i.audience,
             i.location_target, i.priority, i.approval_status,
             to_char(i.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from content_items i
      join clients c on c.id = i.client_id
      order by i.id desc
      limit 6
    `,
    sql<{ id: number; event: string; detail: string; created_at: string }>`
      select id, event, detail,
             to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from activity_logs order by id desc limit 8
    `,
  ]);
  const queued = await sql<{ n: number }>`select count(*)::int as n from schedule_slots where status <> 'published'`;
  return {
    clientCount: clients[0]?.n ?? 0,
    queued: queued[0]?.n ?? 0,
    byStatus,
    recent,
    logs,
    model: "grok-4.5",
    db: process.env.DATABASE_URL ? "neon" : "pglite",
  };
});

export const listClients = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<ClientRow>`
    select id, slug, business_name, business_category, audience, locations, brand_voice, platforms
    from clients order by id
  `;
});

export const createClient = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as Partial<ClientRow>;
    const name = String(d.business_name ?? "").trim();
    if (name.length < 2 || name.length > 80) throw new Error("Business name is required");
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    return {
      slug: slug || `studio-${Date.now()}`,
      business_name: name,
      business_category: String(d.business_category ?? "General").trim().slice(0, 80),
      audience: String(d.audience ?? "Local customers").trim().slice(0, 160),
      locations: String(d.locations ?? "Local").trim().slice(0, 160),
      brand_voice: String(d.brand_voice ?? "Clear and specific").trim().slice(0, 160),
      platforms: String(d.platforms ?? "linkedin,instagram").trim().slice(0, 120),
    };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<ClientRow>`
      insert into clients (slug, business_name, business_category, audience, locations, brand_voice, platforms)
      values (${data.slug}, ${data.business_name}, ${data.business_category}, ${data.audience}, ${data.locations}, ${data.brand_voice}, ${data.platforms})
      on conflict (slug) do update set business_name = excluded.business_name
      returning id, slug, business_name, business_category, audience, locations, brand_voice, platforms
    `;
    await sql`insert into activity_logs (event, detail) values ('client', ${`Added ${data.business_name}`})`;
    return rows[0];
  });

export const listContent = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const items = await sql<ContentRow>`
    select i.id, i.client_id, c.business_name, i.campaign, i.source_model, i.content_type,
           i.topic, i.raw_content, i.summary, i.status, i.platform, i.audience,
           i.location_target, i.priority, i.approval_status,
           to_char(i.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
    from content_items i
    join clients c on c.id = i.client_id
    order by i.id desc
  `;
  const drafts = await sql<DraftRow>`
    select d.id, d.content_id, d.platform, d.variant_label, d.copy, d.suggested_time,
           d.seo_score, d.recommended, d.notes, i.topic, c.business_name
    from drafts d
    join content_items i on i.id = d.content_id
    join clients c on c.id = i.client_id
    order by d.recommended desc, d.id desc
  `;
  return { items, drafts };
});

export const intakeContent = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as {
      clientId?: number;
      topic?: string;
      raw?: string;
      platform?: string;
      contentType?: string;
      campaign?: string;
    };
    const clientId = Number(d.clientId);
    const topic = String(d.topic ?? "").trim();
    const raw = String(d.raw ?? "").trim();
    if (!Number.isFinite(clientId)) throw new Error("Pick a client");
    if (topic.length < 2) throw new Error("Topic is required");
    if (raw.length < 12 || raw.length > 8000) throw new Error("Source needs a real paragraph");
    const platform = PLATFORMS.includes(d.platform as (typeof PLATFORMS)[number])
      ? String(d.platform)
      : "linkedin";
    return {
      clientId,
      topic: topic.slice(0, 120),
      raw,
      platform,
      contentType: String(d.contentType ?? "text").slice(0, 40),
      campaign: String(d.campaign ?? "general").slice(0, 80),
    };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const client = await sql<ClientRow>`select id, audience, locations from clients where id = ${data.clientId}`;
    if (!client[0]) throw new Error("Client not found");
    const rows = await sql<{ id: number }>`
      insert into content_items
        (client_id, campaign, source_model, content_type, topic, raw_content, summary, status, platform, audience, location_target, priority, approval_status)
      values
        (${data.clientId}, ${data.campaign}, 'intake', ${data.contentType}, ${data.topic}, ${data.raw}, '', 'source', ${data.platform}, ${client[0].audience}, ${client[0].locations}, 'medium', 'pending')
      returning id
    `;
    await sql`insert into activity_logs (event, detail) values ('intake', ${data.topic})`;
    return { id: rows[0].id };
  });

type Variant = {
  label: string;
  copy: string;
  suggestedTime: string;
  seoScore: number;
  recommended: boolean;
  notes: string;
};

function localVariants(platform: string, topic: string, raw: string, location: string): Variant[] {
  const line = raw.replace(/\s+/g, " ").slice(0, 220);
  return [
    {
      label: "A",
      copy: `${location}: ${line}`,
      suggestedTime: "Tue 08:30",
      seoScore: 72,
      recommended: true,
      notes: "Local opener. AI was unavailable, so this is a structured draft, not a model reply.",
    },
    {
      label: "B",
      copy: `${topic}. ${line} Save this if you are nearby.`,
      suggestedTime: "Thu 12:10",
      seoScore: 68,
      recommended: false,
      notes: `Formatted for ${platform}. Review before approving.`,
    },
    {
      label: "C",
      copy: `One specific offer, one place, one next step. ${line}`,
      suggestedTime: "Sat 09:00",
      seoScore: 70,
      recommended: false,
      notes: "CTA-led variant.",
    },
  ];
}

function parseVariants(text: string): Variant[] | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    const body = JSON.parse(cleaned.slice(start, end + 1)) as { variants?: Variant[] };
    if (!Array.isArray(body.variants) || body.variants.length === 0) return null;
    return body.variants.slice(0, 3).map((v, i) => ({
      label: String(v.label || String.fromCharCode(65 + i)).slice(0, 8),
      copy: String(v.copy || "").slice(0, 2000),
      suggestedTime: String(v.suggestedTime || "Tue 09:00").slice(0, 40),
      seoScore: Math.max(0, Math.min(100, Number(v.seoScore) || 70)),
      recommended: Boolean(v.recommended) || i === 0,
      notes: String(v.notes || "").slice(0, 400),
    }));
  } catch {
    return null;
  }
}

export const generateDrafts = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { contentId?: number };
    const contentId = Number(d.contentId);
    if (!Number.isFinite(contentId)) throw new Error("Pick a piece of source content");
    return { contentId };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<ContentRow & { brand_voice: string; business_category: string }>`
      select i.id, i.client_id, c.business_name, c.brand_voice, c.business_category,
             i.campaign, i.source_model, i.content_type, i.topic, i.raw_content, i.summary,
             i.status, i.platform, i.audience, i.location_target, i.priority, i.approval_status,
             to_char(i.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from content_items i
      join clients c on c.id = i.client_id
      where i.id = ${data.contentId}
    `;
    const item = rows[0];
    if (!item) throw new Error("Content not found");

    const rules: Record<string, string> = {
      linkedin: "120-220 words, professional, one concrete claim, no hashtag spam, location in the first two lines.",
      instagram: "under 120 words, sensory, one location hook, 3 relevant hashtags max at the end.",
      x: "under 250 characters, one sharp line, no thread unless asked.",
      facebook: "conversational, neighborhood specific, a clear next step.",
      tiktok: "spoken hook in the first sentence, on-screen caption style, under 80 words.",
      youtube: "title under 70 characters plus a 2-sentence description with the location keyword.",
    };

    let variants: Variant[] | null = null;
    let model = "structured-fallback";
    const apiKey = process.env.XAI_API_KEY;
    if (apiKey) {
      const prompt = [
        "You write platform-native social drafts. Return JSON only.",
        `Client: ${item.business_name}`,
        `Category: ${item.business_category}`,
        `Audience: ${item.audience}`,
        `Location: ${item.location_target}`,
        `Voice: ${item.brand_voice}`,
        `Platform: ${item.platform}`,
        `Rules: ${rules[item.platform] ?? rules.linkedin}`,
        `Topic: ${item.topic}`,
        `Source: ${item.raw_content.slice(0, 3500)}`,
        'Schema: {"variants":[{"label":"A","copy":"...","suggestedTime":"Tue 08:30","seoScore":80,"recommended":true,"notes":"why this fits the platform"}]}',
        "Write exactly 3 variants. One recommended. No scare tactics. No invented prices.",
      ].join("\n");

      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 900,
          temperature: 0.6,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        variants = parseVariants(body.choices?.[0]?.message?.content ?? "");
        if (variants) model = "grok-4.5";
      }
    }
    if (!variants) variants = localVariants(item.platform, item.topic, item.raw_content, item.location_target);

    await sql`delete from drafts where content_id = ${item.id}`;
    for (const v of variants) {
      if (!v.copy.trim()) continue;
      await sql`
        insert into drafts (content_id, platform, variant_label, copy, suggested_time, seo_score, recommended, notes)
        values (${item.id}, ${item.platform}, ${v.label}, ${v.copy}, ${v.suggestedTime}, ${v.seoScore}, ${v.recommended}, ${v.notes})
      `;
    }
    const summary = variants.find((v) => v.recommended)?.copy.slice(0, 180) ?? "";
    await sql`
      update content_items
      set status = 'drafted', summary = ${summary}, source_model = ${model}, approval_status = 'pending'
      where id = ${item.id}
    `;
    await sql`insert into activity_logs (event, detail) values ('draft', ${`${model} drafted ${item.topic}`})`;
    return { model, count: variants.length };
  });

export const setApproval = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { contentId?: number; decision?: string };
    const contentId = Number(d.contentId);
    const decision = d.decision === "approved" ? "approved" : "pending";
    if (!Number.isFinite(contentId)) throw new Error("Missing content");
    return { contentId, decision };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const status = data.decision === "approved" ? "approved" : "drafted";
    await sql`
      update content_items
      set approval_status = ${data.decision}, status = ${status}
      where id = ${data.contentId}
    `;
    await sql`insert into activity_logs (event, detail) values ('approval', ${`#${data.contentId} ${data.decision}`})`;
    return { ok: true };
  });

export const scheduleDraft = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { draftId?: number; dayOffset?: number };
    const draftId = Number(d.draftId);
    const dayOffset = Math.max(0, Math.min(6, Number(d.dayOffset ?? 1)));
    if (!Number.isFinite(draftId)) throw new Error("Pick a draft");
    return { draftId, dayOffset };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const drafts = await sql<{ id: number; platform: string; client_id: number; approval_status: string }>`
      select d.id, d.platform, i.client_id, i.approval_status
      from drafts d join content_items i on i.id = d.content_id
      where d.id = ${data.draftId}
    `;
    const draft = drafts[0];
    if (!draft) throw new Error("Draft not found");
    if (draft.approval_status !== "approved") throw new Error("Approve the piece before scheduling");
    const when = new Date(Date.now() + data.dayOffset * 86400000);
    when.setUTCHours(15, 15, 0, 0);
    await sql`
      insert into schedule_slots (draft_id, client_id, platform, publish_at, status)
      values (${draft.id}, ${draft.client_id}, ${draft.platform}, ${when.toISOString()}, 'queued')
    `;
    await sql`update content_items set status = 'scheduled' where id = (select content_id from drafts where id = ${draft.id})`;
    await sql`insert into activity_logs (event, detail) values ('schedule', ${`Draft ${draft.id} queued`})`;
    return { ok: true };
  });

export const listSchedule = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<SlotRow>`
    select s.id, s.draft_id, s.client_id, s.platform, s.status,
           to_char(s.publish_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as publish_at,
           c.business_name, i.topic, d.copy
    from schedule_slots s
    join clients c on c.id = s.client_id
    join drafts d on d.id = s.draft_id
    join content_items i on i.id = d.content_id
    order by s.publish_at
  `;
});

export const markPublished = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = Number((input as { id?: number }).id);
    if (!Number.isFinite(id)) throw new Error("Missing slot");
    return { id };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update schedule_slots set status = 'published' where id = ${data.id}`;
    await sql`
      update content_items set status = 'published', approval_status = 'approved'
      where id = (
        select d.content_id from schedule_slots s join drafts d on d.id = s.draft_id where s.id = ${data.id}
      )
    `;
    await sql`insert into activity_logs (event, detail) values ('publish', ${`Slot ${data.id} marked published`})`;
    return { ok: true };
  });

export const analytics = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const platforms = await sql<{ platform: string; n: number }>`
    select platform, count(*)::int as n from content_items group by platform order by n desc
  `;
  const scores = await sql<{ platform: string; avg: number }>`
    select platform, coalesce(round(avg(seo_score))::int, 0) as avg from drafts group by platform
  `;
  const funnel = await sql<{ status: string; n: number }>`
    select status, count(*)::int as n from content_items group by status
  `;
  return { platforms, scores, funnel };
});

export const listImages = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<ImageRow>`
    select a.id, a.title, a.caption, a.page_path, a.image_path, c.business_name
    from image_assets a join clients c on c.id = a.client_id
    order by a.id
  `;
});

export const exportPrompt = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const contentId = Number((input as { contentId?: number }).contentId);
    if (!Number.isFinite(contentId)) throw new Error("Pick content");
    return { contentId };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      business_name: string;
      business_category: string;
      audience: string;
      location_target: string;
      brand_voice: string;
      platform: string;
      topic: string;
      raw_content: string;
    }>`
      select c.business_name, c.business_category, i.audience, i.location_target, c.brand_voice,
             i.platform, i.topic, i.raw_content
      from content_items i join clients c on c.id = i.client_id
      where i.id = ${data.contentId}
    `;
    const item = rows[0];
    if (!item) throw new Error("Content not found");
    const text = [
      "Write 3 social variants. Follow the platform's native format.",
      `Client: ${item.business_name}`,
      `Category: ${item.business_category}`,
      `Audience: ${item.audience}`,
      `Location: ${item.location_target}`,
      `Voice: ${item.brand_voice}`,
      `Platform: ${item.platform}`,
      `Topic: ${item.topic}`,
      `Source: ${item.raw_content}`,
      "Return the best version first, a suggested local publish time, and one line on why it fits the platform.",
    ].join("\n");
    return { text };
  });

