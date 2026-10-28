import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

const DESKS = ["research", "copy", "visual", "ads", "video", "social", "comments", "engage"] as const;
type Desk = (typeof DESKS)[number];

type ClientBits = {
  id: number;
  business_name: string;
  business_category: string;
  audience: string;
  locations: string;
  brand_voice: string;
};

export type AssistRun = {
  id: number;
  desk: string;
  lane: string;
  prompt: string;
  result: string;
  media_url: string;
  media_kind: string;
  job_id: string;
  status: string;
  business_name: string;
  created_at: string;
};

const TASKS: Record<Desk, string> = {
  research:
    "Write a research brief: a short answer, five claims the reader should verify, and three angles. Do not invent citations or statistics.",
  copy: "Rewrite the brief as a headline, a 40-word paragraph, and a 120-word version. Cut filler.",
  visual:
    "Describe one still: subject, light, palette, lens, and what to leave out. No readable text in the picture.",
  ads: "Write three ads (headline plus about 20 words). Then an optimization pass: hook, offer, proof, call to action, and the one line to cut. Do not invent prices, offers, or performance numbers.",
  video: "Write a 6-second vertical spot: shot, on-screen text, spoken line, and end card.",
  social: "Write one native post, a first comment, and a one-line share card. Do not claim it is already published.",
  comments:
    "The brief is a public comment. Write three replies: warm, direct, and a question. Do not promise refunds or invent policy.",
  engage:
    "Write a seven-day engagement plan, one action a day. Nothing posts itself. No bulk replies.",
};

const ASPECTS = ["1:1", "9:16", "16:9"] as const;
type Aspect = (typeof ASPECTS)[number];

function isDesk(value: string): value is Desk {
  return (DESKS as readonly string[]).includes(value);
}

function isAspect(value: string): value is Aspect {
  return (ASPECTS as readonly string[]).includes(value);
}

function freePack(desk: Desk, client: ClientBits, brief: string) {
  return [
    `Client: ${client.business_name}`,
    `Category: ${client.business_category}`,
    `Audience: ${client.audience}`,
    `Location: ${client.locations}`,
    `Voice: ${client.brand_voice}`,
    `Brief: ${brief}`,
    "",
    `Task: ${TASKS[desk]}`,
    "",
    "This is a free pack, not a model reply. Paste it into Perplexity, ChatGPT, or Midjourney. This app does not call those services.",
  ].join("\n");
}

function grokPrompt(desk: Desk, client: ClientBits, brief: string) {
  return [
    `You are writing for ${client.business_name}, a ${client.business_category} brand.`,
    `Audience: ${client.audience}`,
    `Location: ${client.locations}`,
    `Voice: ${client.brand_voice}`,
    `Task: ${TASKS[desk]}`,
    `Brief: ${brief}`,
  ].join("\n");
}

async function xai(path: string, key: string, body?: unknown, method = "POST") {
  const run = () =>
    fetch(`https://api.x.ai${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  let res = await run();
  if (res.status === 429 || res.status >= 500) res = await run();
  return res;
}

export const listAssist = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<AssistRun>`
    select r.id, r.desk, r.lane, r.prompt, r.result, r.media_url, r.media_kind, r.job_id, r.status,
           c.business_name,
           to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
    from assist_runs r
    join clients c on c.id = r.client_id
    order by r.id desc
    limit 12
  `;
});

export const runAssist = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { desk?: string; lane?: string; clientId?: number; brief?: string; aspect?: string };
    const desk = String(d.desk ?? "");
    if (!isDesk(desk)) throw new Error("Pick a desk");
    const lane = d.lane === "grok" ? "grok" : "free";
    const clientId = Number(d.clientId);
    const brief = String(d.brief ?? "").trim();
    if (!Number.isFinite(clientId)) throw new Error("Pick a studio");
    if (brief.length < 8 || brief.length > 2000) throw new Error("Brief needs a real sentence");
    const aspect: Aspect = isAspect(String(d.aspect ?? "")) ? (d.aspect as Aspect) : desk === "video" ? "9:16" : "1:1";
    return { desk, lane, clientId, brief, aspect };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const clients = await sql<ClientBits>`
      select id, business_name, business_category, audience, locations, brand_voice
      from clients where id = ${data.clientId}
    `;
    const client = clients[0];
    if (!client) throw new Error("Studio not found");

    if (data.lane === "free") {
      const result = freePack(data.desk, client, data.brief);
      const rows = await sql<{ id: number }>`
        insert into assist_runs (client_id, desk, lane, prompt, result, status)
        values (${client.id}, ${data.desk}, 'free', ${data.brief}, ${result}, 'ready')
        returning id
      `;
      await sql`insert into activity_logs (event, detail) values ('assist', ${`Free ${data.desk} pack for ${client.business_name}`})`;
      return { id: rows[0].id, status: "ready" as const, lane: "free" as const };
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("Grok is not available in this environment. Use the free pack.");

    if (data.desk === "visual") {
      const prompt = `${client.business_name}, ${client.business_category} in ${client.locations}. ${data.brief}. Natural light, no logos, no readable text.`;
      const res = await xai("/v1/images/generations", apiKey, {
        model: "grok-imagine-image-2.0",
        prompt,
        n: 1,
        aspect_ratio: data.aspect,
        resolution: "1k",
        response_format: "url",
      });
      if (!res.ok) throw new Error(`Image request failed (${res.status}). Nothing was saved as a fake still.`);
      const body = (await res.json()) as { data?: { url?: string }[] };
      const url = body.data?.[0]?.url ?? "";
      if (!url) throw new Error("Grok returned no image URL");
      const rows = await sql<{ id: number }>`
        insert into assist_runs (client_id, desk, lane, prompt, result, media_url, media_kind, status)
        values (${client.id}, 'visual', 'grok', ${prompt}, ${"Still from Grok Imagine. The link expires — download it if you want to keep it."}, ${url}, 'image', 'ready')
        returning id
      `;
      await sql`insert into activity_logs (event, detail) values ('assist', ${`Still for ${client.business_name}`})`;
      return { id: rows[0].id, status: "ready" as const, lane: "grok" as const };
    }

    if (data.desk === "video") {
      const frame = data.aspect === "16:9" ? "wide" : data.aspect === "1:1" ? "square" : "vertical";
      const prompt = `6-second ${frame} spot for ${client.business_name}, ${client.business_category} in ${client.locations}. ${data.brief}. One shot, natural light, no logos.`;
      const res = await xai("/v1/videos/generations", apiKey, {
        model: "grok-imagine-video-1.5-lite",
        prompt,
        duration: 6,
        aspect_ratio: data.aspect,
        resolution: "480p",
      });
      if (!res.ok) throw new Error(`Video request failed (${res.status}). No clip was invented.`);
      const body = (await res.json()) as { request_id?: string };
      if (!body.request_id) throw new Error("Grok did not start a clip");
      const rows = await sql<{ id: number }>`
        insert into assist_runs (client_id, desk, lane, prompt, result, media_kind, job_id, status)
        values (
          ${client.id}, 'video', 'grok', ${prompt},
          ${"Clip is rendering. This spends the workspace Grok quota. Nothing is posted."},
          'video', ${body.request_id}, 'pending'
        )
        returning id
      `;
      await sql`insert into activity_logs (event, detail) values ('assist', ${`Clip started for ${client.business_name}`})`;
      return { id: rows[0].id, status: "pending" as const, lane: "grok" as const };
    }

    const prompt = grokPrompt(data.desk, client, data.brief);
    const res = await xai("/v1/chat/completions", apiKey, {
      model: "grok-4.5",
      max_tokens: 700,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });
    if (!res.ok) throw new Error(`Grok request failed (${res.status})`);
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Grok returned an empty reply");
    const rows = await sql<{ id: number }>`
      insert into assist_runs (client_id, desk, lane, prompt, result, status)
      values (${client.id}, ${data.desk}, 'grok', ${data.brief}, ${text}, 'ready')
      returning id
    `;
    await sql`insert into activity_logs (event, detail) values ('assist', ${`Grok ${data.desk} for ${client.business_name}`})`;
    return { id: rows[0].id, status: "ready" as const, lane: "grok" as const };
  });

export const pollAssistVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = Number((input as { id?: number }).id);
    if (!Number.isFinite(id)) throw new Error("Missing clip");
    return { id };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("Grok is not available in this environment");
    const sql = await getSql();
    const rows = await sql<{ job_id: string; status: string }>`
      select job_id, status from assist_runs where id = ${data.id}
    `;
    const row = rows[0];
    if (!row?.job_id) throw new Error("No clip was started");
    if (row.status === "ready") return { status: "ready" as const };
    const res = await xai(`/v1/videos/${row.job_id}`, apiKey, undefined, "GET");
    if (!res.ok) throw new Error(`Clip check failed (${res.status})`);
    const body = (await res.json()) as {
      status?: string;
      video?: { url?: string };
      error?: { message?: string };
    };
    if (body.status === "done" && body.video?.url) {
      await sql`
        update assist_runs
        set status = 'ready', media_url = ${body.video.url},
            result = ${"Clip from Grok Imagine. The link expires — download it if you want to keep it. Nothing was posted."}
        where id = ${data.id}
      `;
      return { status: "ready" as const };
    }
    if (body.status === "failed" || body.status === "expired") {
      const message = body.error?.message || (body.status === "expired" ? "Clip expired before it finished" : "Clip failed");
      await sql`
        update assist_runs set status = 'failed', result = ${message} where id = ${data.id}
      `;
      return { status: "failed" as const };
    }
    return { status: "pending" as const };
  });

export const sendAssistToPipeline = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = Number((input as { id?: number }).id);
    if (!Number.isFinite(id)) throw new Error("Missing run");
    return { id };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      client_id: number;
      desk: string;
      result: string;
      status: string;
      business_name: string;
      locations: string;
      audience: string;
    }>`
      select r.client_id, r.desk, r.result, r.status, c.business_name, c.locations, c.audience
      from assist_runs r join clients c on c.id = r.client_id
      where r.id = ${data.id}
    `;
    const row = rows[0];
    if (!row) throw new Error("Run not found");
    if (row.status !== "ready" || row.result.trim().length < 8) throw new Error("Nothing ready to file");
    const topic = `${row.desk} bench`.slice(0, 120);
    await sql`
      insert into content_items
        (client_id, campaign, source_model, content_type, topic, raw_content, summary, status, platform, audience, location_target, priority, approval_status)
      values
        (${row.client_id}, 'bench', 'assist', 'text', ${topic}, ${row.result.slice(0, 8000)}, ${row.result.slice(0, 180)}, 'source', 'instagram', ${row.audience}, ${row.locations}, 'medium', 'pending')
    `;
    await sql`insert into activity_logs (event, detail) values ('assist', ${`Filed ${row.desk} for ${row.business_name}`})`;
    return { ok: true };
  });

const SHARE_DESKS = ["social", "ads", "copy"] as const;

export const prepareShare = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = Number((input as { id?: number }).id);
    if (!Number.isFinite(id)) throw new Error("Missing run");
    return { id };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      client_id: number;
      desk: string;
      lane: string;
      result: string;
      status: string;
      media_kind: string;
      business_name: string;
      locations: string;
      audience: string;
    }>`
      select r.client_id, r.desk, r.lane, r.result, r.status, r.media_kind,
             c.business_name, c.locations, c.audience
      from assist_runs r join clients c on c.id = r.client_id
      where r.id = ${data.id}
    `;
    const row = rows[0];
    if (!row) throw new Error("Run not found");
    if (row.lane !== "grok") throw new Error("Free packs are prompts, not posts. Ask Grok, or paste the pack into another tool.");
    if (!(SHARE_DESKS as readonly string[]).includes(row.desk)) throw new Error("Share drafts are for copy, ads, and posts");
    if (row.status !== "ready" || row.media_kind) throw new Error("Nothing ready to share");
    const copy = row.result.trim().slice(0, 4000);
    if (copy.length < 8) throw new Error("Nothing ready to share");
    const topic = `${row.desk} share`.slice(0, 120);
    const inserted = await sql<{ id: number }>`
      insert into content_items
        (client_id, campaign, source_model, content_type, topic, raw_content, summary, status, platform, audience, location_target, priority, approval_status)
      values
        (${row.client_id}, 'bench-share', 'assist', 'text', ${topic}, ${copy}, ${copy.slice(0, 180)}, 'drafted', 'instagram', ${row.audience}, ${row.locations}, 'medium', 'pending')
      returning id
    `;
    const contentId = inserted[0].id;
    const platforms = ["linkedin", "instagram", "x"] as const;
    for (const platform of platforms) {
      await sql`
        insert into drafts (content_id, platform, variant_label, copy, suggested_time, seo_score, recommended, notes)
        values (
          ${contentId}, ${platform}, 'Share', ${copy}, 'After approval', 0, ${platform === "instagram"},
          ${"Not published. Approve in Pipeline before Week will queue it."}
        )
      `;
    }
    await sql`insert into activity_logs (event, detail) values ('assist', ${`Share drafts for ${row.business_name}`})`;
    return { ok: true, contentId };
  });
