import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { PostingGoalsWidget } from "@/components/dashboard/posting-goals-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUpcomingSpecialDays } from "@/lib/special-days";
import { getLocalDayBounds, getTodayString, getTomorrowString } from "@/lib/dates";
import { CalendarDays, Inbox, PenSquare, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import SportsWidget from "@/components/dashboard/SportsWidget";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get brand profile for default goals
  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!brandProfile) {
    redirect("/onboarding");
  }

  const defaultTarget = brandProfile.defaultPostTarget || 2;

  // Retrieve today and tomorrow goals
  const todayDateStr = getTodayString();
  const tomorrowDateStr = getTomorrowString();

  const { start: todayStart, end: todayEnd } = getLocalDayBounds(todayDateStr);
  const { start: tomorrowStart, end: tomorrowEnd } = getLocalDayBounds(tomorrowDateStr);

  const todayGoal = await db.postingGoal.findFirst({
    where: {
      userId: session.user.id,
      targetDate: { gte: todayStart, lte: todayEnd },
    },
  });

  const tomorrowGoal = await db.postingGoal.findFirst({
    where: {
      userId: session.user.id,
      targetDate: { gte: tomorrowStart, lte: tomorrowEnd },
    },
  });

  const todayTarget = todayGoal ? todayGoal.targetCount : defaultTarget;
  const tomorrowTarget = tomorrowGoal ? tomorrowGoal.targetCount : defaultTarget;

  // Get today's published post count (where status is "published")
  const todayPublished = await db.contentDraft.count({
    where: {
      userId: session.user.id,
      status: "published",
      updatedAt: { gte: todayStart, lte: todayEnd },
    },
  });

  // Get active streak
  const streakRecord = await db.postStreak.findUnique({
    where: { userId: session.user.id },
  });
  const streak = streakRecord ? streakRecord.currentStreak : 0;

  // Get upcoming holidays
  const upcomingDays = await getUpcomingSpecialDays(14);

  // Social account connection status
  const socialAccounts = await db.socialAccount.findMany({
    where: { userId: session.user.id },
  });

  const isFbConnected = socialAccounts.some((a) => a.platform === "facebook");
  const isIgConnected = socialAccounts.some((a) => a.platform === "instagram");
  const isLiConnected = socialAccounts.some((a) => a.platform === "linkedin");
  const isYtConnected = socialAccounts.some((a) => a.platform === "youtube");
  const isTtConnected = socialAccounts.some((a) => a.platform === "tiktok");

  // Find any occasion that is exactly 7, 5, 3, or 1 days away
  const countdownOccasion = upcomingDays.find(
    (day) => day.daysUntil === 7 || day.daysUntil === 5 || day.daysUntil === 3 || day.daysUntil === 1
  );

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        description="Your personal social media command center"
      />

      <div className="flex-1 space-y-6 p-8">
        <PostingGoalsWidget
          todayTarget={todayTarget}
          todayPublished={todayPublished}
          tomorrowTarget={tomorrowTarget}
          streak={streak}
        />

        {countdownOccasion && (
          <Card className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 text-white p-5 rounded-xl backdrop-blur-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <span className="p-3 bg-purple-500/20 text-purple-400 rounded-lg text-lg animate-pulse shrink-0">
                🔔
              </span>
              <div>
                <h4 className="font-bold text-sm text-zinc-100">
                  {countdownOccasion.name} Countdown Suggested Post!
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {countdownOccasion.name} is in {countdownOccasion.daysUntil} {countdownOccasion.daysUntil === 1 ? "day" : "days"}. We recommend publishing a countdown post!
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/content?idea=Write a ${countdownOccasion.daysUntil}-day countdown post celebrating the upcoming ${countdownOccasion.name}`}
              className="shrink-0"
            >
              <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 cursor-pointer">
                Create Countdown Post
              </Button>
            </Link>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Quick Actions Card */}
          <Card className="lg:col-span-2 bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link href="/dashboard/content">
                <Button className="h-auto w-full flex-col items-start gap-2 px-4 py-4 text-left bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-purple-200 cursor-pointer">
                  <PenSquare className="h-5 w-5 text-purple-400" />
                  <span className="font-semibold text-sm">Create from one idea</span>
                  <span className="text-xs font-normal text-zinc-400">
                    AI adaptation — FB, IG, LinkedIn, YT, TikTok
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/inbox">
                <Button className="h-auto w-full flex-col items-start gap-2 px-4 py-4 text-left bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 text-zinc-300 cursor-pointer">
                  <Inbox className="h-5 w-5 text-indigo-400" />
                  <span className="font-semibold text-sm">Open Inspiration Inbox</span>
                  <span className="text-xs font-normal text-zinc-400">
                    Saved links, notes, and voice clips
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Platform Connections Status Card */}
          <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-zinc-200 text-base font-semibold">Platform Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { name: "Facebook", phase: "Phase 3 (Browser Auto)", connected: isFbConnected },
                { name: "Instagram", phase: "Phase 4 (API)", connected: isIgConnected },
                { name: "LinkedIn", phase: "Phase 5 (API)", connected: isLiConnected },
                { name: "YouTube", phase: "Phase 6 (API)", connected: isYtConnected },
                { name: "TikTok", phase: "Phase 7 (API)", connected: isTtConnected },
              ].map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center justify-between rounded-lg border border-zinc-900 bg-zinc-900/20 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{platform.name}</p>
                    <p className="text-[10px] text-zinc-500">{platform.phase}</p>
                  </div>
                  <Badge className={platform.connected ? "bg-purple-950/40 text-purple-400 border border-purple-500/20" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}>
                    {platform.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <SportsWidget />

        {/* Special Days Card */}
        <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-200">
              <CalendarDays className="h-5 w-5 text-purple-400" />
              Upcoming Occasions & Calendar Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDays.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <AlertCircle className="h-4 w-4" />
                <span>No special days in the next 14 days.</span>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingDays.map((day) => (
                  <div
                    key={day.id}
                    className="rounded-lg border border-zinc-900 bg-zinc-900/10 p-4 hover:border-purple-500/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-zinc-200 text-sm">{day.name}</p>
                      <Badge className="bg-purple-950/20 text-purple-400 border border-purple-500/10 shrink-0 text-[10px]">
                        {day.category.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    {day.nameBn ? (
                      <p className="mt-1 text-xs text-zinc-400 font-medium font-bengali">{day.nameBn}</p>
                    ) : null}
                    <p className="mt-3 text-[11px] text-purple-400 font-medium">
                      {day.daysUntil === 0
                        ? "🚨 TODAY"
                        : day.daysUntil === 1
                          ? "⏰ Tomorrow"
                          : `📅 In ${day.daysUntil} days`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
