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
    title: "What is stored",
    body: "Studios, source copy, drafts, a seven-day queue, image records, and an activity log. Preview uses an embedded database. The published app uses Neon Postgres. There is no sign-in on this build, so do not paste private customer records.",
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
