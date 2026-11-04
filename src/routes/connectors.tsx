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
    name: "Gmail",
    use: "Drafts stay here. You send from Gmail yourself. Contacts are never imported.",
    prompt: "Draft one follow-up email I will send myself. Use {{first_name}}. Do not ask for a contact list. Do not say it was sent. Offer:\n",
  },
  {
    name: "Google Calendar",
    use: "Care scripts can ask for a preferred time. Booking confirmation stays in your calendar app.",
    prompt: "Draft a booking reply that asks for name, phone, preferred time, and location. Do not invent availability or confirm a booking.",
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
    name: "Google Ads",
    use: "Search and local intent variants, rewrites, tests, and a read of numbers you paste. Campaign creation stays in Google Ads.",
    prompt: "Create two Google Ads search variants with local intent. Hook, offer, proof, one call to action. Do not invent results. Offer:\n",
  },
  {
    name: "Meta Ads",
    use: "Facebook and Instagram copy and ad text are drafts. Nothing is published or spent from this studio.",
    prompt: "Create two Meta ad variants for Facebook and Instagram. Hook, offer, proof, one call to action. Do not invent results. Offer:\n",
  },
  {
    name: "Business listings",
    use: "GBP, Apple Business Connect, and Bing Places copy is drafted here. You claim and edit listings in each portal.",
    prompt: "Draft Google Business Profile copy: primary category, services, description under 750 characters, and three Q and A pairs. Flag missing hours, phone, or address. Do not invent NAP.",
  },
  {
    name: "Care operator",
    use: "Scripts for booking, price questions, delays, and after hours. A human or your own agent sends them.",
    prompt: "Write a five-line care operator script for this studio: greeting, clarify need, collect details, next step, close. No invented offers.",
  },
  {
    name: "SEO and GEO",
    use: "Local keywords, article outlines, and technical checks. Rankings are never invented.",
    prompt: "Outline one short article that could earn a citation in AI search: title, three section headings, and a FAQ of five questions. Prefer long-tail local commercial intent. Do not invent rankings.",
  },
  {
    name: "Mail and reviews",
    use: "Google Contacts and lead lists are not imported. Chat drafts one email or an honest review ask. You send it yourself.",
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
        <h2 className="font-display text-4xl">Tools beside the desk</h2>
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
