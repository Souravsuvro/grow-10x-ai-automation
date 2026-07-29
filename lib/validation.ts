import { z } from "zod";
import type { Platform } from "./types";
import { PLATFORMS } from "./types";

export const platformSchema = z.custom<Platform>(
  (val): val is Platform =>
    typeof val === "string" && (PLATFORMS as string[]).includes(val)
);

export const brandVoiceSchema = z.object({
  tone: z.string().min(1),
  audience: z.string().min(1),
  guidelines: z.string().min(1),
  keywords: z.array(z.string()).optional(),
});

export const platformConfigSchema = z.object({
  platform: platformSchema,
  enabled: z.boolean(),
  postizIntegrationId: z.string().optional(),
  handle: z.string().optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  brandVoice: brandVoiceSchema,
  platforms: z.array(platformConfigSchema).min(1),
  scheduleDefaults: z
    .object({
      timezone: z.string().optional(),
      preferredHours: z.array(z.number().int().min(0).max(23)).optional(),
      autoSchedule: z.boolean().optional(),
    })
    .optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const createContentSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

export const updateDraftSchema = z.object({
  posts: z
    .array(
      z.object({
        platform: platformSchema,
        content: z.string(),
        hashtags: z.array(z.string()).optional(),
        cta: z.string().optional(),
        title: z.string().optional(),
      })
    )
    .optional(),
  status: z.enum(["ready", "scheduled", "failed"]).optional(),
  summary: z.string().optional(),
});

export const scheduleDraftSchema = z.object({
  type: z.enum(["schedule", "now"]).optional(),
  date: z.string().datetime().optional(),
});
