import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { getUpcomingSpecialDays } from "@/lib/special-days";
import BatchPlannerClient from "./BatchPlannerClient";

export default async function BatchPlannerPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [brandProfile, upcomingOccasions] = await Promise.all([
    db.brandProfile.findUnique({
      where: { userId: session.user.id },
    }),
    getUpcomingSpecialDays(7),
  ]);

  return (
    <>
      <DashboardHeader
        title="Weekly Batch Planner"
        description="Plan, generate, and pre-adapt 7 days of editorial posts in a single click."
      />
      <div className="flex-1 p-8 space-y-6">
        <BatchPlannerClient
          hasProfile={!!brandProfile}
          upcomingCount={upcomingOccasions.length}
        />
      </div>
    </>
  );
}
