import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import IdeasForm from "./IdeasForm";
import { getLocalDayBounds, getTodayString, getTomorrowString } from "@/lib/dates";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const defaultIdea = resolvedSearchParams.idea || "";

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  const todayDateStr = getTodayString();
  const tomorrowDateStr = getTomorrowString();
  const { start: todayStart } = getLocalDayBounds(todayDateStr);
  const { start: tomorrowStart } = getLocalDayBounds(tomorrowDateStr);

  const todayGoal = await db.postingGoal.findUnique({
    where: {
      userId_platform_targetDate: {
        userId: session.user.id,
        platform: "all",
        targetDate: todayStart,
      },
    },
  });

  const tomorrowGoal = await db.postingGoal.findUnique({
    where: {
      userId_platform_targetDate: {
        userId: session.user.id,
        platform: "all",
        targetDate: tomorrowStart,
      },
    },
  });

  const customTemplates = await db.captionTemplate.findMany({
    where: { userId: session.user.id },
  });

  const initialGoals = {
    today: todayGoal?.targetCount ?? brandProfile?.defaultPostTarget ?? 2,
    tomorrow: tomorrowGoal?.targetCount ?? brandProfile?.defaultPostTarget ?? 2,
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      <IdeasForm
        initialGoals={initialGoals}
        hasBrandProfile={!!brandProfile}
        customTemplates={customTemplates}
        defaultIdea={defaultIdea}
      />
    </div>
  );
}
