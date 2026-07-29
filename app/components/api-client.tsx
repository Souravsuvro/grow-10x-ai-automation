"use client";

import { useEffect, useState } from "react";

const KEY = "grow10x_app_secret";

export function getStoredSecret(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) || "";
}

export function setStoredSecret(value: string) {
  localStorage.setItem(KEY, value);
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const secret = getStoredSecret();
  if (secret) headers.set("x-app-secret", secret);
  return fetch(path, { ...init, headers });
}

export function SecretBar() {
  const [secret, setSecret] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSecret(getStoredSecret());
  }, []);

  return (
    <div className="secret-bar">
      <label style={{ flex: 2 }}>
        App secret (x-app-secret)
        <input
          type="password"
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value);
            setSaved(false);
          }}
          placeholder="Matches APP_SECRET in .env.local"
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          setStoredSecret(secret);
          setSaved(true);
        }}
      >
        Save locally
      </button>
      {saved && <span className="muted">Saved</span>}
    </div>
  );
}
