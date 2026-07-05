"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adaptIdeaToPlatforms } from "@/lib/openai";
import { parsePlatforms } from "@/lib/platforms";
import { recordContentActivity } from "@/lib/post-streak";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const GenerateSchema = z.object({
  idea: z.string().min(5, "Idea must be at least 5 characters long").max(1000),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
});

export async function generateDraft(
  prevState: unknown,
  formData: FormData,
): Promise<{
  error: string | null;
  success: boolean;
  draftId?: string | null;
  content?: unknown;
  redirectOnboarding?: boolean;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false, redirectOnboarding: false };
  }

  // Rate Limiting check
  const rateLimit = await checkRateLimit(`draft:${session.user.id}`, 20, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      error: "Rate limit exceeded. Please wait a few minutes before generating more drafts.",
      success: false,
      redirectOnboarding: false,
    };
  }

  const idea = formData.get("idea") as string;
  const rawPlatforms = formData.getAll("platforms") as string[];
  const templateId = formData.get("template") as string;

  const result = GenerateSchema.safeParse({ idea, platforms: rawPlatforms });
  if (!result.success) {
    return { error: result.error.issues[0].message, success: false, redirectOnboarding: false };
  }

  let templateStructure = "";
  if (templateId && templateId !== "none") {
    const SYSTEM_TEMPLATES_MAP: { [key: string]: string } = {
      story: "Begin with a personal story/conflict. Keep paragraphs short. Emphasize lessons learned. Conclude with a thought-provoking question.",
      value: "Start with a high-impact promise. Present 3-5 bullet points with emojis. Keep spacing generous. End with a save/share call-to-action.",
      contrarian: "Start with a controversial statement refuting common wisdom. Explain why the popular method fails and your alternative succeeds. Ask audience for their disagreements.",
      casestudy: "Start with a specific result (e.g. 'How we achieved X'). Break down the exact timeline and step-by-step roadmap. Call to action should be to send a DM or click a link.",
      bts: "Share a raw, unpolished, 'work in progress' update. Focus on the current struggle, a breakthrough, or a sneak peek. Prompt the audience to share their current progress."
    };

    if (SYSTEM_TEMPLATES_MAP[templateId]) {
      templateStructure = SYSTEM_TEMPLATES_MAP[templateId];
    } else {
      const dbTemplate = await db.captionTemplate.findFirst({
        where: { id: templateId, userId: session.user.id }
      });
      if (dbTemplate) {
        templateStructure = dbTemplate.structure;
      }
    }
  }

  const platformResult = parsePlatforms(result.data.platforms);
  if (!platformResult.success) {
    return {
      error: platformResult.error.issues[0].message,
      success: false,
      redirectOnboarding: false,
    };
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!brandProfile) {
    return {
      error: "Brand profile not found. Please complete onboarding first.",
      redirectOnboarding: true,
      success: false,
    };
  }

  try {
    const brandData = {
      profession: brandProfile.profession || "",
      niche: brandProfile.niche || "",
      targetAudience: brandProfile.targetAudience || "",
      brandTone: brandProfile.brandTone,
      language: brandProfile.language,
      contentPillars: Array.isArray(brandProfile.contentPillars)
        ? (brandProfile.contentPillars as string[])
        : [],
    };

    const adaptedContent = await adaptIdeaToPlatforms(
      result.data.idea,
      brandData,
      platformResult.data,
      templateStructure,
    );

    const draft = await db.contentDraft.create({
      data: {
        userId: session.user.id,
        sourceIdea: result.data.idea,
        platformVersions: adaptedContent,
        status: "draft",
        inputSource: "manual",
      },
    });

    await recordContentActivity(session.user.id);

    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard/drafts");
    revalidatePath("/dashboard");

    return {
      success: true,
      draftId: draft.id,
      content: adaptedContent,
      error: null,
      redirectOnboarding: false,
    };
  } catch (error: unknown) {
    console.error("Content generation error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate content. Please check your OpenAI API key.";
    return { error: message, success: false, redirectOnboarding: false };
  }
}
