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

  return <OnboardingForm initialData={initialData} name={session.user.name || ""} />;
}
