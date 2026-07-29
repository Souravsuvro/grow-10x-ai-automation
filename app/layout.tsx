import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grow 10x — Content Hub",
  description:
    "Local-first multi-client content automation with Grok, n8n, and Postiz",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              Grow <span>10x</span> Content Hub
            </Link>
            <nav>
              <Link href="/">Dashboard</Link>
              <Link href="/clients">Clients</Link>
              <Link href="/content">Content</Link>
              <Link href="/content/new">New source</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
