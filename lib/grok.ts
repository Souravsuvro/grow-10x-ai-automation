import { promises as fs } from "fs";
import path from "path";
import type { Client, RepurposeResult, SourceContent } from "./types";

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function loadRepurposePrompt(): Promise<string> {
  const file = path.join(process.cwd(), "prompts", "repurpose-grok.md");
  return fs.readFile(file, "utf8");
}

export async function buildRepurposeMessages(
  client: Client,
  content: SourceContent
): Promise<{ system: string; user: string }> {
  const template = await loadRepurposePrompt();
  const platforms = client.platforms
    .filter((p) => p.enabled)
    .map((p) => p.platform)
    .join(", ");

  const filled = fillTemplate(template, {
    client_name: client.name,
    tone: client.brandVoice.tone,
    audience: client.brandVoice.audience,
    guidelines: client.brandVoice.guidelines,
    keywords: (client.brandVoice.keywords || []).join(", "),
    platforms: platforms || "x, linkedin",
    source_content: `# ${content.title}\n\n${content.body}`,
  });

  return {
    system:
      "You repurpose marketing content into platform-specific social posts. Always respond with valid JSON only.",
    user: filled,
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Grok response was not valid JSON");
    return JSON.parse(match[0]);
  }
}

export async function repurposeWithGrok(
  client: Client,
  content: SourceContent
): Promise<RepurposeResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not set");
  }
  const model = process.env.XAI_MODEL || "grok-2-latest";
  const { system, user } = await buildRepurposeMessages(client, content);

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Grok API error ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Grok response");

  const parsed = extractJson(text) as RepurposeResult;
  if (!parsed?.posts || !Array.isArray(parsed.posts)) {
    throw new Error("Grok JSON missing posts array");
  }
  return parsed;
}
