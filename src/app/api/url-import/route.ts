import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { OpenAI } from "openai";
import { isSafeUrl } from "@/lib/ssrf";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting check
  const rateLimit = await checkRateLimit(`url:${session.user.id}`, 15, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many URL summary requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured in the environment." },
      { status: 500 }
    );
  }

  try {
    const { url } = await request.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Please enter a valid HTTP/HTTPS URL." }, { status: 400 });
    }

    // SSRF protection check
    const isSafe = await isSafeUrl(url);
    if (!isSafe) {
      return NextResponse.json({ error: "URL is invalid or resolves to a private/local network address." }, { status: 403 });
    }

    // Fetch the target URL content
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });

    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL. Status code: ${fetchResponse.status}` },
        { status: 400 }
      );
    }

    const html = await fetchResponse.text();

    // Strip out irrelevant sections to optimize tokens
    const bodyText = html
      .replace(/<head>[\s\S]*?<\/head>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ") // Strip HTML tags
      .replace(/\s+/g, " ")     // Collapse whitespace
      .trim()
      .substring(0, 8000);     // Take first 8000 characters

    if (!bodyText) {
      return NextResponse.json({ error: "No readable content found on the page." }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional content writer. Extract the core message, key insights, and main thesis from the text below, and summarize it in under 200 words. Format it as a clear topic outline suitable for creating social media posts.",
        },
        { role: "user", content: bodyText },
      ],
    });

    const summary = aiResponse.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("URL Summarizer Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse and summarize URL content." },
      { status: 500 }
    );
  }
}
