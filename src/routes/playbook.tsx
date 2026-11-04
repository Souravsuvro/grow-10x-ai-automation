import { createFileRoute } from "@tanstack/react-router";
import { Shell, Panel } from "@/components/shell";

export const Route = createFileRoute("/playbook")({
  component: PlaybookPage,
});

const SECTIONS = [
  {
    title: "How a piece moves",
    body: "Intake saves the source. Studio asks Grok 4.5 for three platform-native variants. Pipeline approval is required before Week will accept a queue. Mark published only after the post is actually live.",
  },
  {
    title: "Growth desks in Chat",
    body: "Ten desks sit above the composer: Website, SEO, Listings, Leads, Care, Ads, Meta, Research, Design, and Outreach. SEO and GEO target local long-tail questions and AI-search-ready outlines. Listings draft NAP-safe copy for Google Business Profile, Apple Business Connect, and Bing Places. Leads draft magnets, landing sections, and follow-ups. Care drafts booking and complaint scripts a human or your own agent sends. Ads cover Google, X, Apple, Microsoft, Yahoo, and YouTube with create, optimize, test, and analyze. Nothing is posted, mailed, or spent from the desk.",
  },
  {
    title: "What the model is told",
    body: "Every draft call includes the business category, audience, locations, brand voice, platform rules, and the source paragraph. LinkedIn stays longer and specific. Instagram stays short. X stays under 250 characters. YouTube returns a title plus a two-sentence description. SEO never invents rankings. Listings never invent NAP. Care never invents policy or confirms a booking.",
  },
  {
    title: "When Grok is rate-limited",
    body: "Use Copy prompt for another model and paste it into ChatGPT, Gemini, Perplexity, or DeepSeek. Those tools are not called from this app, so their keys never sit here. If Grok is unavailable, Studio and Chat still save a clearly labeled structured draft or checklist.",
  },
  {
    title: "Bench",
    body: "Research, copy, ads with an optimization pass, posts, comment replies, and a seven-day engagement plan. The free lane builds a prompt for Perplexity, ChatGPT, or Midjourney and does not call them. The Grok lane writes with Grok 4.5, draws one still, or cuts one 6-second clip, and spends the workspace quota only when you press the button. Prepare share drafts writes LinkedIn, Instagram, and X copies into Studio. Approve them before Week will queue anything. Nothing is posted from Bench.",
  },
  {
    title: "Connect",
    body: "Buffer, Canva, Drive, HubSpot, Gmail, Calendar, GitHub, X Ads, HeyGen, Notion, Google Ads, Meta Ads, business listings, care scripts, and SEO prompts attach as starting cards. This app does not store those keys. Add to chat only drops a starting prompt. Google Contacts, Apple Contacts, and lead lists are not imported. Mail and review asks stay drafts you send yourself.",
  },
  {
    title: "Production readiness",
    body: "Preview uses an embedded database. For a durable live site, set DATABASE_URL (Neon Postgres) and XAI_API_KEY on the Vercel project, then redeploy. Auth stays off on this build, so do not paste private customer records or contact lists. Migrations run on build when DATABASE_URL is present.",
  },
  {
    title: "What is stored",
    body: "Studios, source copy, drafts, a seven-day queue, image records, bench runs, chat, and an activity log. There is no sign-in on this build.",
  },
];

function PlaybookPage() {
  return (
    <Shell>
      <div className="grid gap-4">
        {SECTIONS.map((section) => (
          <Panel key={section.title} title={section.title}>
            <p className="max-w-3xl text-sm text-fg">{section.body}</p>
          </Panel>
        ))}
      </div>
    </Shell>
  );
}
