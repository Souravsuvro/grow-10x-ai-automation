import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Panel } from "@/components/shell";
import { listSchedule, markPublished } from "@/lib/grow/api";

export const Route = createFileRoute("/schedule")({
  loader: () => listSchedule(),
  component: SchedulePage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SchedulePage() {
  const slots = Route.useLoaderData();
  const router = useRouter();
  const publish = useServerFn(markPublished);
  const [note, setNote] = useState("");
  const start = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });

  return (
    <Shell>
      <div className="mb-6 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.16em] text-sage">Week</p>
        <h2 className="font-display text-4xl">Seven days, after you approve</h2>
        <p className="mt-2 text-sm text-muted">
          Nothing publishes itself. Mark a slot only after the post is actually live.
          {slots.length === 0 && (
            <>
              {" "}
              <Link to="/studio" className="text-brass">Queue an approved draft</Link> to fill the week.
            </>
          )}
        </p>
        {note && <p className="mt-2 text-sm text-sage">{note}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {days.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const mine = slots.filter((slot) => slot.publish_at.slice(0, 10) === key);
          return (
            <section key={key} className="min-h-40 rounded-[var(--radius)] border border-line bg-surface p-3">
              <p className="text-xs uppercase tracking-wide text-muted">{DAYS[date.getDay()]}</p>
              <p className="font-display text-2xl">{date.getDate()}</p>
              <ul className="mt-3 space-y-2">
                {mine.length === 0 && <li className="text-xs text-muted">Open</li>}
                {mine.map((slot) => (
                  <li key={slot.id} className="text-xs text-fg">
                    <p className="text-brass">{slot.platform}</p>
                    <p>{slot.business_name}</p>
                    <p className="text-muted">{slot.status}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <div className="mt-6">
        <Panel title="Queue">
          {slots.length === 0 && <p className="text-muted">Approve a draft in Studio, then queue it.</p>}
          <ul className="space-y-4">
            {slots.map((slot) => (
              <li key={slot.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <p className="text-fg">
                    {slot.business_name} · {slot.topic}
                  </p>
                  <p className="text-sm text-muted">
                    {slot.platform} · {slot.publish_at.replace("T", " ").replace("Z", " UTC")} · {slot.status}
                  </p>
                  <p className="mt-1 max-w-xl text-sm text-fg">{slot.copy}</p>
                </div>
                {slot.status !== "published" && (
                  <button
                    type="button"
                    className="min-h-11 rounded-full bg-brass px-4 text-sm text-ink"
                    onClick={() => {
                      void publish({ data: { id: slot.id } })
                        .then(() => {
                          setNote("Marked published. That only records what you already sent.");
                          return router.invalidate();
                        })
                        .catch(() => setNote("Could not mark that slot."));
                    }}
                  >
                    Mark published
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}
