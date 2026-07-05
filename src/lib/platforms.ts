import { z } from "zod";

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "tiktok",
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number];

export const PlatformsSchema = z
  .array(z.enum(SOCIAL_PLATFORMS))
  .min(1, "Select at least one platform");

export function parsePlatforms(platforms: string[]) {
  return PlatformsSchema.safeParse(platforms);
}
