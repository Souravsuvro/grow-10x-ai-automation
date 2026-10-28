import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, Panel } from "@/components/shell";
import { listImages } from "@/lib/grow/api";

export const Route = createFileRoute("/sitemaps")({
  loader: () => listImages(),
  component: SitemapPage,
});

function xmlFor(origin: string, rows: { page_path: string; image_path: string; title: string; caption: string }[]) {
  const body = rows
    .map(
      (row) => `  <url>
    <loc>${origin}${row.page_path}</loc>
    <image:image>
      <image:loc>${origin}${row.image_path}</image:loc>
      <image:title>${escapeXml(row.title)}</image:title>
      <image:caption>${escapeXml(row.caption)}</image:caption>
    </image:image>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;");
}

function SitemapPage() {
  const images = Route.useLoaderData();
  const [xml, setXml] = useState("");
  const [note, setNote] = useState("");
  return (
    <Shell>
      <Panel title="Image sitemap">
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Built from stored image records. Google expects absolute URLs, a title, and a caption. Copy the file into Search Console. This page does not submit it.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-full bg-brass px-4 text-sm font-medium text-ink"
            onClick={() => {
              setXml(xmlFor(window.location.origin, images));
              setNote("");
            }}
          >
            Build sitemap
          </button>
          {xml && (
            <button
              type="button"
              className="min-h-11 rounded-full border border-line px-4 text-sm text-fg"
              onClick={() => {
                void navigator.clipboard.writeText(xml).then(() => setNote("Sitemap copied."));
              }}
            >
              Copy XML
            </button>
          )}
        </div>
        {note && <p className="mt-3 text-sm text-sage">{note}</p>}
        {images.length === 0 && <p className="mt-6 text-sm text-muted">No image records yet.</p>}
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="overflow-hidden rounded-lg border border-line">
              <img src={image.image_path} alt={image.caption} className="h-28 w-full object-cover" />
              <div className="p-3">
                <p className="text-fg">{image.title}</p>
                <p className="text-sm text-muted">{image.business_name}</p>
              </div>
            </li>
          ))}
        </ul>
        {xml && (
          <textarea readOnly value={xml} rows={14} className="mt-4 w-full rounded-lg border border-line bg-bg p-3 text-xs text-fg" />
        )}
      </Panel>
    </Shell>
  );
}
