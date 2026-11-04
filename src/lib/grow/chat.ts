import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

type ClientBits = {
  id: number;
  business_name: string;
  business_category: string;
  audience: string;
  locations: string;
  brand_voice: string;
};

export type ChatMessage = {
  id: number;
  role: string;
  content: string;
  created_at: string;
};

const SYSTEM = `You are the Grow 10x desk for local and service businesses. You draft work the user copies and sends themselves. You do not log into browsers, post, message, email, spend ad budget, or change ad accounts. Follow the task in the latest message. Prefer plain sentences. Do not use asterisks, hash headings, or markdown.

Website create: sections only — title, hero, who it is for, services, proof, next step. Name the place and the service in the title. No invented prices, phone numbers, hours, or reviews.

Website review: four groups — Clarity, Local search, Trust, Phone and speed. Clarity: one next step, readable headings. Local search: service and place in the title and first heading; do not invent rankings. Trust: never invent reviews. Phone and speed: if a phone is in the source, say it should be a tap-to-call link; say hero images should be sized for the screen and given reserved space so the page does not jump. Do not invent Lighthouse or Core Web Vitals numbers. Google's published good lines are only a reference if the user pastes a real report: LCP within 2.5s, INP within 200ms, CLS within 0.1.

Website fix: revised copy, then a short list of what changed. Mark any fact you cannot verify.

SEO and GEO: target local commercial long-tail questions a customer would type or speak. Prefer service plus place in titles and first headings. Draft FAQ answers and one short article outline that could earn a citation in AI search. Never invent rankings, traffic, or AI Overview placement. For technical SEO, list only checks the user can run (title, H1, NAP consistency, image alt, sitemap entry). If the user pastes Search Console or ranking numbers, analyze only those numbers.

Business listings: produce NAP-consistent listing copy for Google Business Profile, Apple Business Connect, Bing Places, and one industry directory the user names. Include category, services, description under 750 characters when possible, and three Q and A pairs. Flag missing hours, phone, or address instead of inventing them. Do not claim a listing was claimed or updated.

Lead generation: draft one lead magnet outline, one landing section, three follow-up messages with {{first_name}}, and a simple qualification question. Do not invent conversion rates. Do not import or store contacts.

Care operator: draft short, calm replies for booking, pricing questions, delays, complaints, and after-hours. Offer to take a name, phone, and preferred time. Never invent policy, prices, or that a booking was confirmed. Never demand five-star reviews. Never offer a gift for a review.

Ads for Google Ads, X Ads, Apple Ads, Microsoft Advertising, Yahoo Ads, and YouTube: create two short variants with hook, offer, proof, and one call to action. Name the platform. For Google, prefer search intent language and a clear local qualifier. Optimize by naming the weak line and rewriting it. A test is one change, one metric to watch, and how long to wait. Analyze only numbers the user pasted. If none were pasted, say what to paste. Do not invent spend, clicks, conversions, prices, or rankings. Do not claim a campaign was created.

Meta (Facebook and Instagram): create, optimize, review, test, and analyze the same way. A review covers the claim, the offer, and whether the next step is obvious. Nothing is published.

Research on competitors, places, audience, market, trends, innovation, or launches: separate general knowledge from what needs a live source. Do not invent rankings, traffic, revenue, or review counts. End with the one fact the user should verify.

Design: a social still is size, headline, one photo direction, and text that must not sit in the picture. An email is subject, preheader, a short body, and one call to action, using {{first_name}} if a name is needed. A pitch deck is slide titles and one line each, with no invented metrics. A review says what is unclear. A test is a checklist the user runs. Do not claim a file was exported.

Outreach: draft one email the user sends. Never say it was sent. Never ask for or store a contact list, password, or cookie. A review ask must be honest. Never demand five stars. Never offer a discount, gift, or entry in exchange for a review. Never invent that a review was posted.

Social actions: write the exact caption, reply, or steps. Do not claim you opened an account, liked, followed, or posted. Do not promise refunds. Do not invent offers.

Keep the answer short enough to paste.`;

function offline(text: string, client: ClientBits | null) {
  const who = client
    ? `${client.business_name}, ${client.business_category}, ${client.locations}. Voice: ${client.brand_voice}.`
    : "No studio selected.";
  return [
    "Grok is not available in this environment. This is a checklist, not a model reply.",
    who,
    "",
    "Website: title with service and place, hero, who it is for, services, proof, one next step. Review in Clarity, Local search, Trust, Phone and speed.",
    "SEO and GEO: local long-tail questions, FAQ, one article outline, technical checks only. Do not invent rankings or AI citations.",
    "Listings: NAP-consistent GBP, Apple Business Connect, Bing Places copy. Flag missing hours or phone. Do not claim a listing was updated.",
    "Leads: one magnet outline, landing section, three follow-ups with {{first_name}}, one qualification question.",
    "Care: calm replies for booking, price, delay, complaint, after hours. Never invent policy or confirm a booking.",
    "Ads and Meta: two variants, one rewrite, one test. Analyze only pasted numbers.",
    "Research: label what needs a live source. Design and outreach stay drafts you send yourself.",
    "",
    `Note: ${text}`,
  ].join("\n");
}

async function askGrok(key: string, messages: { role: string; content: string }[]) {
  const run = () =>
    fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 1200,
        temperature: 0.35,
        messages,
      }),
    });
  let res = await run();
  if (res.status === 429 || res.status >= 500) res = await run();
  if (!res.ok) throw new Error(`Grok ${res.status}`);
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty Grok reply");
  return content;
}

export const listChat = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const threads = await sql<{ id: number; title: string; created_at: string }>`
    select id, title, created_at::text as created_at
    from chat_threads
    order by id desc
    limit 1
  `;
  const thread = threads[0];
  if (!thread) return { thread: null as null, messages: [] as ChatMessage[] };
  const messages = await sql<ChatMessage>`
    select id, role, content, created_at::text as created_at
    from chat_messages
    where thread_id = ${thread.id}
    order by id asc
  `;
  return { thread, messages };
});

export const newChat = createServerFn({ method: "POST" })
  .inputValidator((data: Record<string, unknown>) => data)
  .handler(async () => {
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into chat_threads (title) values ('New chat') returning id
    `;
    await sql`insert into activity_logs (event, detail) values ('chat', 'New thread')`;
    return { threadId: rows[0]!.id };
  });

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const body = data as { text?: string; clientId?: number; threadId?: number };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 4000) throw new Error("Message required (max 4000)");
    return {
      text,
      clientId: typeof body.clientId === "number" ? body.clientId : 0,
      threadId: typeof body.threadId === "number" ? body.threadId : 0,
    };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    let threadId = data.threadId;
    if (!threadId) {
      const rows = await sql<{ id: number }>`
        insert into chat_threads (title) values (${data.text.slice(0, 60)}) returning id
      `;
      threadId = rows[0]!.id;
    }
    const clients = data.clientId
      ? await sql<ClientBits>`
          select id, business_name, business_category, audience, locations, brand_voice
          from clients where id = ${data.clientId}
        `
      : [];
    const client = clients[0] ?? null;
    const prior = await sql<{ role: string; content: string }>`
      select role, content from chat_messages
      where thread_id = ${threadId}
      order by id desc
      limit 8
    `;
    prior.reverse();

    const studio = client
      ? `Studio: ${client.business_name}, ${client.business_category}. Audience: ${client.audience}. Place: ${client.locations}. Voice: ${client.brand_voice}.`
      : "No studio selected. Ask which business if the note is ambiguous.";
    const apiKey = process.env.XAI_API_KEY;
    const reply = apiKey
      ? await askGrok(apiKey, [
          { role: "system", content: `${SYSTEM}\n${studio}` },
          ...prior.map((row) => ({ role: row.role, content: row.content })),
          { role: "user", content: data.text },
        ])
      : offline(data.text, client);

    const count = await sql<{ n: number }>`select count(*)::int as n from chat_messages where thread_id = ${threadId}`;
    if ((count[0]?.n ?? 0) === 0) {
      await sql`update chat_threads set title = ${data.text.slice(0, 60)} where id = ${threadId}`;
    }
    await sql`
      insert into chat_messages (thread_id, role, content) values
      (${threadId}, 'user', ${data.text}),
      (${threadId}, 'assistant', ${reply})
    `;
    await sql`insert into activity_logs (event, detail) values ('chat', ${apiKey ? "Grok desk reply" : "Checklist reply, Grok unavailable"})`;
    return { threadId, model: apiKey ? "grok-4.5" : "pack" };
  });
