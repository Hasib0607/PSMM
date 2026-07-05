import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DraftList } from "./DraftList";

export default async function DraftsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all drafts saved in the database for the current user
  const drafts = await db.contentDraft.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <DashboardHeader
        title="Drafts"
        description="Review and manage all your generated multi-platform social media drafts"
      />
      <div className="flex-1 space-y-6 p-8">
        <DraftList initialDrafts={drafts} />
      </div>
    </>
  );
}
