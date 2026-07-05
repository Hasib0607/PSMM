"use client";

import { useActionState, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveFacebookSession, disconnectFacebook } from "./actions";
import { Shield, CheckCircle2, AlertTriangle, Key } from "lucide-react";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

interface FacebookConnectFormProps {
  isConnected: boolean;
  lastHealthCheck?: Date | null;
}

export function FacebookConnectForm({ isConnected, lastHealthCheck }: FacebookConnectFormProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await saveFacebookSession(prevState, formData);
    },
    { error: null, success: false } as any
  );

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Facebook? Scheduled posts will fail.")) return;
    setDisconnecting(true);
    try {
      const res = await disconnectFacebook();
      if (!res.success) {
        alert(res.error || "Failed to disconnect Facebook.");
      }
    } catch (err) {
      console.error(err);
      alert("Error disconnecting account.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3 border-b border-zinc-900/50">
          <CardTitle className="flex items-center justify-between text-base text-zinc-100 font-bold">
            <div className="flex items-center gap-2">
              <FacebookIcon className="h-5 w-5 text-blue-400 fill-blue-400" />
              <span>Facebook (Personal Account)</span>
            </div>
            <Badge className="bg-purple-950/40 text-purple-400 border border-purple-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs text-zinc-400">
          <div className="space-y-1">
            <p className="font-semibold text-zinc-300">Connection Method</p>
            <p>Playwright Headless Browser Session (Cookies-backed)</p>
          </div>
          {lastHealthCheck && (
            <div className="space-y-1">
              <p className="font-semibold text-zinc-300">Last Status Check</p>
              <p>{new Date(lastHealthCheck).toLocaleString()}</p>
            </div>
          )}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded p-2 text-[10px] flex items-start gap-2">
            <Shield className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <p>Session data is stored as a secure local JSON file on the server. Do not share your cookie files with third parties.</p>
          </div>
          <Button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full mt-2 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 text-xs font-semibold py-2 cursor-pointer"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect Facebook"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-zinc-900/50">
        <CardTitle className="flex items-center justify-between text-base text-zinc-100 font-bold">
          <div className="flex items-center gap-2">
            <FacebookIcon className="h-5 w-5 text-zinc-500" />
            <span>Facebook (Personal Account)</span>
          </div>
          <Badge className="bg-zinc-900 text-zinc-500 border border-zinc-800">
            Disconnected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-1 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-300">Requirements:</p>
          <p>Facebook personal profile connection requires exporting browser session cookies in JSON format (e.g. using a Chrome extension like &quot;EditThisCookie&quot; or &quot;Get cookies.txt&quot; while logged into Facebook).</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-3 rounded-lg text-[11px] text-center flex items-center gap-2 justify-center">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-purple-400" />
              Paste Session Cookies (JSON array)
            </label>
            <textarea
              name="cookies"
              required
              rows={5}
              disabled={isPending}
              placeholder='[{"name": "c_user", "value": "1000...", "domain": ".facebook.com"}, ...]'
              className="w-full px-3 py-2 bg-zinc-900/30 border border-zinc-800 rounded-lg text-white text-[11px] font-mono outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 transition-colors cursor-pointer"
          >
            {isPending ? "Connecting Account..." : "Connect Facebook"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
