"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionState = { error: string | null; success: boolean };

const stringListSchema = z.array(z.string().trim().min(1));
const stringArraySchema = stringListSchema.default([]);

const PillarSchema = z.object({
  id: z.string().min(1),
  emoji: z.string().trim().min(1).default("•"),
  title: z.string().trim().min(1),
  note: z.string().trim().optional().default(""),
});

const PlatformSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  enabled: z.boolean(),
  purpose: z.string().trim().min(1),
  contentFocus: z.string().trim().min(1),
});

const GoalsSchema = z.object({
  primary: z.string().trim().min(1),
  other: stringArraySchema,
  timeline: z.string().trim().min(1),
});

const ContentPreferencesSchema = z.object({
  types: stringArraySchema,
  format: z.string().trim().min(1),
  frequency: z.string().trim().min(1),
});

const ReferencesSchema = z.object({
  brands: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

const BrandProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  profession: z.string().trim().min(2, "Profession must be at least 2 characters"),
  niche: z.string().trim().min(2, "Niche must be at least 2 characters"),
  tagline: z.string().trim().max(160, "Tagline must be 160 characters or less").optional().default(""),
  targetAudience: z.string().trim().min(2, "Target audience must be at least 2 characters"),
  audienceDetails: z.string().trim().max(200, "Audience details must be 200 characters or less").optional().default(""),
  brandTone: z.string().trim().default("friendly"),
  tone: z.string().trim().default("professional"),
  language: z.string().trim().default("english"),
  defaultPostTarget: z.number().int().min(1).max(10).default(3),
  roles: stringListSchema.min(1, "Add at least one profession or role"),
  niches: stringListSchema.min(1, "Add at least one niche"),
  audienceSegments: stringListSchema.min(1, "Add at least one target audience"),
  personality: stringArraySchema,
  contentPillars: z.array(PillarSchema).min(1, "At least one content pillar is required"),
  goals: GoalsSchema,
  socialPreferences: z.array(PlatformSchema),
  contentPreferences: ContentPreferencesSchema,
  references: ReferencesSchema,
});

function parseJsonField<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveBrandProfile(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  const roles = parseJsonField<string[]>(formData, "roles", []);
  const niches = parseJsonField<string[]>(formData, "niches", []);
  const audienceSegments = parseJsonField<string[]>(formData, "audienceSegments", []);
  const personality = parseJsonField<string[]>(formData, "personality", []);
  const contentPillars = parseJsonField<z.infer<typeof PillarSchema>[]>(formData, "contentPillarDetails", []);
  const goals = parseJsonField<z.infer<typeof GoalsSchema>>(formData, "goals", {
    primary: "Build Personal Brand",
    other: [],
    timeline: "Long-term (6+ months)",
  });
  const socialPreferences = parseJsonField<z.infer<typeof PlatformSchema>[]>(
    formData,
    "socialPreferences",
    [],
  );
  const contentPreferences = parseJsonField<z.infer<typeof ContentPreferencesSchema>>(
    formData,
    "contentPreferences",
    { types: [], format: "Short & Visual", frequency: "3-4 times per week" },
  );
  const references = parseJsonField<z.infer<typeof ReferencesSchema>>(formData, "references", {
    brands: "",
    notes: "",
  });

  const result = BrandProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    profession: roles.join(", "),
    niche: niches.join(", "),
    tagline: formData.get("tagline"),
    targetAudience: audienceSegments.join(", "),
    audienceDetails: formData.get("audienceDetails"),
    brandTone: formData.get("brandTone"),
    tone: formData.get("tone"),
    language: formData.get("language"),
    defaultPostTarget: Number.parseInt((formData.get("defaultPostTarget") as string) || "3", 10),
    roles,
    niches,
    audienceSegments,
    personality,
    contentPillars,
    goals,
    socialPreferences,
    contentPreferences,
    references,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message, success: false };
  }

  try {
    const data = result.data;
    const pillarTitles = data.contentPillars.map((pillar) => pillar.title);

    await db.brandProfile.upsert({
      where: { userId: session.user.id },
      update: {
        fullName: data.fullName,
        profession: data.profession,
        niche: data.niche,
        tagline: data.tagline,
        targetAudience: data.targetAudience,
        audienceDetails: data.audienceDetails,
        brandTone: data.brandTone,
        tone: data.tone,
        language: data.language,
        defaultPostTarget: data.defaultPostTarget,
        contentPillars: pillarTitles,
        contentPillarDetails: data.contentPillars,
        roles: data.roles,
        niches: data.niches,
        audienceSegments: data.audienceSegments,
        personality: data.personality,
        goals: data.goals,
        socialPreferences: data.socialPreferences,
        contentPreferences: data.contentPreferences,
        references: data.references,
      },
      create: {
        userId: session.user.id,
        fullName: data.fullName,
        profession: data.profession,
        niche: data.niche,
        tagline: data.tagline,
        targetAudience: data.targetAudience,
        audienceDetails: data.audienceDetails,
        brandTone: data.brandTone,
        tone: data.tone,
        language: data.language,
        defaultPostTarget: data.defaultPostTarget,
        contentPillars: pillarTitles,
        contentPillarDetails: data.contentPillars,
        roles: data.roles,
        niches: data.niches,
        audienceSegments: data.audienceSegments,
        personality: data.personality,
        goals: data.goals,
        socialPreferences: data.socialPreferences,
        contentPreferences: data.contentPreferences,
        references: data.references,
      },
    });

    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to save brand profile:", error);
    return { error: "Failed to save profile. Please try again.", success: false };
  }
}
