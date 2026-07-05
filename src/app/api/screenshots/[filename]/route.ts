import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { filename } = await params;

  // Sanitize filename and verify ownership
  if (!/^[a-zA-Z0-9_-]+\.png$/.test(filename)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const userPrefix = `fb_${session.user.id}_`;
  const appiumPrefix = `appium_${session.user.id}_`;
  if (!filename.startsWith(userPrefix) && !filename.startsWith(appiumPrefix)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const screenshotPath = path.join(process.cwd(), "private/screenshots", filename);

  if (!fs.existsSync(screenshotPath)) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(screenshotPath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    return new NextResponse("Failed to read file", { status: 500 });
  }
}
