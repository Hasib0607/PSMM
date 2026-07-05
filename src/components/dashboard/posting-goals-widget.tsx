import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Target } from "lucide-react";
import Link from "next/link";

interface PostingGoalsWidgetProps {
  todayTarget?: number;
  todayPublished?: number;
  tomorrowTarget?: number;
  streak?: number;
}

export function PostingGoalsWidget({
  todayTarget = 2,
  todayPublished = 0,
  tomorrowTarget = 2,
  streak = 0,
}: PostingGoalsWidgetProps) {
  const remaining = Math.max(todayTarget - todayPublished, 0);
  const progress =
    todayTarget > 0 ? Math.min((todayPublished / todayTarget) * 100, 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Today's Goal Card */}
      <Card className="bg-zinc-950/50 border-zinc-900 text-white backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-purple-300 font-semibold">
            <Target className="h-4 w-4 text-purple-400" />
            Today&apos;s Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight text-white">
            {todayPublished} <span className="text-zinc-500 text-2xl font-medium">/ {todayTarget}</span>
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            {remaining > 0
              ? `${remaining} more post${remaining === 1 ? "" : "s"} needed today`
              : "🎉 Today's goal reached!"}
          </p>
        </CardContent>
      </Card>

      {/* Tomorrow's Target Card */}
      <Card className="bg-zinc-950/50 border-zinc-900 text-white backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-indigo-300 font-semibold">Tomorrow&apos;s Target</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-between h-[104px]">
          <p className="text-4xl font-bold tracking-tight text-white">{tomorrowTarget} <span className="text-zinc-500 text-sm font-normal">posts planned</span></p>
          <Link href="/dashboard/content" className="mt-auto">
            <Button variant="outline" size="sm" className="h-7 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white cursor-pointer">
              Adjust Target
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Post Streak Card */}
      <Card className="bg-zinc-950/50 border-zinc-900 text-white backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-orange-300 font-semibold">
            <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
            Post Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight text-white">
            {streak} <span className="text-zinc-500 text-2xl font-medium">days</span>
          </p>
          <div className="mt-4 flex gap-2">
            <Badge className={streak >= 7 ? "bg-orange-950/40 text-orange-400 border border-orange-500/20" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}>
              {streak >= 7 ? "🔥 On Fire" : "🌱 Keep Going"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
