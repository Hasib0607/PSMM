import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import OnboardingForm, { type OnboardingInitialData } from "@/app/onboarding/OnboardingForm";
import { AutomationControls } from "@/components/dashboard/AutomationControls";

function jsonArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function jsonObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : fallback;
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch current brand profile to populate settings form
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
        brandTone: brandProfile.brandTone || "",
        tone: brandProfile.tone || "Professional",
        language: brandProfile.language || "",
        defaultPostTarget: brandProfile.defaultPostTarget || 2,
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

  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Customize your personal brand profile, posting targets, tone, and content pillars"
      />
      <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
        <AutomationControls
          automationPaused={brandProfile?.automationPaused ?? false}
          telegramChatId={brandProfile?.telegramChatId ?? null}
        />
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-2">Edit Brand Profile</h2>
          <p className="text-zinc-400 text-xs mb-6">
            Updating this profile will alter the voice and target audience used by the OpenAI adaptation engine when generating future drafts.
          </p>
          <OnboardingForm initialData={initialData} name={session.user.name || ""} />
        </div>
      </div>
    </>
  );
}
