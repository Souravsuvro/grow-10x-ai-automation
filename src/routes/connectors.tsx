import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Panel } from "@/components/shell";
import { getConnectorReadiness } from "@/lib/app-data/readiness";

export const Route = createFileRoute("/connectors")({
  component: ConnectorsPage,
});

const TOOLS = [
  {
    name: "Buffer",
    use: "Put an approved post on the calendar. This studio queues the draft. Buffer is where it goes live.",
    prompt: "Write a Buffer-ready caption and a first comment for this offer. Do not claim it is scheduled.",
  },
  {
    name: "Canva",
    use: "Turn a design note into a still. Bench can also draw one image with Grok when you choose that lane.",
    prompt: "Write a Canva brief: size, headline, one photo direction, and what text must not be in the picture.",
  },
  {
    name: "Google Drive",
    use: "Keep brand files and photos. Attach Drive in the Grok preview. This page only checks whether that token is present.",
    prompt: "List the files I should pull from Drive before writing a homepage: logo, photos, hours, and the real address.",
  },
  {
    name: "HubSpot",
    use: "Draft a lead note from a comment or form. This chat does not write into HubSpot.",
    prompt: "Turn this enquiry into a short HubSpot note: what they asked, the next step, and what we do not know yet.",
  },
  {
    name: "GitHub",
    use: "The website source lives in a repo. Chat can draft the page. It does not push code.",
    prompt: "Draft the homepage sections a developer can paste. Mark every fact that still needs a source.",
  },
  {
    name: "X Ads",
    use: "Score and rewrite an ad. Creating the campaign stays in X Ads.",
    prompt: "Score this ad on hook, offer, proof, and call to action. Rewrite one line. Do not invent results.",
  },
  {
    name: "HeyGen",
    use: "A 6-second script for a talking clip. Bench can render a short Grok clip. HeyGen stays on its own account.",
    prompt: "Write a 6-second spoken line and an on-screen caption. No logos. Nothing is posted.",
  },
  {
    name: "Notion",
    use: "Keep the brief. Paste a chat answer into a page. This app does not store the Notion key.",
    prompt: "Turn this brief into a one-page Notion outline: audience, offer, proof, and the page we should write next.",
  },
  {
    name: "Ad accounts",
    use: "Google, X, Apple, Microsoft, Yahoo, and YouTube stay in their own accounts. Chat writes the variants, the rewrite, the test, and a read of numbers you paste. It does not spend.",
    prompt: "Create two ad variants. Name the platform I should paste them into. Hook, offer, proof, one call to action. Do not invent results. Offer:\n",
  },
  {
    name: "Meta",
    use: "Facebook and Instagram copy is a draft. Nothing is published from this studio.",
    prompt: "Create two Meta posts, one for Facebook and one for Instagram. Do not claim they are published. Offer:\n",
  },
  {
    name: "Mail",
    use: "Google Contacts, Apple Contacts, and lead lists are not imported. Chat drafts one email with a name placeholder. You send it from your own inbox or CRM.",
    prompt: "Draft one follow-up email I will send myself. Use {{first_name}}. Do not ask for a contact list. Do not say it was sent. Offer:\n",
  },
  {
    name: "Reviews",
    use: "An honest ask you send yourself. The desk never demands five stars or offers a reward for a review.",
    prompt: "Draft a short honest review ask I will send myself. Do not demand five stars. Do not offer a discount, gift, or entry. Do not say a review was posted.",
  },
] as const;

function ConnectorsPage() {
  const check = useServerFn(getConnectorReadiness);
  const [drive, setDrive] = useState<"checking" | "ready" | "missing">("checking");

  useEffect(() => {
    void check()
      .then((result) => setDrive(result.ready ? "ready" : "missing"))
      .catch(() => setDrive("missing"));
  }, [check]);

  return (
    <Shell>
      <div className="mb-6 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.16em] text-sage">Connect</p>
        <h2 className="font-display text-4xl">Attach the tools beside this preview</h2>
        <p className="mt-2 text-sm text-muted">
          Keys stay in Grok. This studio never asks for a password, and it does not import an address book. Use a card to drop a starting prompt into Chat.
          {drive === "ready" ? " Google Drive is available in this preview." : " Google Drive is not attached in this preview yet."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <Panel key={tool.name} title={tool.name}>
            <p className="text-sm text-fg">{tool.use}</p>
            <Link
              to="/chat"
              search={{ prompt: tool.prompt }}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brass px-4 text-sm font-medium text-ink"
            >
              Add to chat
            </Link>
          </Panel>
        ))}
      </div>
    </Shell>
  );
}
