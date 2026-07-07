"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUpcomingSpecialDays } from "@/lib/special-days";
import { OpenAI } from "openai";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatBrandContextForPrompt, getActivePlatforms } from "@/lib/brand-profile-context";

export async function generateWeeklyPlan(): Promise<{
  error: string | null;
  success: boolean;
  count?: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  // Rate Limiting check: Max 3 per hour
  const rateLimit = await checkRateLimit(`weekly:${session.user.id}`, 3, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      error: "Rate limit exceeded. You can only generate 3 weekly plans per hour.",
      success: false,
    };
  }

  try {
    // 1. Fetch Brand Profile
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return { error: "Please complete onboarding and set up your Brand Profile first.", success: false };
    }

    // 2. Fetch Upcoming Occasions (Next 7 days)
    const upcomingOccasions = await getUpcomingSpecialDays(7);

    // 3. Fetch recent Inbox Inspiration
    const inboxItems = await db.inspirationInbox.findMany({
      where: { userId: session.user.id, status: "new" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (!process.env.OPENAI_API_KEY) {
      return { error: "OpenAI API key is not configured.", success: false };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const activePlatforms = getActivePlatforms(brandProfile);
    const plannerPlatforms = activePlatforms.length
      ? activePlatforms.filter((platform) => platform !== "all")
      : ["facebook", "linkedin"];
    const selectedPlannerPlatforms = plannerPlatforms.length ? plannerPlatforms : ["facebook", "linkedin"];
    const platformSchema = selectedPlannerPlatforms.reduce<Record<string, unknown>>((acc, platform) => {
      acc[platform] = {
        hook: `${platform} hook text`,
        caption: `${platform} main post caption`,
        cta: `${platform} CTA text where relevant`,
        hashtags: ["tag1", "tag2"],
      };
      return acc;
    }, {});

    const occasionsPrompt = upcomingOccasions.length > 0
      ? upcomingOccasions.map(o => `- Occasion: "${o.name}" in ${o.daysUntil} days`).join("\n")
      : "No major holidays/special days in the next 7 days.";

    const inboxPrompt = inboxItems.length > 0
      ? inboxItems.map((item, i) => `- Idea Source #${i + 1}: Title "${item.title}" | "${item.content.substring(0, 150)}..."`).join("\n")
      : "No recent inspiration inbox items.";

    const systemPrompt = `
You are an expert social media scheduler and editorial strategist. You plan cohesive, engaging, weekly calendars of posts.
Given the User's Brand Profile, upcoming occasions, and recent inspiration logs, outline a 7-day posting calendar.

For EACH of the 7 days (Day 1 through Day 7), you must produce:
1. Core Concept (a short summary topic)
2. Content Pillar matched
3. Platform adaptations for these platforms only: ${selectedPlannerPlatforms.join(", ")}

All text must strictly align with the user's Brand Tone and Language preferences (mix of Bangla and English if "banglish").
Format your output strictly as a JSON object containing a "calendar" array with exactly 7 items:
{
  "calendar": [
    {
      "dayIndex": 1,
      "pillar": "pillar name",
      "coreConcept": "Core post topic summary",
      "platforms": ${JSON.stringify(platformSchema)}
    }
  ]
}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Brand Profile:\n${formatBrandContextForPrompt(brandProfile)}\n\nUpcoming Holidays:\n${occasionsPrompt}\n\nInspirations:\n${inboxPrompt}`,
        },
      ],
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const calendar = result.calendar;

    if (!Array.isArray(calendar) || calendar.length === 0) {
      return { error: "Failed to generate structured weekly schedule. Please try again.", success: false };
    }

    // 4. Bulk insert drafts into Database
    for (const item of calendar) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + item.dayIndex - 1);
      scheduledDate.setHours(10, 0, 0, 0); // Default scheduler time 10:00 AM

      const platformVersions = item.platforms && typeof item.platforms === "object"
        ? item.platforms
        : selectedPlannerPlatforms.reduce<Record<string, unknown>>((acc, platform) => {
            if (item[platform]) acc[platform] = item[platform];
            return acc;
          }, {});

      await db.contentDraft.create({
        data: {
          userId: session.user.id,
          sourceIdea: item.coreConcept,
          inputSource: "batch",
          platformVersions,
          status: "draft",
          scheduledAt: scheduledDate,
          occasionTag: upcomingOccasions.length > 0 ? upcomingOccasions[0].name : undefined,
        },
      });

      // Drafts require approval before publishing — no auto-queue

      // Update PostingGoal scheduled count for that target date
      const targetDateBounds = new Date(scheduledDate);
      targetDateBounds.setHours(0, 0, 0, 0);

      await db.postingGoal.upsert({
        where: {
          userId_platform_targetDate: {
            userId: session.user.id,
            platform: "all",
            targetDate: targetDateBounds,
          },
        },
        update: {
          scheduledCount: { increment: 1 },
        },
        create: {
          userId: session.user.id,
          platform: "all",
          targetDate: targetDateBounds,
          targetCount: brandProfile.defaultPostTarget || 2,
          scheduledCount: 1,
        },
      });
    }

    revalidatePath("/dashboard/drafts");
    revalidatePath("/dashboard/batch");
    return { success: true, error: null, count: calendar.length };
  } catch (error: unknown) {
    console.error("Failed to batch plan weekly calendar:", error);
    const message = error instanceof Error ? error.message : "Failed to generate weekly plan.";
    return { error: message, success: false };
  }
}
