# Grow 10x

Content studio for multi-client social drafts. Intake a source, draft with Grok 4.5, approve, and queue a seven-day window.

The published app uses Neon Postgres. The preview uses an embedded database with the same schema (`migrations/0002_grow.sql`).

AI calls go to Grok 4.5 only when you press **Draft with Grok**. If that model is unavailable, Studio saves a labeled structured draft and can copy a prompt for ChatGPT, Gemini, Perplexity, or DeepSeek.

The Bench tab adds a free prompt pack (paste into Perplexity, ChatGPT, or Midjourney) and a Grok lane for research, ads, posts, replies, one still, and one 6-second clip. Those other products are not called from this app. Nothing posts itself.

Chat drafts websites, ads, Meta posts, research, design briefs, and one email you send yourself. It does not sign into accounts, import contacts, or publish.
