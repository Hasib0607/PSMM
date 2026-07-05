"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerUser(
  prevState: unknown,
  formData: FormData,
): Promise<{ error: string | null; success: boolean }> {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;

  const rateCheck = await checkRateLimit(`register:${email}`);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfterMs ?? 0) / 60000);
    return {
      error: `Too many registration attempts. Try again in ${minutes} minute(s).`,
      success: false,
    };
  }

  const result = RegisterSchema.safeParse({ name, email, password });
  if (!result.success) {
    return { error: result.error.issues[0].message, success: false };
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        error: "Unable to create account. If you already have an account, try logging in.",
        success: false,
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/onboarding",
    });

    return { success: true, error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Account created but sign-in failed. Please try logging in.",
        success: false,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          error: "Unable to create account. If you already have an account, try logging in.",
          success: false,
        };
      }
      console.error("Registration Prisma error:", error);
      return {
        error: "Database error. Ensure the server database is configured and migrated.",
        success: false,
      };
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error("Registration DB connection error:", error);
      return {
        error: "Database connection failed. Please try again later.",
        success: false,
      };
    }

    // NextAuth signIn throws a redirect on success — must rethrow
    throw error;
  }
}
