"use client";

import React, { startTransition, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Badge,
  Camera,
  Check,
  ChevronDown,
  Eye,
  Flag,
  GripVertical,
  Hash,
  Heart,
  MessageCircle,
  Plus,
  Save,
  Sparkles,
  SquarePlay,
  Target,
  Trash2,
  User,
  Volume2,
  X,
} from "lucide-react";
import { saveBrandProfile } from "./actions";

type FormState = { error: string | null; success: boolean };

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

const nicheOptions = [
  "AI Solution Architecture",
  "AI-Powered E-commerce",
  "SaaS Product Development",
  "Startup Strategy",
  "Business Automation",
  "UI/UX Design",
  "Generative AI",
  "Product Strategy",
];

const audienceOptions = [
  "Entrepreneurs",
  "Tech Founders",
  "E-commerce Business Owners",
  "Developers",
  "Students",
];

const personalityOptions = ["Helpful", "Motivational", "Innovative", "Trustworthy", "Empathetic"];
const goalOptions = ["Grow Audience", "Generate Leads", "Increase Engagement", "Promote Business", "Establish Authority"];
const contentTypes = ["Tips & Tutorials", "Carousels", "Short Videos", "Long Videos", "Live Streams", "Stories"];

const platforms = [
  { name: "Instagram", icon: Camera, active: true, purpose: "Grow Audience", focus: "Behind the scenes, Tips", color: "text-pink-400" },
  { name: "LinkedIn", icon: Badge, active: true, purpose: "Build Authority", focus: "Thought leadership, Insights", color: "text-sky-400" },
  { name: "YouTube", icon: SquarePlay, active: true, purpose: "Educate & Grow", focus: "Tutorials, Vlogs, Tips", color: "text-red-400" },
  { name: "Facebook", icon: MessageCircle, active: true, purpose: "Community Building", focus: "Tips, Updates, Live", color: "text-blue-400" },
  { name: "X", icon: Hash, active: false, purpose: "Brand Awareness", focus: "Short updates, Thoughts", color: "text-zinc-100" },
];

const defaultPillars = [
  { title: "AI & Automation", note: "AI tools, automation tips, productivity", emoji: "🔥" },
  { title: "E-commerce Growth", note: "E-commerce tips, strategies, marketing", emoji: "🛍️" },
  { title: "Entrepreneurship", note: "Startup journey, business strategy", emoji: "👥" },
  { title: "Tech & Development", note: "Coding, tools, tech insights", emoji: "💻" },
];

function SectionCard({
  number,
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}: {
  number: number;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-[#171723]/82 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24)] ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-purple-400" />
        <h2 className="text-base font-semibold text-white">
          {number}. {title}
          {subtitle && <span className="ml-1 text-sm font-medium text-zinc-400">{subtitle}</span>}
        </h2>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-zinc-300">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-md border border-white/10 bg-white/[0.035] px-3 text-sm text-white placeholder:text-zinc-500 ${props.className ?? ""}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-16 w-full resize-none rounded-md border border-white/10 bg-white/[0.035] px-3 py-3 text-sm leading-5 text-white placeholder:text-zinc-500 ${props.className ?? ""}`}
    />
  );
}

function SelectBox({ children, name, value }: { children: React.ReactNode; name?: string; value?: string }) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={value}
        className="h-10 w-full appearance-none rounded-md border border-white/10 bg-white/[0.035] px-3 pr-9 text-sm text-white"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

function Chip({ label, selected = true }: { label: string; selected?: boolean }) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm ${
        selected
          ? "border-purple-500/35 bg-purple-500/16 text-purple-100"
          : "border-white/10 bg-transparent text-zinc-400"
      }`}
    >
      {selected && <Check className="h-3.5 w-3.5 text-purple-300" />}
      {label}
    </span>
  );
}

function RemovableChip({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-md border border-white/10 bg-white/[0.045] px-2.5 text-xs text-zinc-100">
      {label}
      <X className="h-3 w-3 text-zinc-400" />
    </span>
  );
}

export default function OnboardingForm({ initialData, name }: OnboardingFormProps) {
  const router = useRouter();
  const [pillars] = useState(defaultPillars);
  const [roles] = useState(["Entrepreneur", "Software Engineer", "E-commerce Expert"]);
  const [audiences] = useState(audienceOptions);
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      formData.delete("contentPillars");
      pillars.forEach((pillar) => formData.append("contentPillars", pillar.title));

      const result = await saveBrandProfile(prevState, formData);
      if (result.success) {
        setTimeout(() => {
          router.push("/dashboard/content");
        }, 800);
      }
      return result;
    },
    { error: null, success: false },
  );

  const fullName = name || "Hasina Parvin Deepa";
  const selectedNiche = initialData?.niche || nicheOptions.join(", ");
  const selectedAudience = initialData?.targetAudience || audiences.join(", ");
  const selectedProfession = initialData?.profession || roles.join(", ");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#070716] text-zinc-100">
      <main className="mx-auto w-full max-w-[1540px] px-5 py-7 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Personal Brand Setup</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Define your brand identity, audience and content preferences to get the best results.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-4 text-sm font-medium text-zinc-200 hover:bg-white/[0.06]"
          >
            <Eye className="h-4 w-4" />
            Preview My Brand
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="profession" value={selectedProfession} />
          <input type="hidden" name="niche" value={selectedNiche} />
          <input type="hidden" name="targetAudience" value={selectedAudience} />
          <input type="hidden" name="language" value={initialData?.language || "english"} />
          <input type="hidden" name="defaultPostTarget" value={initialData?.defaultPostTarget || 3} />

          {(state.error || state.success) && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                state.success
                  ? "border-emerald-500/25 bg-emerald-950/35 text-emerald-100"
                  : "border-red-500/25 bg-red-950/35 text-red-100"
              }`}
            >
              {state.success ? "Profile saved successfully. Redirecting..." : state.error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard number={1} title="About You" icon={User}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <TextInput defaultValue={fullName} />
                </div>
                <div>
                  <FieldLabel>Profession / Role</FieldLabel>
                  <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-2 py-1.5">
                    {roles.map((role) => (
                      <RemovableChip key={role} label={role} />
                    ))}
                    <ChevronDown className="ml-auto h-4 w-4 text-zinc-400" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Tagline / Short Bio</FieldLabel>
                  <TextArea
                    defaultValue="Building AI-powered solutions and e-commerce platforms that empower entrepreneurs and businesses to grow."
                  />
                  <p className="mt-1 text-right text-xs text-zinc-500">98/160</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={2} title="Niche / Specialization" icon={Target}>
              <div className="flex flex-wrap gap-3">
                {nicheOptions.map((option) => (
                  <Chip key={option} label={option} />
                ))}
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-dashed border-white/18 px-3 text-sm text-zinc-400"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Niche
                </button>
              </div>
            </SectionCard>

            <SectionCard number={3} title="Target Audience" icon={Sparkles}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Who are you creating content for?</FieldLabel>
                  <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-2 py-1.5">
                    {audiences.map((audience) => (
                      <RemovableChip key={audience} label={audience} />
                    ))}
                    <ChevronDown className="ml-auto h-4 w-4 text-zinc-400" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Audience Details (Optional)</FieldLabel>
                  <TextArea defaultValue="Entrepreneurs and small business owners who want to build and grow their online business using AI and technology." />
                  <p className="mt-1 text-right text-xs text-zinc-500">117/200</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={4} title="Brand Voice & Tone" icon={Volume2}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Voice</FieldLabel>
                    <SelectBox name="brandTone" value={initialData?.brandTone || "friendly"}>
                      <option value="friendly" className="bg-zinc-950">Friendly</option>
                      <option value="professional" className="bg-zinc-950">Professional</option>
                      <option value="educational" className="bg-zinc-950">Educational</option>
                      <option value="bold" className="bg-zinc-950">Bold</option>
                    </SelectBox>
                  </div>
                  <div>
                    <FieldLabel>Tone</FieldLabel>
                    <SelectBox value="professional">
                      <option className="bg-zinc-950">Professional</option>
                      <option className="bg-zinc-950">Conversational</option>
                      <option className="bg-zinc-950">Aspirational</option>
                    </SelectBox>
                  </div>
                </div>
                <div>
                  <FieldLabel>Personality</FieldLabel>
                  <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-2 py-1.5">
                    {personalityOptions.map((item) => (
                      <RemovableChip key={item} label={item} />
                    ))}
                    <ChevronDown className="ml-auto h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={5} title="Content Pillars" subtitle="(What you talk about)" icon={BriefcaseBusiness}>
              <div className="overflow-hidden rounded-md border border-white/10">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="grid grid-cols-[26px_1fr_1fr_28px] items-center gap-3 border-b border-white/8 px-3 py-3 last:border-b-0">
                    <GripVertical className="h-4 w-4 text-zinc-500" />
                    <div className="text-sm text-zinc-100">
                      <span className="mr-2">{pillar.emoji}</span>
                      {pillar.title}
                    </div>
                    <div className="hidden text-xs text-zinc-500 sm:block">{pillar.note}</div>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-purple-500/35 bg-purple-500/10 px-4 text-sm font-medium text-purple-200"
              >
                <Plus className="h-4 w-4" />
                Add Content Pillar
              </button>
            </SectionCard>

            <SectionCard number={6} title="Goals & Objectives" icon={Flag}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Primary Goal</FieldLabel>
                  <SelectBox value="build">
                    <option value="build" className="bg-zinc-950">Build Personal Brand</option>
                    <option className="bg-zinc-950">Generate Leads</option>
                    <option className="bg-zinc-950">Grow Community</option>
                  </SelectBox>
                </div>
                <div>
                  <FieldLabel>Other Goals (Select all that apply)</FieldLabel>
                  <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-2 py-1.5">
                    {goalOptions.map((goal) => (
                      <RemovableChip key={goal} label={goal} />
                    ))}
                    <ChevronDown className="ml-auto h-4 w-4 text-zinc-400" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Timeline</FieldLabel>
                  <SelectBox value="long">
                    <option value="long" className="bg-zinc-950">Long-term (6+ months)</option>
                    <option className="bg-zinc-950">Next 90 days</option>
                  </SelectBox>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard number={7} title="Social Media Preferences" subtitle="Select the platforms you're active on and your preferences" icon={Target}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {platforms.map((platform) => {
                const PlatformIcon = platform.icon;
                return (
                  <div key={platform.name} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlatformIcon className={`h-5 w-5 ${platform.color}`} />
                        <span className="text-sm font-medium text-white">{platform.name}</span>
                      </div>
                      <span className={`h-5 w-9 rounded-full p-0.5 ${platform.active ? "bg-purple-500" : "bg-zinc-600"}`}>
                        <span className={`block h-4 w-4 rounded-full bg-white transition ${platform.active ? "translate-x-4" : ""}`} />
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Purpose</FieldLabel>
                        <SelectBox value={platform.purpose}>
                          <option className="bg-zinc-950">{platform.purpose}</option>
                        </SelectBox>
                      </div>
                      <div>
                        <FieldLabel>Content Focus</FieldLabel>
                        <SelectBox value={platform.focus}>
                          <option className="bg-zinc-950">{platform.focus}</option>
                        </SelectBox>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard number={8} title="Content Preferences" icon={BriefcaseBusiness}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Content Types (Select all that apply)</FieldLabel>
                  <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-2 py-1.5">
                    {contentTypes.map((type) => (
                      <RemovableChip key={type} label={type} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Content Format You Prefer</FieldLabel>
                    <SelectBox value="short">
                      <option value="short" className="bg-zinc-950">Short & Visual</option>
                    </SelectBox>
                  </div>
                  <div>
                    <FieldLabel>Posting Frequency</FieldLabel>
                    <SelectBox value="3">
                      <option value="3" className="bg-zinc-950">3-4 times per week</option>
                    </SelectBox>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={9} title="References & Inspiration" subtitle="(Optional)" icon={Heart}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Brands / Creators you like</FieldLabel>
                  <TextInput defaultValue="Ali Abdaal, Gary Vee, Sara Blakely" />
                </div>
                <div>
                  <FieldLabel>What do you like about them?</FieldLabel>
                  <TextArea defaultValue="Their simplicity, value-packed content, and real-life experiences." />
                  <p className="mt-1 text-right text-xs text-zinc-500">72/200</p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 items-center gap-4 rounded-lg border border-white/10 bg-[#171723]/82 p-4 md:grid-cols-[180px_1fr_420px]">
            <button
              type="button"
              className="h-11 rounded-md border border-white/10 bg-white/[0.035] px-4 text-sm font-medium text-zinc-200 hover:bg-white/[0.06]"
            >
              Reset All
            </button>
            <p className="text-center text-sm text-zinc-500">You can update these settings anytime.</p>
            <button
              type="submit"
              disabled={isPending || state.success}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(124,58,237,0.26)] transition hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                "Saving Brand Profile..."
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Brand Profile
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
