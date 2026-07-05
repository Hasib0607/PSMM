import { publishToFacebook } from "./publishers/facebook-playwright";
import { publishViaAppium } from "./publishers/appium-fallback";
import { db } from "./db";
import { getTodayString, toLocalDateString, parseLocalDate } from "./dates";
import { notifyPublishResult } from "./telegram";

export async function processPublishJob(draftId: string, userId: string, platform: string) {
  const brandProfile = await db.brandProfile.findUnique({ where: { userId } });

  if (brandProfile?.automationPaused || process.env.PAUSE_AUTOMATION === "true") {
    throw new Error("Emergency Pause Active: Automation is temporarily suspended.");
  }

  const draft = await db.contentDraft.findUnique({ where: { id: draftId, userId } });

  if (!draft) {
    throw new Error("Draft not found.");
  }

  if (draft.status !== "scheduled" && draft.status !== "approved") {
    console.log(`[Worker] Skipping draft ${draftId} — status is ${draft.status}`);
    return;
  }

  const versions = draft.platformVersions as Record<string, Record<string, unknown>>;
  const platformContent = versions?.[platform];
  if (!platformContent) {
    throw new Error(`Draft has no version for platform: ${platform}`);
  }

  const socialAccount = await db.socialAccount.findFirst({
    where: {
      userId,
      platform: platform as "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok",
      isActive: true,
    },
  });

  if (!socialAccount?.sessionStatePath) {
    throw new Error(`No active session connected for platform: ${platform}`);
  }

  const textToPublish = `${platformContent.hook ? platformContent.hook + "\n\n" : ""}${
    platformContent.caption
  }${
    platformContent.hashtags && Array.isArray(platformContent.hashtags)
      ? "\n\n" + (platformContent.hashtags as string[]).map((h) => "#" + h).join(" ")
      : ""
  }`;

  let publishResult;

  if (platform === "facebook") {
    publishResult = await publishToFacebook(
      socialAccount.sessionStatePath,
      textToPublish,
      userId,
    );

    if (!publishResult.success) {
      await db.socialAccount.update({
        where: { id: socialAccount.id },
        data: { automationFailCount: { increment: 1 } },
      });

      const updatedAccount = await db.socialAccount.findUnique({
        where: { id: socialAccount.id },
      });

      if (
        updatedAccount &&
        updatedAccount.automationFailCount >= 2 &&
        updatedAccount.deviceId
      ) {
        console.log("[Worker] Playwright failed — trying Appium fallback...");
        publishResult = await publishViaAppium(
          updatedAccount.deviceId,
          textToPublish,
          userId,
          platform,
        );
      }
    } else {
      await db.socialAccount.update({
        where: { id: socialAccount.id },
        data: { automationFailCount: 0 },
      });
    }
  } else {
    throw new Error(`Platform publishing for ${platform} is not supported yet.`);
  }

  if (!publishResult.success) {
    await db.contentDraft.update({
      where: { id: draftId },
      data: { status: "failed" },
    });

    await notifyPublishResult(
      draft.sourceIdea,
      platform,
      false,
      publishResult.error,
      brandProfile?.telegramChatId,
    );

    throw new Error(publishResult.error || "Publishing failed.");
  }

  let approved: string[] = [];
  if (Array.isArray(draft.approvedPlatforms)) {
    approved = draft.approvedPlatforms as string[];
  }
  if (!approved.includes(platform)) approved.push(platform);

  await db.contentDraft.update({
    where: { id: draftId },
    data: {
      status: "published",
      publishedAt: new Date(),
      approvedPlatforms: approved,
    },
  });

  const todayStr = getTodayString();
  const todayDate = parseLocalDate(todayStr);

  await db.postingGoal.updateMany({
    where: { userId, targetDate: todayDate },
    data: { publishedCount: { increment: 1 } },
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  const streak = await db.postStreak.findUnique({ where: { userId } });

  if (!streak) {
    await db.postStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastPostDate: parseLocalDate(todayStr),
      },
    });
  } else {
    const lastPostStr = streak.lastPostDate ? toLocalDateString(streak.lastPostDate) : "";
    if (lastPostStr === yesterdayStr) {
      const nextStreak = streak.currentStreak + 1;
      await db.postStreak.update({
        where: { userId },
        data: {
          currentStreak: nextStreak,
          longestStreak: Math.max(streak.longestStreak, nextStreak),
          lastPostDate: parseLocalDate(todayStr),
        },
      });
    } else if (lastPostStr !== todayStr) {
      await db.postStreak.update({
        where: { userId },
        data: { currentStreak: 1, lastPostDate: parseLocalDate(todayStr) },
      });
    }
  }

  await notifyPublishResult(
    draft.sourceIdea,
    platform,
    true,
    undefined,
    brandProfile?.telegramChatId,
  );

  console.log(`Publish job for draft ${draftId} completed successfully.`);
}
