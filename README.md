# Grow 10x AI Automation

Local-first content automation for multi-client social publishing: **content hub → Grok repurposing → Postiz scheduling**, with optional **n8n** orchestration.

## What you get

- Next.js **Content Hub** — manage clients, submit source content, review drafts
- **Grok (xAI)** repurposing with per-client brand voice
- **Postiz** API scheduling (self-hosted or cloud)
- Importable **n8n workflow** for webhook-driven automation
- Docker Compose for **n8n** (Postiz uses the official compose — see below)

## Quick start

### 1. Content Hub

```bash
cp .env.example .env.local
# set APP_SECRET, XAI_API_KEY, POSTIZ_API_KEY, POSTIZ_BASE_URL

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Protect API writes with header: `x-app-secret: <APP_SECRET>`.

### 2. n8n

```bash
docker compose up -d
```

n8n: [http://localhost:5678](http://localhost:5678)

Import [`workflows/repurpose-to-postiz.json`](workflows/repurpose-to-postiz.json).  
Install community node `n8n-nodes-postiz` (Settings → Community Nodes) if you use the Postiz node path.

Set workflow env / credentials:

- `XAI_API_KEY`
- Postiz API key
- Optional webhook secret matching `N8N_WEBHOOK_SECRET`

### 3. Postiz (self-hosted)

Postiz needs Postgres + Redis + Temporal. Use the official stack:

```bash
git clone https://github.com/gitroomhq/postiz-docker-compose.git
cd postiz-docker-compose
# edit JWT_SECRET and URLs in docker-compose.yaml
docker compose up -d
```

UI: [http://localhost:4007](http://localhost:4007)  
Create an API key under **Settings → Developers → Public API**, then set `POSTIZ_API_KEY` and `POSTIZ_BASE_URL=http://localhost:4007` in `.env.local`.

Or point `POSTIZ_BASE_URL` at [Postiz Cloud](https://platform.postiz.com) (`https://api.postiz.com`).

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Content Hub    │────▶│ Grok (xAI)   │────▶│   Drafts    │
│  Next.js :3000  │     │  or n8n      │     │             │
└────────┬────────┘     └──────────────┘     └──────┬──────┘
         │                                          │
         │  REPURPOSE_MODE=n8n                      ▼
         └──────────────▶ n8n :5678  ──────▶  Postiz :4007
```

| Mode | Behavior |
|------|----------|
| `REPURPOSE_MODE=direct` (default) | Hub calls Grok, stores drafts; schedule via Postiz API |
| `REPURPOSE_MODE=n8n` | Hub POSTs to n8n webhook; workflow does Grok + Postiz |

## Multi-client config

Each client stores brand voice + platform → Postiz integration IDs.  
Schema: [`config-schema.json`](config-schema.json).  
Data lives under `DATA_DIR` (default `./data`) as JSON — local-first, no DB required.

## Folder layout

```
app/                 Next.js App Router UI + API
lib/                 store, Grok, Postiz, auth, types
prompts/             Grok prompt templates
workflows/           n8n workflow exports
data/                runtime JSON (gitignored)
config-schema.json   client config JSON Schema
docker-compose.yml   n8n (+ optional postgres profile)
```

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/clients` | List / create clients |
| GET/PATCH/DELETE | `/api/clients/:id` | Client CRUD |
| GET/POST | `/api/content` | List / create source content |
| GET/DELETE | `/api/content/:id` | Content item |
| POST | `/api/content/:id/repurpose` | Run Grok (or n8n) |
| GET/PATCH | `/api/drafts/:id` | Draft status / edit |
| POST | `/api/drafts/:id/schedule` | Push to Postiz |

All mutating requests require `x-app-secret`.

## License

Private / as configured by the repository owner.
