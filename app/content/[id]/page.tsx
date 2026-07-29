"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SecretBar, apiFetch } from "@/app/components/api-client";
import type { Draft, SourceContent } from "@/lib/types";

export default function ContentDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [content, setContent] = useState<SourceContent | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const res = await apiFetch(`/api/content/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Not found");
      return;
    }
    setContent(data.content);
    setDrafts(data.drafts || []);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function repurpose() {
    setBusy("repurpose");
    setError("");
    try {
      const res = await apiFetch(`/api/content/${id}/repurpose`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Repurpose failed");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  async function schedule(draftId: string) {
    setBusy(draftId);
    setError("");
    try {
      const res = await apiFetch(`/api/drafts/${draftId}/schedule`, {
        method: "POST",
        body: JSON.stringify({ type: "schedule" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Schedule failed");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  if (!content && !error) return <p className="muted">Loading…</p>;
  if (!content) return <p className="error">{error}</p>;

  return (
    <div className="stack">
      <div>
        <Link href="/content" className="muted">
          ← Content
        </Link>
        <h1>{content.title}</h1>
        <p className="lede">
          Status:{" "}
          <span className={`badge ${content.status}`}>{content.status}</span>
        </p>
      </div>
      <SecretBar />
      {error && <p className="error">{error}</p>}
      {content.error && <p className="error">{content.error}</p>}

      <div className="row">
        <button
          type="button"
          onClick={repurpose}
          disabled={busy === "repurpose"}
        >
          {busy === "repurpose" ? "Repurposing…" : "Repurpose with Grok / n8n"}
        </button>
      </div>

      <div className="card">
        <h2>Source</h2>
        <div className="draft-post">{content.body}</div>
      </div>

      <div className="stack">
        <h2>Drafts ({drafts.length})</h2>
        {drafts.length === 0 && (
          <p className="muted">No drafts yet — run repurpose.</p>
        )}
        {drafts
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((draft) => (
            <div key={draft.id} className="card stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <span className={`badge ${draft.status}`}>{draft.status}</span>
                  {draft.summary && (
                    <span className="muted" style={{ marginLeft: "0.75rem" }}>
                      {draft.summary}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy === draft.id || draft.status === "scheduled"}
                  onClick={() => schedule(draft.id)}
                >
                  {busy === draft.id ? "Scheduling…" : "Schedule to Postiz"}
                </button>
              </div>
              {draft.error && <p className="error">{draft.error}</p>}
              {draft.posts.map((post, i) => (
                <div key={`${draft.id}-${post.platform}-${i}`}>
                  <strong>{post.platform}</strong>
                  {post.title && (
                    <div className="muted">Title: {post.title}</div>
                  )}
                  <div className="draft-post">{post.content}</div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
