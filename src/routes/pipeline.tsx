import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Panel } from "@/components/shell";
import { intakeContent, listClients, listContent, setApproval } from "@/lib/grow/api";

export const Route = createFileRoute("/pipeline")({
  loader: async () => {
    const [content, clients] = await Promise.all([listContent(), listClients()]);
    return { ...content, clients };
  },
  component: PipelinePage,
});

const PLATFORMS = [
  ["linkedin", "LinkedIn"],
  ["instagram", "Instagram"],
  ["x", "X"],
  ["facebook", "Facebook"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
] as const;

function PipelinePage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const intake = useServerFn(intakeContent);
  const decide = useServerFn(setApproval);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  return (
    <Shell>
      <div className="mb-6 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.16em] text-sage">Pipeline</p>
        <h2 className="font-display text-4xl">Save the source, then approve it</h2>
        <p className="mt-2 text-sm text-muted">Week will not queue a line until this piece is approved. Drafts writes the variants after that.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Intake">
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setError("");
              try {
                await intake({
                  data: {
                    clientId: Number(form.get("clientId")),
                    topic: String(form.get("topic") ?? ""),
                    raw: String(form.get("raw") ?? ""),
                    platform: String(form.get("platform") ?? "linkedin"),
                    contentType: String(form.get("contentType") ?? "text"),
                    campaign: String(form.get("campaign") ?? "general"),
                  },
                });
                event.currentTarget.reset();
                setNote("Source saved. Approve it before Drafts can queue it.");
                await router.invalidate();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Intake failed");
              }
            }}
          >
            <label className="grid gap-1 text-sm text-muted">
              Client
              <select name="clientId" className="min-h-11 rounded-lg border border-line bg-bg px-3 text-fg">
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.business_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-muted">
              Topic
              <input name="topic" required placeholder="Same-week cleanings" className="min-h-11 rounded-lg border border-line bg-bg px-3 text-fg" />
            </label>
            <label className="grid gap-1 text-sm text-muted">
              Platform
              <select name="platform" className="min-h-11 rounded-lg border border-line bg-bg px-3 text-fg">
                {PLATFORMS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-muted">
              Source
              <textarea
                name="raw"
                required
                rows={6}
                placeholder="Paste the real offer. Leave out prices you have not confirmed."
                className="rounded-lg border border-line bg-bg px-3 py-2 text-fg"
              />
            </label>
            {error && <p className="text-sm text-brass">{error}</p>}
            {note && <p className="text-sm text-sage">{note}</p>}
            <button type="submit" className="min-h-11 rounded-full bg-brass px-4 text-sm font-medium text-ink">
              Save source
            </button>
          </form>
        </Panel>
        <Panel title="Pieces">
          <ul className="space-y-5">
            {data.items.length === 0 && <p className="text-sm text-muted">No pieces yet. Save a source on the left.</p>}
            {data.items.map((item) => (
              <li key={item.id} className="border-b border-line pb-4 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-2xl">{item.topic}</p>
                  <span className="text-xs uppercase tracking-wide text-brass">{item.approval_status}</span>
                </div>
                <p className="text-sm text-muted">
                  {item.business_name} · {item.platform} · {item.status} · {item.source_model}
                </p>
                <p className="mt-2 text-sm text-fg">{item.summary || item.raw_content.slice(0, 180)}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className={`min-h-11 rounded-full px-4 text-sm ${
                      item.approval_status === "approved" ? "bg-brass font-medium text-ink" : "border border-line text-fg"
                    }`}
                    onClick={() => {
                      setError("");
                      void decide({ data: { contentId: item.id, decision: "approved" } })
                        .then(() => {
                          setNote("Approved. Open Drafts to write the variants.");
                          return router.invalidate();
                        })
                        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not approve"));
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-full border border-line px-4 text-sm text-muted"
                    onClick={() => {
                      setError("");
                      void decide({ data: { contentId: item.id, decision: "pending" } })
                        .then(() => {
                          setNote("Held. Week will not queue this until you approve it again.");
                          return router.invalidate();
                        })
                        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not hold"));
                    }}
                  >
                    Hold
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}
