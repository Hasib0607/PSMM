"use client";

import React, { useActionState, startTransition } from "react";
import Link from "next/link";
import { registerUser } from "./actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      return await registerUser(prevState, formData);
    },
    { error: null, success: false }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background radial elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 glow-purple">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Start managing your personal social media brand
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {state.error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center">
              Registration successful! Redirecting to onboarding...
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
            <input
              type="text"
              name="name"
              required
              disabled={isPending || state.success}
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              disabled={isPending || state.success}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              disabled={isPending || state.success}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || state.success}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
