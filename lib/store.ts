import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type { Client, Draft, SourceContent } from "./types";

function dataDir(): string {
  return path.resolve(process.env.DATA_DIR || "./data");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function clientsFile() {
  return path.join(dataDir(), "clients.json");
}
function contentFile() {
  return path.join(dataDir(), "content.json");
}
function draftsFile() {
  return path.join(dataDir(), "drafts.json");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "client";
}

export async function listClients(): Promise<Client[]> {
  return readJson<Client[]>(clientsFile(), []);
}

export async function getClient(id: string): Promise<Client | undefined> {
  const all = await listClients();
  return all.find((c) => c.id === id);
}

export async function createClient(
  input: Omit<Client, "id" | "slug" | "createdAt" | "updatedAt"> & { slug?: string }
): Promise<Client> {
  const all = await listClients();
  const now = new Date().toISOString();
  let slug = input.slug || slugify(input.name);
  const taken = new Set(all.map((c) => c.slug));
  if (taken.has(slug)) {
    slug = `${slug}-${uuid().slice(0, 6)}`;
  }
  const client: Client = {
    id: uuid(),
    name: input.name,
    slug,
    brandVoice: input.brandVoice,
    platforms: input.platforms,
    scheduleDefaults: input.scheduleDefaults,
    createdAt: now,
    updatedAt: now,
  };
  all.push(client);
  await writeJson(clientsFile(), all);
  return client;
}

export async function updateClient(
  id: string,
  patch: Partial<Omit<Client, "id" | "createdAt">>
): Promise<Client | null> {
  const all = await listClients();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const existing = all[idx];
  const updated: Client = {
    ...existing,
    ...patch,
    brandVoice: patch.brandVoice
      ? { ...existing.brandVoice, ...patch.brandVoice }
      : existing.brandVoice,
    scheduleDefaults:
      patch.scheduleDefaults !== undefined
        ? {
          timezone: "UTC",
          preferredHours: [9, 12, 17],
          ...existing.scheduleDefaults,
          ...patch.scheduleDefaults,
        }
        : existing.scheduleDefaults,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await writeJson(clientsFile(), all);
  return updated;
}

export async function deleteClient(id: string): Promise<boolean> {
  const all = await listClients();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeJson(clientsFile(), next);
  return true;
}

export async function listContent(clientId?: string): Promise<SourceContent[]> {
  const all = await readJson<SourceContent[]>(contentFile(), []);
  if (!clientId) return all;
  return all.filter((c) => c.clientId === clientId);
}

export async function getContent(id: string): Promise<SourceContent | undefined> {
  const all = await listContent();
  return all.find((c) => c.id === id);
}

export async function createContent(input: {
  clientId: string;
  title: string;
  body: string;
}): Promise<SourceContent> {
  const all = await listContent();
  const now = new Date().toISOString();
  const item: SourceContent = {
    id: uuid(),
    clientId: input.clientId,
    title: input.title,
    body: input.body,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  all.push(item);
  await writeJson(contentFile(), all);
  return item;
}

export async function updateContent(
  id: string,
  patch: Partial<Omit<SourceContent, "id" | "createdAt">>
): Promise<SourceContent | null> {
  const all = await listContent();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const updated: SourceContent = {
    ...all[idx],
    ...patch,
    id: all[idx].id,
    createdAt: all[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await writeJson(contentFile(), all);
  return updated;
}

export async function deleteContent(id: string): Promise<boolean> {
  const all = await listContent();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeJson(contentFile(), next);
  return true;
}

export async function listDrafts(contentId?: string): Promise<Draft[]> {
  const all = await readJson<Draft[]>(draftsFile(), []);
  if (!contentId) return all;
  return all.filter((d) => d.contentId === contentId);
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  const all = await listDrafts();
  return all.find((d) => d.id === id);
}

export async function createDraft(
  input: Omit<Draft, "id" | "createdAt" | "updatedAt">
): Promise<Draft> {
  const all = await listDrafts();
  const now = new Date().toISOString();
  const draft: Draft = {
    ...input,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
  };
  all.push(draft);
  await writeJson(draftsFile(), all);
  return draft;
}

export async function updateDraft(
  id: string,
  patch: Partial<Omit<Draft, "id" | "createdAt">>
): Promise<Draft | null> {
  const all = await listDrafts();
  const idx = all.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  const updated: Draft = {
    ...all[idx],
    ...patch,
    id: all[idx].id,
    createdAt: all[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await writeJson(draftsFile(), all);
  return updated;
}
