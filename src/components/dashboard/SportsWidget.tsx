import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { getLiveSportsEvents, type SportsFixture } from "@/lib/sports";

export default async function SportsWidget() {
  const fixtures = await getLiveSportsEvents();

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-zinc-900/50">
        <CardTitle className="flex items-center gap-2 text-sm text-zinc-200 font-bold">
          <Trophy className="h-4.5 w-4.5 text-yellow-500" />
          <span>Live Sports Events & Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {fixtures.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">
            No live cricket or football events today. Check back on match days.
          </p>
        ) : (
          <div className="space-y-3">
            {fixtures.map((fixture: SportsFixture) => (
              <div
                key={fixture.id}
                className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {fixture.status.toLowerCase().includes("live") && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    )}
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {fixture.status}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">({fixture.type})</span>
                  </div>
                  <h4 className="font-bold text-zinc-200">{fixture.title}</h4>
                  <p className="text-[11px] font-mono text-purple-400 font-semibold">{fixture.score}</p>
                </div>
                <Link
                  href={`/dashboard/content?idea=${encodeURIComponent(
                    `Write a reaction post on ${fixture.title} (${fixture.type}). Score: ${fixture.score}. ${fixture.suggestion}`,
                  )}`}
                  className="shrink-0 sm:self-center"
                >
                  <Button className="bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-purple-300 text-[10px] font-bold py-1 px-3 cursor-pointer flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Draft Reaction</span>
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
