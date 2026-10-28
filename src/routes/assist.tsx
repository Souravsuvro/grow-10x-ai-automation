import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Panel } from "@/components/shell";
import { listClients } from "@/lib/grow/api";
import { listAssist, pollAssistVideo, prepareShare, runAssist, sendAssistToPipeline } from "@/lib/grow/assist";

export const Route = createFileRoute("/assist")({
  loader: async () => {
    const [clients, runs] = await Promise.all([listClients(), listAssist()]);
    return { clients, runs };
  },
  component: AssistPage,
});

const DESKS = [
  { id: "research", label: "Research", like: "Perplexity" },
  { id: "copy", label: "Copy", like: "ChatGPT" },
  { id: "visual", label: "Design", like: "Midjourney" },
  { id: "ads", label: "Ads", like: "Paid" },
  { id: "video", label: "Video", like: "Short" },
  { id: "social", label: "Posts", like: "Social" },
  { id: "comments", label: "Replies", like: "Inbox" },
  { id: "engage", label: "Engage", like: "Week" },
] as const;

function AssistPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const run = useServerFn(runAssist);
  const poll = useServerFn(pollAssistVideo);
  const file = useServerFn(sendAssistToPipeline);
  const share = useServerFn(prepareShare);
  const [desk, setDesk] = useState<(typeof DESKS)[number]["id"]>("visual");
  const [lane, setLane] = useState<"free" | "grok">("grok");
  const [aspect, setAspect] = useState<"1:1" | "9:16" | "16:9">("1:1");
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? 0);
  const [brief, setBrief] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    const pending = data.runs.find((item) => item.desk === "video" && item.status === "pending");
    if (pending) setPendingId((current) => current ?? pending.id);
  }, [data.runs]);

  useEffect(() => {
    if (!pendingId) return;
    let stopped = false;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries > 24) {
        setNote("Still rendering. Refresh in a minute — the clip keeps going.");
        setPendingId(null);
        return;
      }
      void poll({ data: { id: pendingId } })
        .then((result) => {
          if (stopped || result.status === "pending") return;
          setPendingId(null);
          setNote(result.status === "ready" ? "Clip is ready." : "Clip failed.");
          void router.invalidate();
        })
        .catch((err: unknown) => {
          if (stopped) return;
          setPendingId(null);
          setNote(err instanceof Error ? err.message : "Could not check the clip");
        });
    }, 5000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
    // poll and router are stable enough for one in-flight clip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingId]);

  const buttonLabel =
    busy ? "Working" : lane === "free" ? "Build free pack" : desk === "visual" ? "Draw a still" : desk === "video" ? "Cut a 6-second clip" : "Ask Grok";

  return (
    <Shell>
      <div className="mb-6 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.16em] text-sage">Bench</p>
        <h2 className="font-display text-4xl">Free packs, or Grok when you spend the quota</h2>
        <p className="mt-2 text-sm text-muted">
          Perplexity, ChatGPT, and Midjourney stay outside this app. The free lane writes a prompt you paste into them.
          The Grok lane researches, writes, scores an ad, draws one still, or cuts one short clip. Share drafts wait for approval. Nothing is posted.
        </p>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {[
          ["Perplexity", "Free", "Quick search, a few deeper searches a day", "Pro from about $20/mo. Paste a research pack. Not connected."],
          ["ChatGPT", "Free", "Text chat, limited images", "Go from about $8/mo, Plus about $20. Paste a copy pack. Not connected."],
          ["Midjourney", "Paid", "No free plan", "Basic from about $10/mo. The design pack is a prompt, not a picture from them."],
          ["Grok", "Quota", "Live here only when you press the button", "Still and the 6-second clip spend this workspace quota. Posts stay drafts."],
        ].map(([name, tier, free, paid]) => (
          <div key={name} className="rounded-[var(--radius)] border border-line bg-surface px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-2xl text-fg">{name}</p>
              <span className="text-xs uppercase tracking-wide text-brass">{tier}</span>
            </div>
            <p className="mt-1 text-sm text-fg">{free}</p>
            <p className="mt-1 text-sm text-muted">{paid}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {DESKS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setDesk(item.id);
              if (item.id === "visual" || item.id === "video") {
                setLane("grok");
                setAspect(item.id === "video" ? "9:16" : "1:1");
              }
            }}
            className={`min-h-11 rounded-full px-4 text-sm ${desk === item.id ? "bg-brass text-ink" : "border border-line text-muted"}`}
          >
            {item.label}
            <span className="ml-2 text-xs opacity-70">{item.like}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Brief">
          <div className="mb-3 flex gap-2">
            {(["free", "grok"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLane(item)}
                className={`min-h-11 flex-1 rounded-full text-sm ${lane === item ? "bg-brass font-medium text-ink" : "border border-line text-muted"}`}
              >
                {item === "free" ? "Free pack" : "Grok quota"}
              </button>
            ))}
          </div>
          <label className="grid gap-1 text-sm text-muted">
            Studio
            <select
              value={clientId}
              onChange={(event) => setClientId(Number(event.target.value))}
              className="min-h-11 rounded-lg border border-line bg-bg px-3 text-fg"
            >
              {data.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.business_name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 grid gap-1 text-sm text-muted">
            {desk === "comments" ? "Comment to answer" : "Brief"}
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              rows={6}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-fg"
              placeholder={
                desk === "comments"
                  ? "Paste the public comment"
                  : desk === "visual"
                    ? "What the still should show"
                    : desk === "video"
                      ? "What the six-second clip should show"
                      : "One concrete offer, place, or question"
              }
            />
          </label>
          {(desk === "visual" || desk === "video") && lane === "grok" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["1:1", "Square"],
                  ["9:16", "Story"],
                  ["16:9", "Wide"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAspect(value)}
                  className={`min-h-11 rounded-full px-4 text-sm ${aspect === value ? "bg-brass text-ink" : "border border-line text-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {lane === "grok" && (desk === "visual" || desk === "video") && (
            <p className="mt-3 text-sm text-brass">
              {desk === "video" ? "One 6-second 480p clip. This is the expensive action." : "One still. Links expire."}
            </p>
          )}
          {note && <p className="mt-3 text-sm text-muted">{note}</p>}
          <button
            type="button"
            disabled={busy || pendingId !== null}
            className="mt-4 min-h-11 rounded-full bg-brass px-4 text-sm font-medium text-ink disabled:opacity-60"
            onClick={() => {
              setBusy(true);
              setNote("");
              void run({ data: { desk, lane, clientId, brief, aspect } })
                .then((result) => {
                  if (result.status === "pending") setPendingId(result.id);
                  setNote(result.lane === "free" ? "Free pack saved. It is not a model reply." : "Saved.");
                  return router.invalidate();
                })
                .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not run"))
                .finally(() => setBusy(false));
            }}
          >
            {buttonLabel}
          </button>
        </Panel>
        <Panel title="Recent">
          <ul className="space-y-5">
            {data.runs.map((item) => (
              <li key={item.id} className="border-b border-line pb-4 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-fg">
                    {item.business_name} · {item.desk}
                  </p>
                  <span className="text-xs uppercase tracking-wide text-brass">
                    {item.lane} · {item.status}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-fg">{item.result}</p>
                {item.media_kind === "image" && item.media_url && (
                  <img src={item.media_url} alt={`${item.business_name} still`} className="mt-3 max-h-72 w-full rounded-lg object-cover" />
                )}
                {item.media_kind === "video" && item.media_url && (
                  <video src={item.media_url} controls className="mt-3 w-full rounded-lg" />
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-full border border-line px-4 text-sm text-fg"
                    onClick={() => {
                      const text = item.media_url ? `${item.result}\n${item.media_url}` : item.result;
                      void navigator.clipboard.writeText(text).then(() => setNote("Copied."));
                    }}
                  >
                    Copy
                  </button>
                  {item.status === "ready" && item.lane === "grok" && !item.media_kind && (item.desk === "social" || item.desk === "ads" || item.desk === "copy") && (
                    <button
                      type="button"
                      className="min-h-11 rounded-full border border-line px-4 text-sm text-fg"
                      onClick={() => {
                        void share({ data: { id: item.id } })
                          .then(() => setNote("Three share drafts are in Studio. Approve them before they can be queued."))
                          .then(() => router.invalidate())
                          .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not prepare share"));
                      }}
                    >
                      Prepare share drafts
                    </button>
                  )}
                  {item.status === "ready" && !item.media_kind && (
                    <button
                      type="button"
                      className="min-h-11 rounded-full border border-line px-4 text-sm text-fg"
                      onClick={() => {
                        void file({ data: { id: item.id } })
                          .then(() => setNote("Filed to the pipeline. Approve it before it can be queued."))
                          .then(() => router.invalidate())
                          .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not file"));
                      }}
                    >
                      File to pipeline
                    </button>
                  )}
                </div>
              </li>
            ))}
            {data.runs.length === 0 && <p className="text-sm text-muted">No bench runs yet.</p>}
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}
