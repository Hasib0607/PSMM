import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Onboarding Guard: check if BrandProfile exists for this user
  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!brandProfile) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen bg-[#030014] text-zinc-100 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-950/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-950/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
