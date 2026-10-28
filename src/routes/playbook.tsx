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
    title: "What the model is told",
    body: "Every draft call includes the business category, audience, locations, brand voice, platform rules, and the source paragraph. LinkedIn stays longer and specific. Instagram stays short. X stays under 250 characters. YouTube returns a title plus a two-sentence description.",
  },
  {
    title: "When Grok is rate-limited",
    body: "Use Copy prompt for another model and paste it into ChatGPT, Gemini, Perplexity, or DeepSeek. Those tools are not called from this app, so their keys never sit here. If Grok is unavailable, Studio still saves a clearly labeled structured draft.",
  },
  {
    title: "Bench",
    body: "Research, copy, ads with an optimization pass, posts, comment replies, and a seven-day engagement plan. The free lane builds a prompt for Perplexity, ChatGPT, or Midjourney and does not call them. List prices on the bench are a mid-October 2026 snapshot, not a quote. The Grok lane writes with Grok 4.5, draws one still, or cuts one 6-second clip, and spends the workspace quota only when you press the button. Prepare share drafts writes LinkedIn, Instagram, and X copies into Studio. Approve them before Week will queue anything. Nothing is posted from Bench.",
  },
  {
    title: "Chat",
    body: "Chat drafts websites, ads, Meta posts, research, design briefs, and outreach. Six desks sit above the box. A prompt fills the message. Send spends the Grok quota once. Ads cover Google, X, Apple, Microsoft, Yahoo, and YouTube: two variants, one rewrite, a test plan, or an analysis of numbers you paste. Research does not invent rankings or revenue. Outreach drafts one email with a name placeholder and an honest review ask that never demands five stars or a reward. Chat does not sign into browsers, import contacts, send mail, or publish. If Grok is unavailable, the desk saves a labeled checklist instead of a fake reply.",
  },
  {
    title: "Connect",
    body: "Buffer, Canva, Drive, HubSpot, GitHub, X Ads, HeyGen, and Notion attach in Grok beside this preview. This app does not store those keys. Add to chat only drops a starting prompt. Google Contacts, Apple Contacts, and lead lists are not imported. Mail and review asks stay drafts you send yourself.",
  },
  {
    title: "What is stored",
    body: "Studios, source copy, drafts, a seven-day queue, image records, bench runs, chat, and an activity log. Preview uses an embedded database. The published app uses Neon Postgres. There is no sign-in on this build, so do not paste private customer records, contact lists, or review incentives.",
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
