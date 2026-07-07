type JsonRecord = Record<string, unknown>;

export type BrandProfilePromptInput = {
  fullName?: string | null;
  profession?: string | null;
  niche?: string | null;
  tagline?: string | null;
  targetAudience?: string | null;
  audienceDetails?: string | null;
  brandTone?: string | null;
  tone?: string | null;
  language?: string | null;
  contentPillars?: unknown;
  contentPillarDetails?: unknown;
  roles?: unknown;
  niches?: unknown;
  audienceSegments?: unknown;
  personality?: unknown;
  goals?: unknown;
  socialPreferences?: unknown;
  contentPreferences?: unknown;
  references?: unknown;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function asLabelArray(value: unknown, keys: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      const record = asRecord(item);
      const matchingKey = keys.find((key) => typeof record[key] === "string" && String(record[key]).trim());
      return matchingKey ? String(record[matchingKey]) : "";
    })
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPillars(profile: BrandProfilePromptInput) {
  const detailed = Array.isArray(profile.contentPillarDetails)
    ? profile.contentPillarDetails
        .map((item) => {
          const record = asRecord(item);
          const title = String(record.title || "").trim();
          const description = String(record.description || "").trim();
          return title ? (description ? `${title}: ${description}` : title) : "";
        })
        .filter(Boolean)
    : [];

  if (detailed.length > 0) return detailed;
  return asStringArray(profile.contentPillars);
}

function formatGoals(value: unknown): string[] {
  const goals = asRecord(value);
  const primaryGoal = String(goals.primaryGoal || "").trim();
  const otherGoals = asStringArray(goals.otherGoals);
  const timeline = String(goals.timeline || "").trim();
  return [
    primaryGoal ? `Primary: ${primaryGoal}` : "",
    otherGoals.length ? `Other: ${otherGoals.join(", ")}` : "",
    timeline ? `Timeline: ${timeline}` : "",
  ].filter(Boolean);
}

function formatSocialPreferences(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      const name = String(record.name || record.id || "").trim();
      if (!name) return "";
      const enabled = record.enabled === false ? "inactive" : "active";
      const purpose = String(record.purpose || "").trim();
      const focus = String(record.contentFocus || "").trim();
      return `${name} (${enabled}${purpose ? `, purpose: ${purpose}` : ""}${focus ? `, focus: ${focus}` : ""})`;
    })
    .filter(Boolean);
}

function formatContentPreferences(value: unknown): string[] {
  const preferences = asRecord(value);
  const contentTypes = asStringArray(preferences.contentTypes);
  const format = String(preferences.format || "").trim();
  const frequency = String(preferences.frequency || "").trim();
  return [
    contentTypes.length ? `Content types: ${contentTypes.join(", ")}` : "",
    format ? `Preferred format: ${format}` : "",
    frequency ? `Posting frequency: ${frequency}` : "",
  ].filter(Boolean);
}

function formatReferences(value: unknown): string[] {
  const references = asRecord(value);
  const creators = String(references.creators || "").trim();
  const reasons = String(references.reasons || "").trim();
  return [
    creators ? `Reference creators: ${creators}` : "",
    reasons ? `What they like: ${reasons}` : "",
  ].filter(Boolean);
}

export function getActivePlatforms(profile: BrandProfilePromptInput): string[] {
  if (!Array.isArray(profile.socialPreferences)) return [];
  return profile.socialPreferences
    .map((item) => asRecord(item))
    .filter((item) => item.enabled !== false)
    .map((item) => String(item.id || item.name || "").toLowerCase().trim())
    .filter(Boolean);
}

export function formatBrandContextForPrompt(profile: BrandProfilePromptInput) {
  const roles = asStringArray(profile.roles);
  const niches = asStringArray(profile.niches);
  const audienceSegments = asStringArray(profile.audienceSegments);
  const personality = asStringArray(profile.personality);
  const pillars = formatPillars(profile);
  const goals = formatGoals(profile.goals);
  const socialPreferences = formatSocialPreferences(profile.socialPreferences);
  const contentPreferences = formatContentPreferences(profile.contentPreferences);
  const references = formatReferences(profile.references);
  const legacyProfession = String(profile.profession || "").trim();
  const legacyNiche = String(profile.niche || "").trim();
  const legacyAudience = String(profile.targetAudience || "").trim();

  const lines = [
    `Full name: ${profile.fullName || "Not provided"}`,
    `Roles/profession: ${(roles.length ? roles : [legacyProfession || "Expert"]).join(", ")}`,
    `Niche/specialization: ${(niches.length ? niches : [legacyNiche || "General"]).join(", ")}`,
    `Tagline/short bio: ${profile.tagline || "Not provided"}`,
    `Target audience: ${(audienceSegments.length ? audienceSegments : [legacyAudience || "General public"]).join(", ")}`,
    `Audience details: ${profile.audienceDetails || "Not provided"}`,
    `Voice: ${profile.brandTone || "friendly"}`,
    `Tone: ${profile.tone || "professional"}`,
    `Language: ${profile.language || "banglish"} (If "banglish", write in a natural Bengali-English mix. If "bangla", write in Bengali. If "english", write in English.)`,
    personality.length ? `Personality traits: ${personality.join(", ")}` : "",
    pillars.length ? `Content pillars: ${pillars.join(" | ")}` : "Content pillars: General topics",
    goals.length ? `Goals/objectives: ${goals.join(" | ")}` : "",
    socialPreferences.length ? `Social platform preferences: ${socialPreferences.join(" | ")}` : "",
    contentPreferences.length ? `Content preferences: ${contentPreferences.join(" | ")}` : "",
    references.length ? `References/inspiration: ${references.join(" | ")}` : "",
  ].filter(Boolean);

  return lines.map((line) => `- ${line}`).join("\n");
}

export function getBrandKeywords(profile: BrandProfilePromptInput) {
  return [
    ...asStringArray(profile.niches),
    ...asStringArray(profile.audienceSegments),
    ...asLabelArray(profile.contentPillarDetails, ["title", "description"]),
    ...asStringArray(profile.contentPillars),
    String(profile.niche || ""),
    String(profile.targetAudience || ""),
  ]
    .map((item) => item.trim())
    .filter(Boolean);
}
