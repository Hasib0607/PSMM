import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import ResearchDashboard from "./ResearchDashboard";

export default async function ResearchPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch feeds and competitors
  const [feeds, competitors] = await Promise.all([
    db.rssFeed.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.competitorAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Research & Trends"
        description="Monitor competitor feeds, track news channels via RSS, and compile intelligence ideas."
      />
      <div className="flex-1 p-8 space-y-6">
        <ResearchDashboard
          initialFeeds={feeds}
          initialCompetitors={competitors}
        />
      </div>
    </>
  );
}
