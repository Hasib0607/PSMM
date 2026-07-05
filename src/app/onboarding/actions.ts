"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BrandProfileSchema = z.object({
  profession: z.string().min(2, "Profession must be at least 2 characters"),
  niche: z.string().min(2, "Niche must be at least 2 characters"),
  targetAudience: z.string().min(2, "Target audience must be at least 2 characters"),
  brandTone: z.string().default("friendly"),
  language: z.string().default("banglish"),
  defaultPostTarget: z.number().int().min(1).max(10).default(2),
  contentPillars: z.array(z.string()).min(1, "At least one content pillar is required"),
});

export async function saveBrandProfile(prevState: any, formData: FormData): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  const profession = formData.get("profession") as string;
  const niche = formData.get("niche") as string;
  const targetAudience = formData.get("targetAudience") as string;
  const brandTone = formData.get("brandTone") as string;
  const language = formData.get("language") as string;
  const defaultPostTarget = parseInt(formData.get("defaultPostTarget") as string || "2", 10);
  
  // Parse content pillars from multiple inputs
  const rawPillars = formData.getAll("contentPillars") as string[];
  const contentPillars = rawPillars.filter(p => p.trim().length > 0);

  const result = BrandProfileSchema.safeParse({
    profession,
    niche,
    targetAudience,
    brandTone,
    language,
    defaultPostTarget,
    contentPillars,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message, success: false };
  }

  try {
    const data = result.data;
    
    await db.brandProfile.upsert({
      where: { userId: session.user.id },
      update: {
        profession: data.profession,
        niche: data.niche,
        targetAudience: data.targetAudience,
        brandTone: data.brandTone,
        language: data.language,
        defaultPostTarget: data.defaultPostTarget,
        contentPillars: data.contentPillars,
      },
      create: {
        userId: session.user.id,
        profession: data.profession,
        niche: data.niche,
        targetAudience: data.targetAudience,
        brandTone: data.brandTone,
        language: data.language,
        defaultPostTarget: data.defaultPostTarget,
        contentPillars: data.contentPillars,
      },
    });

    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Failed to save brand profile:", error);
    return { error: "Failed to save profile. Please try again.", success: false };
  }
}
