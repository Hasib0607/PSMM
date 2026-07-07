"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { encryptText } from "@/lib/crypto";

type FacebookCookie = {
  name?: string;
  value?: string;
  domain?: string;
};

function validateFacebookCookies(cookies: FacebookCookie[]) {
  const hasFacebookDomain = cookies.some(
    (cookie) =>
      typeof cookie.domain === "string" &&
      cookie.domain.toLowerCase().includes("facebook.com"),
  );

  if (!hasFacebookDomain) {
    return "Cookies must include facebook.com domains.";
  }

  const requiredCookies = ["c_user", "xs"];
  const missingCookies = requiredCookies.filter(
    (name) =>
      !cookies.some(
        (cookie) =>
          cookie.name === name &&
          typeof cookie.value === "string" &&
          cookie.value.trim().length > 0,
      ),
  );

  if (missingCookies.length > 0) {
    return `Missing required Facebook cookies: ${missingCookies.join(", ")}. Export fresh logged-in cookies and try again.`;
  }

  return null;
}

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
    const parsedCookies = JSON.parse(cookiesStr.trim()) as FacebookCookie[];
    if (!Array.isArray(parsedCookies)) {
      return { error: "Cookies must be a valid JSON array of cookie objects.", success: false };
    }

    const cookieValidationError = validateFacebookCookies(parsedCookies);
    if (cookieValidationError) {
      return { error: cookieValidationError, success: false };
    }

    // Ensure session directory exists
    const sessionDir = path.join(process.cwd(), "src/data/sessions");
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const sessionPath = path.join(sessionDir, `fb_${session.user.id}.json`);
    const encrypted = encryptText(JSON.stringify(parsedCookies));
    fs.writeFileSync(sessionPath, encrypted, "utf8");

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
        lastHealthCheckAt: null,
      },
      create: {
        userId: session.user.id,
        platform: "facebook",
        connectionType: "browser_session",
        sessionStatePath: sessionPath,
        isActive: true,
        lastHealthCheckAt: null,
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
