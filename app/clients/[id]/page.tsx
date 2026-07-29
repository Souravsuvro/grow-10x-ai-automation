"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { SecretBar, apiFetch } from "@/app/components/api-client";
import type { Client } from "@/lib/types";

export default function ClientDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await apiFetch(`/api/clients/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Not found");
      return;
    }
    setClient(data.client);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!client) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/api/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: client.name,
          brandVoice: client.brandVoice,
          platforms: client.platforms,
          scheduleDefaults: client.scheduleDefaults,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setClient(data.client);
    } finally {
      setSaving(false);
    }
  }

  if (!client && !error) {
    return <p className="muted">Loading…</p>;
  }

  if (!client) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="stack">
      <div>
        <Link href="/clients" className="muted">
          ← Clients
        </Link>
        <h1>{client.name}</h1>
        <p className="lede mono">{client.slug}</p>
      </div>
      <SecretBar />
      {error && <p className="error">{error}</p>}

      <form className="card stack" onSubmit={onSave}>
        <label>
          Name
          <input
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
          />
        </label>
        <div className="row">
          <label>
            Tone
            <input
              value={client.brandVoice.tone}
              onChange={(e) =>
                setClient({
                  ...client,
                  brandVoice: { ...client.brandVoice, tone: e.target.value },
                })
              }
            />
          </label>
          <label>
            Audience
            <input
              value={client.brandVoice.audience}
              onChange={(e) =>
                setClient({
                  ...client,
                  brandVoice: {
                    ...client.brandVoice,
                    audience: e.target.value,
                  },
                })
              }
            />
          </label>
        </div>
        <label>
          Guidelines
          <textarea
            value={client.brandVoice.guidelines}
            onChange={(e) =>
              setClient({
                ...client,
                brandVoice: {
                  ...client.brandVoice,
                  guidelines: e.target.value,
                },
              })
            }
          />
        </label>

        <h2>Platforms & Postiz IDs</h2>
        {client.platforms.map((p, idx) => (
          <div key={p.platform} className="row">
            <label style={{ flex: "0 0 auto", minWidth: 120 }}>
              <span className="row" style={{ gap: "0.4rem" }}>
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={(e) => {
                    const platforms = [...client.platforms];
                    platforms[idx] = { ...p, enabled: e.target.checked };
                    setClient({ ...client, platforms });
                  }}
                />
                {p.platform}
              </span>
            </label>
            <label>
              Postiz integration ID
              <input
                value={p.postizIntegrationId || ""}
                onChange={(e) => {
                  const platforms = [...client.platforms];
                  platforms[idx] = {
                    ...p,
                    postizIntegrationId: e.target.value,
                  };
                  setClient({ ...client, platforms });
                }}
              />
            </label>
          </div>
        ))}

        <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={Boolean(client.scheduleDefaults?.autoSchedule)}
            onChange={(e) =>
              setClient({
                ...client,
                scheduleDefaults: {
                  timezone: "UTC",
                  preferredHours: [9, 12, 17],
                  ...client.scheduleDefaults,
                  autoSchedule: e.target.checked,
                },
              })
            }
          />
          Auto-schedule after repurpose
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
