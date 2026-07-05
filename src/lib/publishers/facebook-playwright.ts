import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { PublishResult } from "@/types";
import { decryptText } from "@/lib/crypto";

async function createBrowserContext(cookiesPath: string) {
  if (!fs.existsSync(cookiesPath)) {
    throw new Error("Facebook session cookies file not found. Please connect your account first.");
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const encryptedCookies = fs.readFileSync(cookiesPath, "utf8");
  const decryptedCookies = decryptText(encryptedCookies);
  const cookies = JSON.parse(decryptedCookies);
  await context.addCookies(cookies);

  return { browser, context };
}

/** Verify Facebook session is still valid (health check on connect). */
export async function verifyFacebookSession(
  cookiesPath: string,
): Promise<{ ok: boolean; error?: string }> {
  let browser;
  try {
    const ctx = await createBrowserContext(cookiesPath);
    browser = ctx.browser;
    const page = await ctx.context.newPage();

    await page.goto("https://www.facebook.com/", { waitUntil: "domcontentloaded", timeout: 45000 });

    const isLoggedIn = await page.evaluate(() => {
      return (
        document.querySelector('[role="navigation"]') !== null ||
        document.querySelector('[aria-label="Facebook"]') !== null ||
        document.querySelector('a[href*="/me/"]') !== null
      );
    });

    if (!isLoggedIn) {
      return { ok: false, error: "Session expired or invalid. Please export fresh cookies." };
    }

    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Health check failed.";
    return { ok: false, error: message };
  } finally {
    if (browser) await browser.close();
  }
}

export async function publishToFacebook(
  cookiesPath: string,
  captionText: string,
  userId: string,
  mediaPaths: string[] = [],
): Promise<PublishResult> {
  let browser;
  try {
    const ctx = await createBrowserContext(cookiesPath);
    browser = ctx.browser;
    const page = await ctx.context.newPage();

    console.log("Navigating to Facebook...");
    await page.goto("https://www.facebook.com/", { waitUntil: "networkidle", timeout: 45000 });

    // Verify authentication status
    const isLoggedIn = await page.evaluate(() => {
      // Check for elements unique to the logged-in feed or profile links
      return (
        document.querySelector('[role="navigation"]') !== null ||
        document.querySelector('[aria-label="Facebook"]') !== null ||
        document.querySelector('a[href*="/me/"]') !== null
      );
    });

    if (!isLoggedIn) {
      return { success: false, error: "Facebook session expired. Please update your cookies on the Platforms page." };
    }

    console.log("Locating post creator...");
    // Try multiple common Facebook composer selectors
    const composerSelectors = [
      '[role="button"]:has-text("What\'s on your mind")',
      '[role="button"]:has-text("সৃষ্টি করুন")', // Bengali
      '[role="button"]:has-text("Create Post")',
      'div[data-click="profile_icon"] + div',
      'span:has-text("What\'s on your mind")',
    ];

    let composerTrigger = null;
    for (const selector of composerSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          composerTrigger = el;
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!composerTrigger) {
      return { success: false, error: "Could not find the Facebook post composer button. Selector structure may have changed." };
    }

    // Click to open composer modal
    await composerTrigger.click();
    console.log("Composer modal opened.");

    // Locate the post content textbox (contenteditable area)
    const textboxSelectors = [
      'div[role="textbox"]',
      'div[contenteditable="true"]',
      '[aria-label^="What\'s on your mind"]',
    ];

    let textbox = null;
    for (const selector of textboxSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          textbox = el;
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!textbox) {
      return { success: false, error: "Could not find the Facebook post input box." };
    }

    // Fill in the text caption
    await textbox.focus();
    await textbox.fill(captionText);
    console.log("Caption text filled.");

    // Handle Media upload if files are specified
    if (mediaPaths && mediaPaths.length > 0) {
      console.log("Attempting media upload...");
      // Click "Photo/Video" button to reveal file upload input
      const mediaButtons = [
        '[aria-label="Photo/video"]',
        '[aria-label="ছবি/ভিডিও"]',
        'div[role="button"]:has-text("Photo/Video")',
      ];

      let mediaTrigger = null;
      for (const selector of mediaButtons) {
        try {
          const el = page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            mediaTrigger = el;
            break;
          }
        } catch (e) {
          // continue
        }
      }

      if (mediaTrigger) {
        await mediaTrigger.click();
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.waitFor({ state: "attached", timeout: 5000 });
        
        // Resolve absolute paths
        const resolvedPaths = mediaPaths.map(p => path.resolve(p));
        await fileInput.setInputFiles(resolvedPaths);
        console.log("Media files attached.");
        // Wait a few seconds for uploads to complete
        await page.waitForTimeout(5000);
      }
    }

    // Locate the submit "Post" button
    const postButtons = [
      'div[role="button"]:has-text("Post")',
      'div[role="button"]:has-text("পোস্ট করুন")',
      '[aria-label="Post"]',
      '[aria-label="পোস্ট"]',
    ];

    let postButton = null;
    for (const selector of postButtons) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          postButton = el;
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!postButton) {
      return { success: false, error: "Could not find the Facebook submit 'Post' button." };
    }

    // Clicks Post
    await postButton.click();
    console.log("Submit 'Post' clicked.");

    // Wait for the modal dialog to close (indicating publish success)
    try {
      const composerModal = page.locator('[role="dialog"]').first();
      await composerModal.waitFor({ state: "hidden", timeout: 15000 });
      console.log("Composer modal closed, indicating publish success.");
    } catch (e) {
      console.log("Timeout waiting for composer modal to close. Proceeding with screenshot.");
    }

    // Save success screenshot verification in private folder
    const screenshotDir = path.join(process.cwd(), "private/screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotFilename = `fb_${userId}_${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotFilename);
    await page.screenshot({ path: screenshotPath });
    console.log("Post screenshot saved to private location:", screenshotPath);

    return {
      success: true,
      screenshotPath: `/api/screenshots/${screenshotFilename}`,
      platformUrl: "https://www.facebook.com/",
    };
  } catch (error: unknown) {
    console.error("Facebook Playwright publishing error:", error);
    const message = error instanceof Error ? error.message : "Failed to automate Facebook post.";
    return { success: false, error: message };
  } finally {
    if (browser) await browser.close();
  }
}
