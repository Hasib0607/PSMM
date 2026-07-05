export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok";

export interface PlatformPostVersion {
  caption: string;
  hashtags?: string[];
  title?: string;
  description?: string;
  tags?: string[];
  hook?: string;
}

export interface PlatformVersions {
  facebook: PlatformPostVersion;
  instagram: PlatformPostVersion;
  linkedin: PlatformPostVersion;
  youtube: PlatformPostVersion;
  tiktok: PlatformPostVersion;
}

export interface BrandProfileInput {
  profession?: string;
  niche?: string;
  targetAudience?: string;
  brandTone?: string;
  language?: string;
  contentPillars?: string[];
  defaultPostTarget?: number;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  screenshotPath?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
  sentiment?: "positive" | "neutral" | "negative" | "question" | "toxic";
}

export interface ReplyResult {
  success: boolean;
  error?: string;
}

export interface HealthStatus {
  healthy: boolean;
  message: string;
  needsReauth?: boolean;
}

export interface DraftInput {
  sourceIdea: string;
  platformVersions: PlatformVersions;
  inputSource?: "manual" | "inbox" | "voice" | "url" | "occasion" | "batch";
  occasionTag?: string;
}

export interface SpecialDayView {
  id: string;
  name: string;
  nameBn?: string | null;
  category: string;
  month?: number | null;
  day?: number | null;
  description?: string | null;
}
