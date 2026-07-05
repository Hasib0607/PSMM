"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adaptIdeaToPlatforms } from "@/lib/openai";
import { parsePlatforms } from "@/lib/platforms";
import { recordContentActivity } from "@/lib/post-streak";
import { InboxItemType, InboxItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const InboxItemSchema = z.object({
  type: z.nativeEnum(InboxItemType),
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  content: z.string().min(5, "Content must be at least 5 characters"),
  tags: z.array(z.string()).default([]),
});

export async function createInboxItem(prevState: any, formData: FormData): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated", success: false };

  const type = formData.get("type") as InboxItemType;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const rawTags = formData.get("tags") as string; // Comma separated tags
  const tags = rawTags ? rawTags.split(",").map(t => t.trim()).filter(Boolean) : [];

  const result = InboxItemSchema.safeParse({ type, title, content, tags });
  if (!result.success) return { error: result.error.issues[0].message, success: false };

  try {
    await db.inspirationInbox.create({
      data: {
        userId: session.user.id,
        type: result.data.type,
        title: result.data.title,
        content: result.data.content,
        tags: result.data.tags,
        status: "new",
      },
    });

    revalidatePath("/dashboard/inbox");
    return { success: true, error: null };
  } catch (error) {
    console.error("Create inbox item error:", error);
    return { error: "Failed to create inbox item", success: false };
  }
}

export async function updateInboxItem(id: string, prevState: any, formData: FormData): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated", success: false };

  const type = formData.get("type") as InboxItemType;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const rawTags = formData.get("tags") as string;
  const tags = rawTags ? rawTags.split(",").map(t => t.trim()).filter(Boolean) : [];

  const result = InboxItemSchema.safeParse({ type, title, content, tags });
  if (!result.success) return { error: result.error.issues[0].message, success: false };

  try {
    await db.inspirationInbox.update({
      where: { id, userId: session.user.id },
      data: {
        type: result.data.type,
        title: result.data.title,
        content: result.data.content,
        tags: result.data.tags,
      },
    });

    revalidatePath("/dashboard/inbox");
    return { success: true, error: null };
  } catch (error) {
    console.error("Update inbox item error:", error);
    return { error: "Failed to update inbox item", success: false };
  }
}

export async function deleteInboxItem(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    await db.inspirationInbox.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/dashboard/inbox");
    return { success: true };
  } catch (error) {
    console.error("Delete inbox item error:", error);
    return { error: "Failed to delete inbox item" };
  }
}

export async function archiveInboxItem(id: string, status: InboxItemStatus) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    await db.inspirationInbox.update({
      where: { id, userId: session.user.id },
      data: { status },
    });

    revalidatePath("/dashboard/inbox");
    return { success: true };
  } catch (error) {
    console.error("Archive inbox item error:", error);
    return { error: "Failed to update status" };
  }
}

export async function transformItemToDraft(id: string, platforms: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const platformResult = parsePlatforms(platforms);
  if (!platformResult.success) {
    return { error: platformResult.error.issues[0].message };
  }

  try {
    const item = await db.inspirationInbox.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!item) return { error: "Inspiration item not found" };

    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return { error: "Please complete your brand onboarding profile first." };
    }

    const brandData = {
      profession: brandProfile.profession || "",
      niche: brandProfile.niche || "",
      targetAudience: brandProfile.targetAudience || "",
      brandTone: brandProfile.brandTone,
      language: brandProfile.language,
      contentPillars: Array.isArray(brandProfile.contentPillars)
        ? (brandProfile.contentPillars as string[])
        : [],
    };

    // Adapt content using OpenAI
    const adaptedContent = await adaptIdeaToPlatforms(
      item.content,
      brandData,
      platformResult.data,
    );

    const draft = await db.contentDraft.create({
      data: {
        userId: session.user.id,
        sourceIdea: item.content,
        platformVersions: adaptedContent,
        status: "draft",
        occasionTag: item.title,
        inputSource: "inbox",
      },
    });

    await db.inspirationInbox.update({
      where: { id },
      data: {
        status: "used",
        draftId: draft.id,
      },
    });

    await recordContentActivity(session.user.id);

    revalidatePath("/dashboard/inbox");
    revalidatePath("/dashboard/drafts");
    revalidatePath("/dashboard");
    return { success: true, draftId: draft.id };
  } catch (error: any) {
    console.error("Transform error:", error);
    return { error: error.message || "Failed to transform inspiration item to draft" };
  }
}
