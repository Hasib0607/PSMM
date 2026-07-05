"use client";

import React, { useState, useActionState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBrandProfile } from "./actions";

interface OnboardingFormProps {
  initialData: {
    profession: string;
    niche: string;
    targetAudience: string;
    brandTone: string;
    language: string;
    defaultPostTarget: number;
    contentPillars: string[];
  } | null;
  name: string;
}

export default function OnboardingForm({ initialData, name }: OnboardingFormProps) {
  const router = useRouter();
  const [pillars, setPillars] = useState<string[]>(
    initialData?.contentPillars && initialData.contentPillars.length > 0
      ? initialData.contentPillars
      : [""]
  );

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Append all pillars to formData
      formData.delete("contentPillars");
      pillars.forEach(p => {
        if (p.trim()) formData.append("contentPillars", p);
      });

      const result = await saveBrandProfile(prevState, formData);
      if (result.success) {
        setTimeout(() => {
          router.push("/dashboard/content");
        }, 1500);
      }
      return result;
    },
    { error: null, success: false } as any
  );

  const addPillar = () => {
    setPillars([...pillars, ""]);
  };

  const removePillar = (index: number) => {
    if (pillars.length === 1) {
      setPillars([""]);
      return;
    }
    const newPillars = pillars.filter((_, i) => i !== index);
    setPillars(newPillars);
  };

  const handlePillarChange = (index: number, val: string) => {
    const newPillars = [...pillars];
    newPillars[index] = val;
    setPillars(newPillars);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="w-full max-w-2xl glass-card rounded-2xl p-8 sm:p-10 glow-purple">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">
          {initialData ? "Edit Brand Profile" : `Welcome, ${name}`}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Define your brand voice and target audience parameters
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
            Profile saved successfully! Redirecting to dashboard...
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Profession / Role</label>
            <input
              type="text"
              name="profession"
              required
              disabled={isPending || state.success}
              defaultValue={initialData?.profession || ""}
              placeholder="e.g. Software Engineer, Doctor"
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Niche / Specialization</label>
            <input
              type="text"
              name="niche"
              required
              disabled={isPending || state.success}
              defaultValue={initialData?.niche || ""}
              placeholder="e.g. Web Dev tutorials, Health tips"
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Target Audience</label>
          <input
            type="text"
            name="targetAudience"
            required
            disabled={isPending || state.success}
            defaultValue={initialData?.targetAudience || ""}
            placeholder="e.g. tech founders, junior developers, general public"
            className="w-full px-4 py-3 rounded-lg text-white text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Brand Tone</label>
            <select
              name="brandTone"
              disabled={isPending || state.success}
              defaultValue={initialData?.brandTone || "friendly"}
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            >
              <option value="professional" className="bg-zinc-900 text-white">Professional</option>
              <option value="friendly" className="bg-zinc-900 text-white">Friendly</option>
              <option value="educational" className="bg-zinc-900 text-white">Educational</option>
              <option value="funny" className="bg-zinc-900 text-white">Funny</option>
              <option value="bold" className="bg-zinc-900 text-white">Bold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Language</label>
            <select
              name="language"
              disabled={isPending || state.success}
              defaultValue={initialData?.language || "banglish"}
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            >
              <option value="bangla" className="bg-zinc-900 text-white">Bangla</option>
              <option value="english" className="bg-zinc-900 text-white">English</option>
              <option value="banglish" className="bg-zinc-900 text-white">Banglish (Bengali-English Mix)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Daily Goal (Posts)</label>
            <input
              type="number"
              name="defaultPostTarget"
              required
              disabled={isPending || state.success}
              defaultValue={initialData?.defaultPostTarget || 2}
              min="1"
              max="10"
              className="w-full px-4 py-3 rounded-lg text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Content Pillars</label>
          <div className="space-y-3">
            {pillars.map((pillar, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={pillar}
                  onChange={(e) => handlePillarChange(index, e.target.value)}
                  required={index === 0}
                  disabled={isPending || state.success}
                  placeholder={`Pillar ${index + 1} (e.g. Life coding lessons, Quick tips)`}
                  className="flex-1 px-4 py-3 rounded-lg text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => removePillar(index)}
                  disabled={isPending || state.success}
                  className="px-4 py-3 bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/60 rounded-lg text-sm transition-all duration-150"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPillar}
              disabled={isPending || state.success}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium mt-1 inline-block"
            >
              + Add Content Pillar
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || state.success}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3.5 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-4"
        >
          {isPending ? "Saving Profile..." : "Save Brand Profile"}
        </button>
      </form>
    </div>
  );
}
