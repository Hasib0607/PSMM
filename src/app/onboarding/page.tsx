import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (brandProfile) {
    redirect("/dashboard");
  }

  const initialData = null;

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10" />

      <OnboardingForm initialData={initialData} name={session.user.name || ""} />
    </div>
  );
}
