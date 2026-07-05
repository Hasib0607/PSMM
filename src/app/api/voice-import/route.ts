import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { OpenAI } from "openai";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting check
  const rateLimit = await checkRateLimit(`voice:${session.user.id}`, 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many voice transcription requests. Please try again in a few minutes." },
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
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
    }

    // File size limit validation: Max 10MB
    const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: "Audio file size exceeds the maximum limit of 10MB." }, { status: 400 });
    }

    // MIME type/extension check
    const ALLOWED_MIME_TYPES = [
      "audio/webm",
      "audio/mp3",
      "audio/wav",
      "audio/mpeg",
      "audio/ogg",
      "audio/x-m4a",
      "audio/m4a",
      "audio/mp4",
      "audio/aac"
    ];
    const isAllowedExtension = /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(file.name);
    
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !isAllowedExtension) {
      return NextResponse.json({ error: `Forbidden: File type '${file.type}' is not supported.` }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Send the file blob directly to Whisper API
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Voice Note Transcription Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio. Please try again." },
      { status: 500 }
    );
  }
}
