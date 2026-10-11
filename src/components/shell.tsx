import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

const LINKS = [
  { to: "/", label: "Pulse" },
  { to: "/clients", label: "Clients" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/studio", label: "Studio" },
  { to: "/schedule", label: "Week" },
  { to: "/insights", label: "Insights" },
  { to: "/sitemaps", label: "Images" },
  { to: "/playbook", label: "Playbook" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Content studio</p>
            <h1 className="font-display text-4xl leading-none text-fg">Grow 10x</h1>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-muted sm:block">
            Drafts stay local to this workspace until you approve them.
          </p>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {LINKS.map((link) => {
            const active = path === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm ${
                  active ? "bg-brass text-ink" : "text-muted hover:bg-surface hover:text-fg"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius)] border border-line bg-surface p-5">
      <h2 className="mb-4 font-display text-2xl text-fg">{title}</h2>
      {children}
    </section>
  );
}
