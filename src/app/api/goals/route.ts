import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Platform } from "@prisma/client";
import { parseLocalDate, getTodayString, getTomorrowString, getLocalDayBounds } from "@/lib/dates";
import { NextResponse } from "next/server";
import { z } from "zod";

const GoalSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  platform: z.nativeEnum(Platform).default(Platform.all),
  targetCount: z.number().int().min(1).max(20).default(2),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  const start = startDateStr
    ? getLocalDayBounds(startDateStr).start
    : getLocalDayBounds(getTodayString()).start;
  const end = endDateStr
    ? getLocalDayBounds(endDateStr).end
    : getLocalDayBounds(getTomorrowString()).end;

  try {
    const goals = await db.postingGoal.findMany({
      where: {
        userId: session.user.id,
        targetDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { targetDate: "asc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Failed to fetch goals:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = GoalSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { date, platform, targetCount } = result.data;
    const targetDate = parseLocalDate(date);

    const goal = await db.postingGoal.upsert({
      where: {
        userId_platform_targetDate: {
          userId: session.user.id,
          platform,
          targetDate,
        },
      },
      update: {
        targetCount,
      },
      create: {
        userId: session.user.id,
        platform,
        targetDate,
        targetCount,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Failed to save goal:", error);
    return NextResponse.json({ error: "Failed to save goal" }, { status: 500 });
  }
}
