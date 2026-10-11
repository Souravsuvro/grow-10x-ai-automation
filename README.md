# Grow 10x

Content studio for multi-client social drafts. Intake a source, draft with Grok 4.5, approve, and queue a seven-day window.

The published app uses Neon Postgres. The preview uses an embedded database with the same schema (`migrations/0002_grow.sql`).

AI calls go to Grok 4.5 only when you press **Draft with Grok**. If that model is unavailable, Studio saves a labeled structured draft and can copy a prompt for ChatGPT, Gemini, Perplexity, or DeepSeek.

Image records can be exported as a Google image sitemap from the Images tab.
