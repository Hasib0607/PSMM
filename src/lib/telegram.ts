/** Send a Telegram notification when configured via env or per-user chat ID. */
export async function sendTelegramMessage(
  message: string,
  chatIdOverride?: string | null,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = chatIdOverride || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return false;
  }
}

export async function notifyDraftApproved(
  draftTitle: string,
  platform: string,
  chatId?: string | null,
): Promise<void> {
  await sendTelegramMessage(
    `✅ <b>Draft Approved</b>\n\n` +
      `<b>Platform:</b> ${platform}\n` +
      `<b>Idea:</b> ${draftTitle.substring(0, 200)}\n\n` +
      `Ready to publish from PSMM.`,
    chatId,
  );
}

export async function notifyPublishResult(
  draftTitle: string,
  platform: string,
  success: boolean,
  error?: string,
  chatId?: string | null,
): Promise<void> {
  const icon = success ? "🚀" : "❌";
  const status = success ? "Published successfully" : `Failed: ${error || "Unknown error"}`;
  await sendTelegramMessage(
    `${icon} <b>Publish ${success ? "Success" : "Failed"}</b>\n\n` +
      `<b>Platform:</b> ${platform}\n` +
      `<b>Idea:</b> ${draftTitle.substring(0, 200)}\n` +
      `<b>Status:</b> ${status}`,
    chatId,
  );
}
