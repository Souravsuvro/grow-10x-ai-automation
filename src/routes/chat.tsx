import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/shell";
import { listClients } from "@/lib/grow/api";
import { listChat, newChat, sendChat } from "@/lib/grow/chat";

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): { prompt?: string } => {
    if (typeof search.prompt !== "string" || search.prompt.length === 0) return {};
    return { prompt: search.prompt.slice(0, 800) };
  },
  loader: async () => {
    const [chat, clients] = await Promise.all([listChat(), listClients()]);
    return { chat, clients };
  },
  component: ChatPage,
});

const LANES = [
  { id: "website", label: "Website" },
  { id: "ads", label: "Ads" },
  { id: "meta", label: "Meta" },
  { id: "research", label: "Research" },
  { id: "design", label: "Design" },
  { id: "outreach", label: "Outreach" },
] as const;

type LaneId = (typeof LANES)[number]["id"];

const PROMPTS: Record<LaneId, { label: string; text: string }[]> = {
  website: [
    {
      label: "Create a page",
      text: "Create a homepage: title with the service and the place, a hero, who it is for, three services, one proof line, and a single next step. Do not invent prices, hours, or reviews.",
    },
    {
      label: "Review a page",
      text: "Review this page in four groups: Clarity, Local search, Trust, Phone and speed. Do not invent rankings or speed scores. Page copy:\n",
    },
    {
      label: "Fix the copy",
      text: "Fix the weak lines. Keep the offer. Mark anything you cannot verify. Copy:\n",
    },
  ],
  ads: [
    {
      label: "Google",
      text: "Create two Google Ads variants. Hook, offer, proof, one call to action. Do not invent prices or results. Offer:\n",
    },
    {
      label: "X",
      text: "Create two X Ads variants. Hook, offer, proof, one call to action. Do not invent results. Offer:\n",
    },
    {
      label: "Apple",
      text: "Create two Apple Ads variants. Hook, offer, proof, one call to action. Do not invent results. Offer:\n",
    },
    {
      label: "Microsoft",
      text: "Create two Microsoft Advertising variants. Hook, offer, proof, one call to action. Do not invent results. Offer:\n",
    },
    {
      label: "Yahoo",
      text: "Create two Yahoo Ads variants. Hook, offer, proof, one call to action. Do not invent results. Offer:\n",
    },
    {
      label: "YouTube",
      text: "Create a YouTube ad: a spoken line, on-screen text, and one call to action. Do not invent results. Offer:\n",
    },
    {
      label: "Optimize",
      text: "Optimize this ad. Name the weak line and rewrite it. Do not invent results. Ad:\n",
    },
    {
      label: "Test",
      text: "Write a test plan: one change, the metric to watch, and how long to wait. Do not invent results. Ad:\n",
    },
    {
      label: "Analyze",
      text: "Analyze only the numbers I paste. If a number is missing, say so. Do not invent spend, clicks, or conversions. Numbers:\n",
    },
  ],
  meta: [
    {
      label: "Write",
      text: "Create two Meta posts, one for Facebook and one for Instagram. Do not claim they are published. Offer:\n",
    },
    {
      label: "Optimize",
      text: "Optimize this Meta post. Name the weak line and rewrite it. Post:\n",
    },
    {
      label: "Review",
      text: "Review this Meta post: claim, offer, and whether the next step is obvious. Do not invent results. Post:\n",
    },
    {
      label: "Test",
      text: "Write a Meta test plan: one change, the metric to watch, and how long to wait. Do not invent results.",
    },
    {
      label: "Analyze",
      text: "Analyze only the Meta numbers I paste. If a number is missing, say so. Numbers:\n",
    },
  ],
  research: [
    {
      label: "Competitors",
      text: "Research competitors for this studio. Separate what you know from what needs a live source. Do not invent rankings, traffic, or revenue.",
    },
    {
      label: "Places",
      text: "Research the places this studio serves. Name what a local customer would search. Do not invent rankings.",
    },
    {
      label: "Audience",
      text: "Describe the audience in plain terms: who books, what they worry about, and the one proof they need. Do not invent demographics.",
    },
    {
      label: "Market",
      text: "Sketch the market around this offer. Mark every figure that needs a live source. Do not invent market size.",
    },
    {
      label: "Trends",
      text: "Name three current shifts that matter to this business. Mark what needs a live source. Do not invent statistics.",
    },
    {
      label: "Launches",
      text: "Suggest one new offer to test. Say how we would know it worked. Do not invent demand or prices.",
    },
  ],
  design: [
    {
      label: "Social still",
      text: "Write a social still brief: size, headline, one photo direction, and text that must not sit in the picture. Do not claim a file was exported.",
    },
    {
      label: "Email",
      text: "Design one email: subject, preheader, short body, and one call to action. Use {{first_name}}. Do not say it was sent.",
    },
    {
      label: "Pitch deck",
      text: "Outline a short pitch: slide titles and one line each. No invented metrics. Do not claim a file was exported.",
    },
    {
      label: "Review",
      text: "Review this design note. Say what is unclear and what a customer would miss. Note:\n",
    },
    {
      label: "Test",
      text: "Write a checklist to test this design before it goes out: readability, one next step, and a wrong claim to remove.",
    },
  ],
  outreach: [
    {
      label: "One email",
      text: "Draft one follow-up email I will send myself. Use {{first_name}}. Do not ask for a contact list. Do not say it was sent. Offer:\n",
    },
    {
      label: "Honest review",
      text: "Draft a short honest review ask I will send myself. Do not demand five stars. Do not offer a discount, gift, or entry. Do not say a review was posted.",
    },
    {
      label: "Reply",
      text: "Draft three replies: warm, direct, and a question. Do not promise a refund. Comment:\n",
    },
    {
      label: "Steps I take",
      text: "Write the exact caption and the steps I should take myself in the account. Do not claim you logged in, posted, liked, or messaged anyone.",
    },
  ],
};

function ChatPage() {
  const data = Route.useLoaderData();
  const prompt = Route.useSearch().prompt ?? "";
  const router = useRouter();
  const send = useServerFn(sendChat);
  const start = useServerFn(newChat);
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? 0);
  const [lane, setLane] = useState<LaneId>("website");
  const [draft, setDraft] = useState(prompt);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (prompt) setDraft(prompt);
  }, [prompt]);

  return (
    <Shell>
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sage">Desk</p>
            <h2 className="font-display text-3xl leading-none">Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">
              <span className="sr-only">Studio</span>
              <select
                value={clientId}
                onChange={(event) => setClientId(Number(event.target.value))}
                className="min-h-11 rounded-lg border border-line bg-surface px-3 text-fg"
              >
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.business_name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="min-h-11 rounded-full border border-line px-4 text-sm text-fg"
              onClick={() => {
                void start({ data: {} })
                  .then(() => router.invalidate())
                  .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not start a chat"));
              }}
            >
              New chat
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {data.chat.messages.length === 0 && (
            <p className="text-sm text-muted">
              Pick a desk, then a prompt. The reply is a draft you copy. Nothing is posted, mailed, or spent from this page.
            </p>
          )}
          {data.chat.messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[40rem] rounded-[var(--radius)] px-4 py-3 text-sm ${
                  message.role === "user" ? "bg-surface-2 text-fg" : "border border-line bg-surface text-fg"
                }`}
              >
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">{message.role === "user" ? "You" : "Desk"}</p>
                <p className="whitespace-pre-wrap">{message.content.replace(/\*\*/g, "").replace(/^#{1,3} /gm, "")}</p>
                {message.role === "assistant" && (
                  <button
                    type="button"
                    className="mt-3 min-h-11 text-sm text-brass"
                    onClick={() => {
                      void navigator.clipboard.writeText(message.content).then(() => setNote("Copied."));
                    }}
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          className="mt-3 border-t border-line pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setNote("");
            void send({ data: { threadId: data.chat.threadId, clientId, text: draft } })
              .then((result) => {
                setDraft("");
                setNote(result.model === "grok-4.5" ? "" : "Saved a checklist because Grok is not available.");
                return router.invalidate();
              })
              .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not send"))
              .finally(() => setBusy(false));
          }}
        >
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {LANES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${
                  lane === item.id ? "bg-brass font-medium text-ink" : "border border-line text-fg"
                }`}
                onClick={() => setLane(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {PROMPTS[lane].map((item) => (
              <button
                key={item.label}
                type="button"
                className="min-h-11 shrink-0 rounded-full border border-line px-4 text-sm text-fg"
                onClick={() => setDraft((current) => (current.trim() ? `${current.trim()}\n${item.text}` : item.text))}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <label className="grid flex-1 gap-1 text-sm text-muted">
              Message
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-fg"
                placeholder="Paste a page, an ad, or numbers. Or pick a prompt."
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-full bg-brass px-5 text-sm font-medium text-ink disabled:opacity-60"
            >
              {busy ? "Sending" : "Send"}
            </button>
          </div>
          {note && <p className="mt-2 text-sm text-muted">{note}</p>}
          <p className="mt-2 text-xs text-muted">
            This desk does not sign into your accounts, import contacts, or send mail. Copy the reply and send it yourself.
          </p>
        </form>
      </div>
    </Shell>
  );
}
