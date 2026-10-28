import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Shell, Panel } from "@/components/shell";
import { analytics } from "@/lib/grow/api";

export const Route = createFileRoute("/insights")({
  loader: () => analytics(),
  component: InsightsPage,
});

function InsightsPage() {
  const data = Route.useLoaderData();
  return (
    <Shell>
      <div className="mb-6 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.16em] text-sage">Insights</p>
        <h2 className="font-display text-4xl">What this studio has drafted</h2>
        <p className="mt-2 text-sm text-muted">Counts and scores come from saved drafts, not from a live ad account. A blank chart means nothing has been drafted yet.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pieces by platform">
          <div className="h-64 text-brass">
            {data.platforms.length === 0 ? (
              <p className="text-sm text-muted">No pieces yet.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.platforms}>
                <XAxis dataKey="platform" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                <Bar dataKey="n" fill="currentColor" radius={4} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </Panel>
        <Panel title="Average draft score">
          <ul className="space-y-3">
            {data.scores.map((row) => (
              <li key={row.platform}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-fg">{row.platform}</span>
                  <span className="text-muted">{row.avg}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2">
                  <div className="h-2 rounded-full bg-sage" style={{ width: `${row.avg}%` }} />
                </div>
              </li>
            ))}
            {data.scores.length === 0 && <p className="text-muted">Draft something in Studio to see scores.</p>}
          </ul>
        </Panel>
        <Panel title="Funnel">
          <ul className="grid grid-cols-2 gap-3">
            {data.funnel.map((row) => (
              <li key={row.status} className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs uppercase tracking-wide text-muted">{row.status}</p>
                <p className="font-display text-3xl">{row.n}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}
