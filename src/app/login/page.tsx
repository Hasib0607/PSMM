"use client";

import React, { useActionState, startTransition } from "react";
import Link from "next/link";
import { loginUser } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await loginUser(prevState, formData);
    },
    { error: null, success: false } as any
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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 glow-blue">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Welcome Back</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to manage your personal brand voice
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {state?.error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              disabled={isPending}
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
              disabled={isPending}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-400">
          New here?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
