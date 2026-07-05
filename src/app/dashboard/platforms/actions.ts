"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { encryptText } from "@/lib/crypto";
import { verifyFacebookSession } from "@/lib/publishers/facebook-playwright";

export async function saveFacebookSession(
  prevState: any,
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  const cookiesStr = formData.get("cookies") as string;
  if (!cookiesStr) {
    return { error: "Cookies data is required.", success: false };
  }

  try {
    // Validate cookies are valid JSON
    const parsedCookies = JSON.parse(cookiesStr.trim());
    if (!Array.isArray(parsedCookies)) {
      return { error: "Cookies must be a valid JSON array of cookie objects.", success: false };
    }

    // Ensure session directory exists
    const sessionDir = path.join(process.cwd(), "src/data/sessions");
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const sessionPath = path.join(sessionDir, `fb_${session.user.id}.json`);
    const encrypted = encryptText(JSON.stringify(parsedCookies));
    fs.writeFileSync(sessionPath, encrypted, "utf8");

    const health = await verifyFacebookSession(sessionPath);
    if (!health.ok) {
      try {
        fs.unlinkSync(sessionPath);
      } catch {
        // ignore cleanup errors
      }
      return {
        error: health.error || "Facebook session verification failed. Please export fresh cookies.",
        success: false,
      };
    }

    // Upsert SocialAccount in database
    await db.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "facebook",
        },
      },
      update: {
        connectionType: "browser_session",
        sessionStatePath: sessionPath,
        isActive: true,
        lastHealthCheckAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: "facebook",
        connectionType: "browser_session",
        sessionStatePath: sessionPath,
        isActive: true,
        lastHealthCheckAt: new Date(),
      },
    });

    revalidatePath("/dashboard/platforms");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Failed to save Facebook session:", error);
    return {
      error: error instanceof SyntaxError ? "Invalid JSON syntax. Please verify your cookies format." : error.message || "Failed to save session.",
      success: false,
    };
  }
}

export async function disconnectFacebook(): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  try {
    const account = await db.socialAccount.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "facebook",
        },
      },
    });

    if (account && account.sessionStatePath && fs.existsSync(account.sessionStatePath)) {
      try {
        fs.unlinkSync(account.sessionStatePath);
      } catch (err) {
        console.error("Failed to delete session file:", err);
      }
    }

    await db.socialAccount.delete({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "facebook",
        },
      },
    });

    revalidatePath("/dashboard/platforms");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Failed to disconnect Facebook:", error);
    return { error: error.message || "Failed to disconnect account.", success: false };
  }
}
