"use server";

import { signIn } from "@/auth";
import { ensureDatabaseSchema } from "@/lib/database-schema";
import { db } from "@/lib/db";
import { getDatabaseSetupError } from "@/lib/prisma-errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { AuthError } from "next-auth";

async function findUserAndSignIn(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { brandProfile: true },
  });

  const redirectTo = user?.brandProfile ? "/dashboard" : "/onboarding";

  await signIn("credentials", {
    email,
    password,
    redirectTo,
  });
  return { success: true, error: null };
}

export async function loginUser(
  prevState: unknown,
  formData: FormData,
): Promise<{ error: string | null; success: boolean }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const rateCheck = await checkRateLimit(`login:${email.toLowerCase()}`);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfterMs ?? 0) / 60000);
    return {
      error: `Too many login attempts. Try again in ${minutes} minute(s).`,
      success: false,
    };
  }

  try {
    return await findUserAndSignIn(email, password);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: "Invalid credentials. Please check your email and password.",
            success: false,
          };
        default:
          return { error: "An unexpected authentication error occurred.", success: false };
      }
    }

    if (await ensureDatabaseSchema(error)) {
      return await findUserAndSignIn(email, password);
    }

    const databaseError = getDatabaseSetupError(error);
    if (databaseError) {
      return { error: databaseError, success: false };
    }

    throw error;
  }
}
