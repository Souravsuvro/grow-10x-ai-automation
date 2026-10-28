import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Ellipsis,
  House,
  ImageIcon,
  LayoutList,
  MessageSquare,
  PenLine,
  Plug,
  Sparkles,
  Users,
} from "lucide-react";

const WORK = [
  { to: "/", label: "Home", icon: House },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: LayoutList },
  { to: "/studio", label: "Drafts", icon: PenLine },
  { to: "/schedule", label: "Week", icon: CalendarDays },
] as const;

const MORE = [
  { to: "/assist", label: "Bench", icon: Sparkles },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/sitemaps", label: "Images", icon: ImageIcon },
  { to: "/connectors", label: "Connect", icon: Plug },
  { to: "/playbook", label: "Playbook", icon: BookOpen },
] as const;

const ALL = [...WORK, ...MORE];

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: (typeof ALL)[number]["to"];
  label: string;
  icon: (typeof ALL)[number]["icon"];
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${
        active ? "bg-brass text-ink" : "text-muted hover:bg-surface hover:text-fg"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const chat = path === "/chat";
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((link) => link.to === path);
  const here = ALL.find((link) => link.to === path)?.label ?? "Studio";

  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  return (
    <div className="min-h-screen bg-bg text-fg lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line px-3 py-6 lg:flex">
        <div className="px-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Studio</p>
          <p className="font-display text-3xl leading-none text-fg">Grow 10x</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs uppercase tracking-[0.16em] text-muted">Work</p>
          {WORK.map((link) => (
            <NavLink key={link.to} {...link} active={path === link.to} />
          ))}
          <p className="mt-5 px-3 pb-1 text-xs uppercase tracking-[0.16em] text-muted">Tools</p>
          {MORE.map((link) => (
            <NavLink key={link.to} {...link} active={path === link.to} />
          ))}
        </nav>
        <p className="mt-auto px-3 pt-6 text-sm text-muted">Nothing posts until you approve it.</p>
      </aside>

      <div className={`flex min-h-screen flex-col ${chat ? "pb-16 lg:pb-0" : "pb-20 lg:pb-0"}`}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg px-4 py-3 lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Studio</p>
            <p className="font-display text-2xl leading-none">Grow 10x</p>
          </div>
          <p className="max-w-36 text-right text-xs text-muted">{here}</p>
        </header>
        <main className={chat ? "desk-chat flex min-h-0 flex-1 flex-col px-4 py-4 lg:px-8" : "mx-auto w-full max-w-5xl flex-1 px-4 py-6 lg:px-8 lg:py-8"}>
          {children}
        </main>

        {moreOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 bg-bg/70 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
        )}
        {moreOpen && (
          <div className="fixed inset-x-3 bottom-20 z-30 rounded-[var(--radius)] border border-line bg-surface p-2 lg:hidden">
            {MORE.map((link) => (
              <NavLink key={link.to} {...link} active={path === link.to} />
            ))}
          </div>
        )}
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-bg lg:hidden">
          {WORK.filter((link) => ["/", "/chat", "/pipeline", "/schedule"].includes(link.to)).map((link) => {
            const active = path === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${active ? "text-brass" : "text-muted"}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${moreActive || moreOpen ? "text-brass" : "text-muted"}`}
          >
            <Ellipsis className="h-4 w-4" aria-hidden />
            More
          </button>
        </nav>
      </div>
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
