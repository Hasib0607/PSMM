"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { OpenAI } from "openai";
import { isSafeUrl } from "@/lib/ssrf";
import { checkRateLimit } from "@/lib/rate-limit";

export async function addRssFeed(
  feedUrl: string,
  niche?: string
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  if (!feedUrl || !feedUrl.startsWith("http")) {
    return { error: "Please enter a valid RSS feed URL.", success: false };
  }

  const isSafe = await isSafeUrl(feedUrl);
  if (!isSafe) {
    return { error: "Feed URL is invalid or points to a private network address.", success: false };
  }

  try {
    await db.rssFeed.create({
      data: {
        userId: session.user.id,
        feedUrl,
        niche: niche || "General",
        active: true,
      },
    });

    revalidatePath("/dashboard/research");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Add RSS Feed Error:", error);
    return { error: error.message || "Failed to add RSS feed.", success: false };
  }
}

export async function deleteRssFeed(id: string): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  try {
    await db.rssFeed.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/dashboard/research");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Delete RSS Feed Error:", error);
    return { error: error.message || "Failed to delete RSS feed.", success: false };
  }
}

export async function addCompetitor(
  accountUrl: string,
  platform: string,
  notes?: string
): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  if (!accountUrl) {
    return { error: "Account URL is required.", success: false };
  }

  try {
    await db.competitorAccount.create({
      data: {
        userId: session.user.id,
        platform: platform as any,
        accountUrl,
        notes,
      },
    });

    revalidatePath("/dashboard/research");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Add Competitor Error:", error);
    return { error: error.message || "Failed to add competitor account.", success: false };
  }
}

export async function deleteCompetitor(id: string): Promise<{ error: string | null; success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  try {
    await db.competitorAccount.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/dashboard/research");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Delete Competitor Error:", error);
    return { error: error.message || "Failed to delete competitor account.", success: false };
  }
}

export async function fetchTrendSuggestions(): Promise<{
  error: string | null;
  success: boolean;
  count?: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  // Rate Limiting check: Max 5 per 15 mins
  const rateLimit = await checkRateLimit(`trends:${session.user.id}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      error: "Too many trend requests. Please wait a few minutes before scanning feeds again.",
      success: false,
    };
  }

  try {
    const feeds = await db.rssFeed.findMany({
      where: { userId: session.user.id, active: true },
    });

    if (feeds.length === 0) {
      return { error: "No active RSS feeds found. Please add a feed first.", success: false };
    }

    const scrapedArticles: { title: string; link: string; source: string }[] = [];

    // Parse RSS XML feeds using regex
    for (const feed of feeds) {
      try {
        const isSafe = await isSafeUrl(feed.feedUrl);
        if (!isSafe) {
          console.warn(`SSRF filter blocked fetching unsafe RSS feed: ${feed.feedUrl}`);
          continue;
        }

        const res = await fetch(feed.feedUrl, {
          headers: { "User-Agent": "Mozilla/5.0 PSMM Scraper" },
          next: { revalidate: 3600 },
        });

        if (!res.ok) continue;
        const xmlText = await res.text();

        const matches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi);
        let count = 0;

        for (const match of matches) {
          if (count >= 5) break; // Take first 5 items from each feed
          const itemContent = match[1];
          const titleMatch =
            itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
            itemContent.match(/<title>([\s\S]*?)<\/title>/i);
          const linkMatch =
            itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ||
            itemContent.match(/<link>([\s\S]*?)<\/link>/i);

          if (titleMatch) {
            scrapedArticles.push({
              title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
              link: linkMatch ? linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "",
              source: feed.feedUrl,
            });
            count++;
          }
        }

        // Update lastFetchedAt
        await db.rssFeed.update({
          where: { id: feed.id },
          data: { lastFetchedAt: new Date() },
        });
      } catch (err) {
        console.error(`Failed to parse feed: ${feed.feedUrl}`, err);
      }
    }

    if (scrapedArticles.length === 0) {
      return { error: "No articles could be retrieved from the active feeds.", success: false };
    }

    if (!process.env.OPENAI_API_KEY) {
      return { error: "OpenAI API key not configured.", success: false };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build OpenAI research prompt
    const articlesPrompt = scrapedArticles
      .map((a, i) => `[Article #${i + 1}] Title: "${a.title}" | Link: ${a.link}`)
      .join("\n");

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional social media researcher and strategist. Review the articles below and identify key trending topics. Generate exactly 3 creative social media post ideas. Return your output strictly as a JSON array of objects matching this schema: " +
            JSON.stringify([
              {
                title: "Short catchy title for the idea",
                content: "Detailed description of the post concept, outline, and target points.",
                tags: ["tag1", "tag2"],
              },
            ]),
        },
        { role: "user", content: `Articles list:\n${articlesPrompt}` },
      ],
    });

    const parsedIdeas = JSON.parse(aiResponse.choices[0].message.content || "[]");

    if (!Array.isArray(parsedIdeas)) {
      return { error: "Failed to extract structured recommendations from AI.", success: false };
    }

    // Insert ideas into Inspiration Inbox
    for (const idea of parsedIdeas) {
      await db.inspirationInbox.create({
        data: {
          userId: session.user.id,
          type: "link",
          title: idea.title || "Trending Inspiration",
          content: `${idea.content}\n\nGenerated from recent trending niche news feeds.`,
          tags: idea.tags || [],
          status: "new",
        },
      });
    }

    revalidatePath("/dashboard/inbox");
    revalidatePath("/dashboard/research");
    return { success: true, error: null, count: parsedIdeas.length };
  } catch (error: any) {
    console.error("Trends scraper failure:", error);
    return { error: error.message || "Scraper failed.", success: false };
  }
}

export async function scanCompetitorAccounts(): Promise<{
  error: string | null;
  success: boolean;
  count?: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", success: false };
  }

  const rateLimit = await checkRateLimit(`competitors:${session.user.id}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: "Too many competitor scans. Please wait a few minutes.", success: false };
  }

  try {
    const competitors = await db.competitorAccount.findMany({
      where: { userId: session.user.id },
    });

    if (competitors.length === 0) {
      return { error: "No competitor accounts to scan. Add some first.", success: false };
    }

    let ideasAdded = 0;

    for (const comp of competitors) {
      const isSafe = await isSafeUrl(comp.accountUrl);
      if (!isSafe) continue;

      try {
        const res = await fetch(comp.accountUrl, {
          headers: { "User-Agent": "Mozilla/5.0 PSMM Competitor Watch" },
          next: { revalidate: 3600 },
        });

        if (!res.ok) continue;
        const html = await res.text();

        const titleMatch =
          html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<title>([^<]+)<\/title>/i);
        const descMatch = html.match(
          /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        );

        const title = titleMatch?.[1]?.trim();
        const description = descMatch?.[1]?.trim();

        if (!title) continue;

        await db.inspirationInbox.create({
          data: {
            userId: session.user.id,
            type: "link",
            title: `Competitor insight: ${title.substring(0, 80)}`,
            content:
              `${description || title}\n\nSource: ${comp.accountUrl} (${comp.platform})` +
              (comp.notes ? `\nNotes: ${comp.notes}` : ""),
            tags: ["competitor", comp.platform],
            status: "new",
          },
        });

        await db.competitorAccount.update({
          where: { id: comp.id },
          data: { lastCheckedAt: new Date() },
        });

        ideasAdded++;
      } catch (err) {
        console.error(`Failed to scan competitor ${comp.accountUrl}:`, err);
      }
    }

    if (ideasAdded === 0) {
      return { error: "Could not extract content from competitor pages.", success: false };
    }

    revalidatePath("/dashboard/inbox");
    revalidatePath("/dashboard/research");
    return { success: true, error: null, count: ideasAdded };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Competitor scan failed.";
    return { error: message, success: false };
  }
}
