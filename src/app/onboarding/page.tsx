import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import OnboardingForm, { type OnboardingInitialData } from "./OnboardingForm";

function jsonArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function jsonObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : fallback;
}

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  const initialData: OnboardingInitialData = brandProfile
    ? {
        fullName: brandProfile.fullName || session.user.name || "",
        profession: brandProfile.profession || "",
        niche: brandProfile.niche || "",
        tagline: brandProfile.tagline || "",
        targetAudience: brandProfile.targetAudience || "",
        audienceDetails: brandProfile.audienceDetails || "",
        brandTone: brandProfile.brandTone || "Friendly",
        tone: brandProfile.tone || "Professional",
        language: brandProfile.language || "english",
        defaultPostTarget: brandProfile.defaultPostTarget || 3,
        contentPillars: jsonArray<string>(brandProfile.contentPillars, []),
        contentPillarDetails: jsonArray(brandProfile.contentPillarDetails, []),
        roles: jsonArray<string>(brandProfile.roles, []),
        niches: jsonArray<string>(brandProfile.niches, []),
        audienceSegments: jsonArray<string>(brandProfile.audienceSegments, []),
        personality: jsonArray<string>(brandProfile.personality, []),
        goals: jsonObject(brandProfile.goals, {
          primary: "Build Personal Brand",
          other: [],
          timeline: "Long-term (6+ months)",
        }),
        socialPreferences: jsonArray(brandProfile.socialPreferences, []),
        contentPreferences: jsonObject(brandProfile.contentPreferences, {
          types: [],
          format: "Short & Visual",
          frequency: "3-4 times per week",
        }),
        references: jsonObject(brandProfile.references, {
          brands: "",
          notes: "",
        }),
      }
    : null;

  return <OnboardingForm initialData={initialData} name={session.user.name || ""} />;
}
