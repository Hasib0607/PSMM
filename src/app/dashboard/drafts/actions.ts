"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parsePlatforms } from "@/lib/platforms";
import { parseLocalDate } from "@/lib/dates";
import { notifyDraftApproved } from "@/lib/telegram";
import { revalidatePath } from "next/cache";

export async function deleteDraft(id: string): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  try {
    await db.contentDraft.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/dashboard/drafts");
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("Failed to delete draft:", error);
    const message = error instanceof Error ? error.message : "Failed to delete draft";
    return { error: message, success: false };
  }
}

export async function approveDraft(
  draftId: string,
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  try {
    const draft = await db.contentDraft.findUnique({
      where: { id: draftId, userId: session.user.id },
    });

    if (!draft) {
      return { error: "Draft not found.", success: false };
    }

    if (draft.status === "published") {
      return { error: "This draft is already published.", success: false };
    }

    await db.contentDraft.update({
      where: { id: draftId },
      data: { status: "approved" },
    });

    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    const platforms = Object.keys((draft.platformVersions as object) || {});
    if (platforms.length > 0) {
      await notifyDraftApproved(draft.sourceIdea, platforms[0], brandProfile?.telegramChatId);
    }

    revalidatePath("/dashboard/drafts");
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("Failed to approve draft:", error);
    const message = error instanceof Error ? error.message : "Failed to approve draft";
    return { error: message, success: false };
  }
}

export async function publishDraft(
  draftId: string,
  platform: string,
  scheduledTimeStr?: string,
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  const platformResult = parsePlatforms([platform]);
  if (!platformResult.success) {
    return { error: platformResult.error.issues[0].message, success: false };
  }

  try {
    const [draft, brandProfile] = await Promise.all([
      db.contentDraft.findUnique({ where: { id: draftId, userId: session.user.id } }),
      db.brandProfile.findUnique({ where: { userId: session.user.id } }),
    ]);

    if (!draft) {
      return { error: "Draft not found.", success: false };
    }

    if (brandProfile?.automationPaused || process.env.PAUSE_AUTOMATION === "true") {
      return {
        error: "Automation is paused. Resume publishing in Settings → Emergency Controls.",
        success: false,
      };
    }

    if (draft.status !== "approved" && draft.status !== "scheduled") {
      return {
        error: "Please approve this draft before publishing or scheduling.",
        success: false,
      };
    }

    const account = await db.socialAccount.findFirst({
      where: { userId: session.user.id, platform: platformResult.data[0], isActive: true },
    });

    if (!account) {
      return {
        error: `Your ${platform} account is not connected. Please connect it first on the Platforms page.`,
        success: false,
      };
    }

    const { queue } = await import("@/lib/queue");
    const jobId = `publish-${draftId}-${platform}-${Date.now()}`;

    if (scheduledTimeStr) {
      const scheduledAt = new Date(scheduledTimeStr);
      const delay = scheduledAt.getTime() - Date.now();

      if (delay <= 0) {
        return { error: "Scheduled time must be in the future.", success: false };
      }

      await db.contentDraft.update({
        where: { id: draftId },
        data: { status: "scheduled", scheduledAt },
      });

      await queue.add(
        `publish-${draftId}-${platform}`,
        { draftId, userId: session.user.id, platform: platformResult.data[0] },
        { delay, jobId, removeOnComplete: true },
      );

      const todayDate = parseLocalDate(
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
      );
      await db.postingGoal.updateMany({
        where: { userId: session.user.id, targetDate: todayDate },
        data: { scheduledCount: { increment: 1 } },
      });
    } else {
      await db.contentDraft.update({
        where: { id: draftId },
        data: { status: "approved" },
      });

      await queue.add(
        `publish-${draftId}-${platform}`,
        { draftId, userId: session.user.id, platform: platformResult.data[0] },
        { jobId, removeOnComplete: true },
      );
    }

    revalidatePath("/dashboard/drafts");
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("Failed to publish draft:", error);
    const message = error instanceof Error ? error.message : "Failed to schedule publishing.";
    return { error: message, success: false };
  }
}

export async function toggleAutomationPause(
  paused: boolean,
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  try {
    await db.brandProfile.update({
      where: { userId: session.user.id },
      data: { automationPaused: paused },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update automation pause.";
    return { error: message, success: false };
  }
}

export async function updateTelegramChatId(
  chatId: string,
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  try {
    await db.brandProfile.update({
      where: { userId: session.user.id },
      data: { telegramChatId: chatId.trim() || null },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save Telegram chat ID.";
    return { error: message, success: false };
  }
}
