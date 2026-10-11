import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Panel } from "@/components/shell";
import { exportPrompt, generateDrafts, listContent, scheduleDraft } from "@/lib/grow/api";

export const Route = createFileRoute("/studio")({
  loader: () => listContent(),
  component: StudioPage,
});

function StudioPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const generate = useServerFn(generateDrafts);
  const queue = useServerFn(scheduleDraft);
  const promptFor = useServerFn(exportPrompt);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [contentId, setContentId] = useState(data.items[0]?.id ?? 0);

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-sage">Grok 4.5</p>
          <h2 className="font-display text-4xl">Three variants, one platform voice</h2>
        </div>
        <label className="text-sm text-muted">
          Source
          <select
            value={contentId}
            onChange={(event) => setContentId(Number(event.target.value))}
            className="mt-1 block min-h-11 min-w-56 rounded-lg border border-line bg-surface px-3 text-fg"
          >
            {data.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.business_name}: {item.topic}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !contentId}
          className="min-h-11 rounded-full bg-brass px-4 text-sm font-medium text-ink disabled:opacity-60"
          onClick={() => {
            setBusy(true);
            setNote("");
            void generate({ data: { contentId } })
              .then((result) => {
                setNote(result.model === "grok-4.5" ? "Drafted with Grok 4.5." : "AI was unavailable. Structured drafts were saved instead.");
                return router.invalidate();
              })
              .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Draft failed"))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Writing" : "Draft with Grok"}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full border border-line px-4 text-sm text-fg"
          onClick={() => {
            void promptFor({ data: { contentId } }).then(async (result) => {
              await navigator.clipboard.writeText(result.text);
              setNote("Prompt copied for ChatGPT, Gemini, Perplexity, or DeepSeek.");
            });
          }}
        >
          Copy prompt for another model
        </button>
      </div>
      {note && <p className="mb-4 text-sm text-muted">{note}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {data.drafts
          .filter((draft) => draft.content_id === contentId || data.drafts.every((d) => d.content_id !== contentId))
          .slice(0, 6)
          .map((draft) => (
            <Panel key={draft.id} title={`${draft.variant_label} · ${draft.platform}`}>
              {draft.recommended && <p className="mb-2 text-xs uppercase tracking-wide text-sage">Recommended</p>}
              <p className="text-sm text-fg">{draft.copy}</p>
              <p className="mt-3 text-sm text-muted">
                {draft.suggested_time} · SEO {draft.seo_score}
              </p>
              <p className="mt-1 text-sm text-muted">{draft.notes}</p>
              <button
                type="button"
                className="mt-4 min-h-11 rounded-full border border-line px-4 text-sm text-fg"
                onClick={() => {
                  void queue({ data: { draftId: draft.id, dayOffset: 1 } })
                    .then(() => setNote("Queued for tomorrow. Approve the piece first if this fails."))
                    .then(() => router.invalidate())
                    .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not queue"));
                }}
              >
                Queue tomorrow
              </button>
            </Panel>
          ))}
      </div>
    </Shell>
  );
}
