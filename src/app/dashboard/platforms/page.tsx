import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { FacebookConnectForm } from "./FacebookConnectForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Music } from "lucide-react";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

export default async function PlatformsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Retrieve existing Facebook account status
  const fbAccount = await db.socialAccount.findFirst({
    where: {
      userId: session.user.id,
      platform: "facebook",
    },
  });

  const otherPlatforms = [
    { name: "Instagram", phase: "Phase 4", method: "Browser Session", icon: InstagramIcon, color: "text-pink-400" },
    { name: "LinkedIn", phase: "Phase 5", method: "Browser Session", icon: LinkedinIcon, color: "text-blue-400" },
    { name: "YouTube", phase: "Phase 6", method: "OAuth API Connection", icon: YoutubeIcon, color: "text-red-400" },
    { name: "TikTok", phase: "Phase 7", method: "Browser Session", icon: Music, color: "text-teal-400" },
  ];

  return (
    <>
      <DashboardHeader
        title="Platforms"
        description="Connect and manage your personal social media accounts. Facebook publishing is active in Phase 3."
      />
      <div className="flex-1 p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Platform Connection Portal */}
          <FacebookConnectForm
            isConnected={!!fbAccount}
            lastHealthCheck={fbAccount?.lastHealthCheckAt}
          />

          {/* Guidelines info box */}
          <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm p-6 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                <Share2 className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-zinc-200">Personal Multi-Platform Publishing</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  PSMM connects directly to your personal accounts. Facebook personal walls use Playwright browser sessions to bypass developer API requirements.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Future Platforms Section */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Future Platforms (Phase 4+)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherPlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Card key={platform.name} className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm opacity-60">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm text-zinc-200 font-bold">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${platform.color}`} />
                        <span>{platform.name}</span>
                      </div>
                      <Badge className="bg-zinc-900 text-zinc-600 border border-zinc-800 text-[8px] px-1 py-0">
                        Locked
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-zinc-500 space-y-1">
                    <p className="font-medium">{platform.phase}</p>
                    <p>{platform.method}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
