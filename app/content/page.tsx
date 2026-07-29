"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/app/components/api-client";
import type { Client, SourceContent } from "@/lib/types";

export default function ContentListPage() {
  const [content, setContent] = useState<SourceContent[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [cRes, clRes] = await Promise.all([
          apiFetch("/api/content"),
          apiFetch("/api/clients"),
        ]);
        const cData = await cRes.json();
        const clData = await clRes.json();
        setContent(cData.content || []);
        const map: Record<string, Client> = {};
        for (const c of clData.clients || []) map[c.id] = c;
        setClients(map);
      } catch {
        setError("Failed to load content");
      }
    }
    load();
  }, []);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Content pipeline</h1>
          <p className="lede">Source items moving through repurpose → schedule.</p>
        </div>
        <Link className="btn" href="/content/new">
          New source
        </Link>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        {content.length === 0 ? (
          <p className="muted">No content yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {content
                .slice()
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/content/${item.id}`}>{item.title}</Link>
                    </td>
                    <td className="muted">
                      {clients[item.clientId]?.name || item.clientId.slice(0, 8)}
                    </td>
                    <td>
                      <span className={`badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="muted mono">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
