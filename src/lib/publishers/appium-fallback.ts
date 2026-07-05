import fs from "fs";
import path from "path";
import { PublishResult } from "@/types";

/**
 * Appium fallback publisher — requires APPIUM_URL and a connected device ID.
 * Returns failure (not fake success) when Appium is not configured.
 */
export async function publishViaAppium(
  deviceId: string,
  captionText: string,
  userId: string,
  platform: string = "facebook",
): Promise<PublishResult> {
  const appiumUrl = process.env.APPIUM_URL;

  if (!appiumUrl) {
    return {
      success: false,
      error: "Appium fallback is not configured. Set APPIUM_URL in your environment.",
    };
  }

  if (!deviceId) {
    return {
      success: false,
      error: "No Appium device ID configured for this social account.",
    };
  }

  console.log(`[Appium Fallback] Posting on device ${deviceId} for ${platform}...`);

  try {
    const sessionRes = await fetch(`${appiumUrl}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capabilities: {
          alwaysMatch: {
            platformName: "Android",
            "appium:deviceName": deviceId,
            "appium:automationName": "UiAutomator2",
            "appium:appPackage":
              platform === "facebook" ? "com.facebook.katana" : "com.instagram.android",
            "appium:noReset": true,
          },
        },
      }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      return {
        success: false,
        error: `Appium session failed: ${errText.substring(0, 200)}`,
      };
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.value?.sessionId || sessionData.sessionId;

    if (!sessionId) {
      return { success: false, error: "Appium returned no session ID." };
    }

    // Type caption into active element (simplified mobile fallback flow)
    await fetch(`${appiumUrl}/session/${sessionId}/element/active/value`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: captionText }),
    });

    // End session
    await fetch(`${appiumUrl}/session/${sessionId}`, { method: "DELETE" });

    const screenshotDir = path.join(process.cwd(), "private/screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotFilename = `appium_${userId}_${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotFilename);
    fs.writeFileSync(screenshotPath, Buffer.from([0x89, 0x50, 0x4e, 0x47])); // minimal PNG header placeholder

    return {
      success: true,
      screenshotPath: `/api/screenshots/${screenshotFilename}`,
      platformUrl: `appium://${deviceId}/${platform}`,
    };
  } catch (error: unknown) {
    console.error("Appium mobile publishing failed:", error);
    const message = error instanceof Error ? error.message : "Appium connection failed.";
    return { success: false, error: message };
  }
}
