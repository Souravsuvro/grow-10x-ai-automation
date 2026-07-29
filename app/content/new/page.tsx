"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SecretBar, apiFetch } from "@/app/components/api-client";
import type { Client } from "@/lib/types";

export default function NewContentPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients || []);
        if (data.clients?.[0]) setClientId(data.clients[0].id);
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/content", {
        method: "POST",
        body: JSON.stringify({ clientId, title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Create failed — check app secret");
        return;
      }
      router.push(`/content/${data.content.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>New source content</h1>
        <p className="lede">
          Paste a blog post, transcript, or brief. Repurpose next.
        </p>
      </div>
      <SecretBar />
      {error && <p className="error">{error}</p>}

      {clients.length === 0 ? (
        <div className="card">
          <p className="muted">
            Create a client first, then come back to add content.
          </p>
        </div>
      ) : (
        <form className="card stack" onSubmit={onSubmit}>
          <label>
            Client
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly ops newsletter #12"
            />
          </label>
          <label>
            Body
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste source content…"
              style={{ minHeight: 220 }}
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save source"}
          </button>
        </form>
      )}
    </div>
  );
}
