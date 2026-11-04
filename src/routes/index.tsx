import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, Panel } from "@/components/shell";
import { listOverview } from "@/lib/grow/api";

export const Route = createFileRoute("/")({
  loader: () => listOverview(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const cards = [
    { label: "Studios", value: String(data.clientCount), to: "/clients" as const },
    { label: "Queued", value: String(data.queued), to: "/schedule" as const },
    { label: "Assistant", value: "Grok 4.5", to: "/chat" as const },
    { label: "Saved in", value: data.db === "neon" ? "Neon" : "This studio", to: "/playbook" as const },
  ];
  return (
    <Shell>
      <div className="mb-8 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-sage">Start here</p>
        <p className="mt-2 font-display text-4xl leading-tight text-fg sm:text-5xl">
          Ask the desk. Approve the line. Queue the week.
        </p>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Chat drafts website copy, SEO and GEO, business listings, leads, care scripts, Google and Meta ads, research, and outreach. You approve a line before the week can queue it. Nothing is posted or spent from the desk.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/chat" className="inline-flex min-h-11 items-center rounded-full bg-brass px-4 text-sm font-medium text-ink">
            Open chat
          </Link>
          <Link to="/connectors" className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm text-fg">
            Connect tools
          </Link>
        </div>
      </div>
      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "SEO and GEO", prompt: "Outline one short article that could earn a citation in AI search: title, three section headings, and a FAQ of five questions. Prefer long-tail local commercial intent. Do not invent rankings." },
          { label: "Listings", prompt: "Draft Google Business Profile copy: primary category, services, description under 750 characters, and three Q and A pairs. Flag missing hours, phone, or address. Do not invent NAP." },
          { label: "Leads", prompt: "Outline one lead magnet for this studio: title, who it helps, three sections, and the next step after download. Do not invent conversion rates." },
          { label: "Care", prompt: "Write a five-line care operator script for this studio: greeting, clarify need, collect details, next step, close. No invented offers." },
          { label: "Ads", prompt: "Create two Google Ads search variants with local intent. Hook, offer, proof, one call to action. Do not invent results. Offer:\n" },
        ].map((desk) => (
          <Link
            key={desk.label}
            to="/chat"
            search={{ prompt: desk.prompt }}
            className="rounded-[var(--radius)] border border-line bg-surface px-3 py-3 text-sm text-fg hover:border-brass"
          >
            {desk.label}
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="rounded-[var(--radius)] border border-line bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{card.label}</p>
            <p className="mt-2 font-display text-3xl text-fg">{card.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Pipeline">
          <ul className="space-y-3">
            {data.recent.map((item) => (
              <li key={item.id} className="border-b border-line pb-3 last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-fg">{item.topic}</p>
                  <span className="text-xs uppercase tracking-wide text-brass">{item.status}</span>
                </div>
                <p className="text-sm text-muted">
                  {item.business_name} · {item.platform} · {item.location_target}
                </p>
              </li>
            ))}
            {data.recent.length === 0 && <p className="text-muted">Nothing in the pipeline yet.</p>}
          </ul>
        </Panel>
        <Panel title="Log">
          <ul className="space-y-3">
            {data.logs.map((log) => (
              <li key={log.id} className="text-sm">
                <span className="text-sage">{log.event}</span>
                <span className="text-muted"> — {log.detail}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}
