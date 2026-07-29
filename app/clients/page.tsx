"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { SecretBar, apiFetch } from "@/app/components/api-client";
import type { Client, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";

const defaultPlatforms = PLATFORMS.map((platform) => ({
  platform,
  enabled: platform === "x" || platform === "linkedin",
  postizIntegrationId: "",
  handle: "",
}));

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [tone, setTone] = useState("clear and confident");
  const [audience, setAudience] = useState("founders and operators");
  const [guidelines, setGuidelines] = useState(
    "No hype. Short sentences. End with a concrete CTA when relevant."
  );
  const [keywords, setKeywords] = useState("");
  const [platforms, setPlatforms] = useState(defaultPlatforms);
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name,
          brandVoice: {
            tone,
            audience,
            guidelines,
            keywords: keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
          },
          platforms: platforms.map((p) => ({
            platform: p.platform as Platform,
            enabled: p.enabled,
            postizIntegrationId: p.postizIntegrationId || undefined,
            handle: p.handle || undefined,
          })),
          scheduleDefaults: {
            timezone: "UTC",
            preferredHours: [9, 12, 17],
            autoSchedule,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Create failed — check app secret");
        return;
      }
      setName("");
      setKeywords("");
      setPlatforms(defaultPlatforms);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    const res = await apiFetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Delete failed — check app secret");
      return;
    }
    await refresh();
  }

  return (
    <div className="stack">
      <div>
        <h1>Clients</h1>
        <p className="lede">
          Brand voice and Postiz channel IDs per client. Integration IDs come
          from Postiz (Settings → connected channels).
        </p>
      </div>

      <SecretBar />
      {error && <p className="error">{error}</p>}

      <form className="card stack" onSubmit={onCreate}>
        <h2>New client</h2>
        <label>
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Growth"
          />
        </label>
        <div className="row">
          <label>
            Tone
            <input value={tone} onChange={(e) => setTone(e.target.value)} />
          </label>
          <label>
            Audience
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </label>
        </div>
        <label>
          Guidelines
          <textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
          />
        </label>
        <label>
          Keywords (comma-separated)
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="automation, AI, ops"
          />
        </label>

        <div>
          <h2>Platforms</h2>
          <div className="stack">
            {platforms.map((p, idx) => (
              <div key={p.platform} className="row">
                <label style={{ flex: "0 0 auto", minWidth: 120 }}>
                  <span className="row" style={{ gap: "0.4rem" }}>
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => {
                        const next = [...platforms];
                        next[idx] = { ...p, enabled: e.target.checked };
                        setPlatforms(next);
                      }}
                    />
                    {p.platform}
                  </span>
                </label>
                <label>
                  Postiz integration ID
                  <input
                    value={p.postizIntegrationId}
                    disabled={!p.enabled}
                    onChange={(e) => {
                      const next = [...platforms];
                      next[idx] = {
                        ...p,
                        postizIntegrationId: e.target.value,
                      };
                      setPlatforms(next);
                    }}
                    placeholder="uuid from Postiz"
                  />
                </label>
                <label style={{ maxWidth: 160 }}>
                  Handle
                  <input
                    value={p.handle}
                    disabled={!p.enabled}
                    onChange={(e) => {
                      const next = [...platforms];
                      next[idx] = { ...p, handle: e.target.value };
                      setPlatforms(next);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={autoSchedule}
            onChange={(e) => setAutoSchedule(e.target.checked)}
          />
          Auto-schedule to Postiz after repurpose
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create client"}
        </button>
      </form>

      <div className="card">
        <h2>Existing</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="muted">No clients yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Platforms</th>
                <th>Voice</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/clients/${c.id}`}>{c.name}</Link>
                    <div className="muted mono">{c.slug}</div>
                  </td>
                  <td>
                    <div className="platform-list">
                      {c.platforms
                        .filter((p) => p.enabled)
                        .map((p) => (
                          <span key={p.platform} className="platform-chip">
                            {p.platform}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="muted">{c.brandVoice.tone}</td>
                  <td>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDelete(c.id)}
                    >
                      Delete
                    </button>
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
