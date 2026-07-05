"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleAutomationPause, updateTelegramChatId } from "@/app/dashboard/drafts/actions";
import { AlertTriangle, PauseCircle, PlayCircle, Send } from "lucide-react";

interface AutomationControlsProps {
  automationPaused: boolean;
  telegramChatId: string | null;
}

export function AutomationControls({
  automationPaused,
  telegramChatId,
}: AutomationControlsProps) {
  const [paused, setPaused] = useState(automationPaused);
  const [chatId, setChatId] = useState(telegramChatId || "");
  const [loading, setLoading] = useState(false);
  const [savingChat, setSavingChat] = useState(false);

  const handleTogglePause = async () => {
    setLoading(true);
    try {
      const res = await toggleAutomationPause(!paused);
      if (res.success) {
        setPaused(!paused);
      } else {
        alert(res.error || "Failed to update pause state.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChatId = async () => {
    setSavingChat(true);
    try {
      const res = await updateTelegramChatId(chatId);
      if (res.success) {
        alert("Telegram chat ID saved.");
      } else {
        alert(res.error || "Failed to save chat ID.");
      }
    } finally {
      setSavingChat(false);
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 backdrop-blur-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Emergency Controls
        </h2>
        <p className="text-zinc-400 text-xs">
          Instantly halt all scheduled and background publishing jobs. Resume when ready.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
        <div>
          <p className="text-sm font-semibold text-zinc-200">
            Automation Status:{" "}
            <span className={paused ? "text-red-400" : "text-green-400"}>
              {paused ? "PAUSED" : "ACTIVE"}
            </span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            {paused
              ? "No posts will publish until you resume automation."
              : "Publishing and scheduling are enabled."}
          </p>
        </div>
        <Button
          onClick={handleTogglePause}
          disabled={loading}
          className={`${
            paused
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-950/60 hover:bg-red-900/60 border border-red-500/30"
          } text-white text-xs font-semibold px-4 py-2 cursor-pointer flex items-center gap-2`}
        >
          {paused ? (
            <>
              <PlayCircle className="h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <PauseCircle className="h-4 w-4" />
              Emergency Pause
            </>
          )}
        </Button>
      </div>

      <div className="border-t border-zinc-900 pt-6 space-y-3">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-400" />
          Telegram Notifications
        </h3>
        <p className="text-[11px] text-zinc-500">
          Get approval and publish alerts on Telegram. Set{" "}
          <code className="text-purple-400">TELEGRAM_BOT_TOKEN</code> in .env and your chat ID below.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Your Telegram chat ID (e.g. 123456789)"
            className="flex-1 px-3 py-2 bg-zinc-900/40 border border-zinc-800 rounded text-xs text-white outline-none focus:border-purple-500"
          />
          <Button
            onClick={handleSaveChatId}
            disabled={savingChat}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 cursor-pointer"
          >
            {savingChat ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
