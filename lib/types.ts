export type Platform =
  | "x"
  | "linkedin"
  | "instagram"
  | "threads"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "bluesky"
  | "reddit";

export type BrandVoice = {
  tone: string;
  audience: string;
  guidelines: string;
  keywords?: string[];
};

export type PlatformConfig = {
  platform: Platform;
  enabled: boolean;
  postizIntegrationId?: string;
  handle?: string;
};

export type ScheduleDefaults = {
  timezone?: string;
  preferredHours?: number[];
  autoSchedule?: boolean;
};

export type Client = {
  id: string;
  name: string;
  slug: string;
  brandVoice: BrandVoice;
  platforms: PlatformConfig[];
  scheduleDefaults?: ScheduleDefaults;
  createdAt: string;
  updatedAt: string;
};

export type ContentStatus = "draft" | "repurposing" | "ready" | "scheduled" | "failed";

export type SourceContent = {
  id: string;
  clientId: string;
  title: string;
  body: string;
  status: ContentStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedPost = {
  platform: Platform;
  content: string;
  hashtags?: string[];
  cta?: string;
  title?: string;
};

export type Draft = {
  id: string;
  contentId: string;
  clientId: string;
  posts: GeneratedPost[];
  summary?: string;
  status: "ready" | "scheduled" | "failed";
  postizIds?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type RepurposeResult = {
  posts: GeneratedPost[];
  summary?: string;
};

export const PLATFORMS: Platform[] = [
  "x",
  "linkedin",
  "instagram",
  "threads",
  "tiktok",
  "youtube",
  "facebook",
  "bluesky",
  "reddit",
];
