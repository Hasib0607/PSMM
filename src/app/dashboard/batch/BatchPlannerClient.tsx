"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateWeeklyPlan } from "./actions";
import { CalendarDays, Sparkles, Loader2, CheckCircle2, ChevronRight, PenSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BatchPlannerClientProps {
  hasProfile: boolean;
  upcomingCount: number;
}

export default function BatchPlannerClient({ hasProfile, upcomingCount }: BatchPlannerClientProps) {
  const [planning, setPlanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [postCount, setPostCount] = useState(0);

  const handlePlan = async () => {
    if (!hasProfile) {
      alert("Please configure a Brand Profile first!");
      return;
    }
    setPlanning(true);
    setSuccess(false);
    try {
      const res = await generateWeeklyPlan();
      if (res.success && res.count) {
        setPostCount(res.count);
        setSuccess(true);
      } else {
        alert(res.error || "Failed to batch plan posts.");
      }
    } catch (err) {
      console.error(err);
      alert("Error batch planning posts.");
    } finally {
      setPlanning(false);
    }
  };

  const steps = [
    { title: "Analyze Brand Profile", desc: "Read niche, target audience, content pillars, and tone rules." },
    { title: "Inspect Upcoming Occasions", desc: "Scan holidays and special events to frame custom ideas." },
    { title: "Adapt Platform Copy", desc: "Write tailored hooks and descriptions for Facebook & LinkedIn." },
    { title: "Auto-Schedule Week", desc: "Bulk insert 7 drafts mapped to goal counts for the next 7 days." },
  ];

  return (
    <div className="space-y-8 max-w-4xl w-full mx-auto">
      {/* Main planner box */}
      <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="pb-4 border-b border-zinc-900/50">
          <CardTitle className="flex items-center gap-2 text-md text-zinc-100 font-bold">
            <CalendarDays className="h-5 w-5 text-purple-400" />
            <span>Weekly Editorial Batch Planner</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {!success ? (
            <div className="space-y-6">
              <p className="text-xs text-zinc-400 leading-relaxed">
                PSMM Batch Planner helps you automate your weekly schedule in one click. Our AI assistant reads your Brand Profile (profession, niche, tone, content pillars) and maps it against upcoming calendar events to create 7 pre-adapted drafts for the next 7 days.
              </p>

              {/* Steps indicator layout */}
              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, idx) => (
                  <div key={idx} className="p-3.5 bg-zinc-900/20 border border-zinc-900 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-zinc-200">
                      <span className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{step.title}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal pl-7">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={handlePlan}
                  disabled={planning || !hasProfile}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {planning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Planning Weekly Calendar... (this may take up to 20 seconds)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Weekly Content Plan</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-6 flex flex-col items-center justify-center">
              <span className="p-4 bg-green-500/10 text-green-400 rounded-full animate-bounce">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <div className="space-y-2">
                <h4 className="font-bold text-base text-zinc-100">Weekly Editorial Plan Formulated!</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Successfully generated and scheduled {postCount} social media drafts across Facebook and LinkedIn for the next 7 days.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/dashboard/drafts">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-6 py-2.5 cursor-pointer flex items-center gap-1.5">
                    <PenSquare className="h-4 w-4" />
                    <span>View Scheduled Drafts</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setSuccess(false)}
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs font-semibold px-6 py-2.5 cursor-pointer"
                >
                  Plan Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
