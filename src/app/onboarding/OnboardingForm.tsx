"use client";

import React, { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  BriefcaseBusiness,
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

type ContentPillar = {
  id: string;
  emoji: string;
  title: string;
  note: string;
};

type PlatformPreference = {
  id: string;
  name: string;
  enabled: boolean;
  purpose: string;
  contentFocus: string;
};

type Goals = {
  primary: string;
  other: string[];
  timeline: string;
};

type ContentPreferences = {
  types: string[];
  format: string;
  frequency: string;
};

type References = {
  brands: string;
  notes: string;
};

export type OnboardingInitialData = {
  fullName: string;
  profession: string;
  niche: string;
  tagline: string;
  targetAudience: string;
  audienceDetails: string;
  brandTone: string;
  tone: string;
  language: string;
  defaultPostTarget: number;
  contentPillars: string[];
  contentPillarDetails: ContentPillar[];
  roles: string[];
  niches: string[];
  audienceSegments: string[];
  personality: string[];
  goals: Goals;
  socialPreferences: PlatformPreference[];
  contentPreferences: ContentPreferences;
  references: References;
} | null;

interface OnboardingFormProps {
  initialData: OnboardingInitialData;
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
const contentTypeOptions = ["Tips & Tutorials", "Carousels", "Short Videos", "Long Videos", "Live Streams", "Stories"];
const purposeOptions = ["Grow Audience", "Build Authority", "Educate & Grow", "Community Building", "Brand Awareness", "Generate Leads"];
const focusOptions = [
  "Behind the scenes, Tips",
  "Thought leadership, Insights",
  "Tutorials, Vlogs, Tips",
  "Tips, Updates, Live",
  "Short updates, Thoughts",
  "Case studies, Wins",
];

const defaultPillars: ContentPillar[] = [
  { id: "ai-automation", title: "AI & Automation", note: "AI tools, automation tips, productivity", emoji: "🔥" },
  { id: "ecommerce-growth", title: "E-commerce Growth", note: "E-commerce tips, strategies, marketing", emoji: "🛍️" },
  { id: "entrepreneurship", title: "Entrepreneurship", note: "Startup journey, business strategy", emoji: "👥" },
  { id: "tech-development", title: "Tech & Development", note: "Coding, tools, tech insights", emoji: "💻" },
];

const defaultPlatforms: PlatformPreference[] = [
  { id: "instagram", name: "Instagram", enabled: true, purpose: "Grow Audience", contentFocus: "Behind the scenes, Tips" },
  { id: "linkedin", name: "LinkedIn", enabled: true, purpose: "Build Authority", contentFocus: "Thought leadership, Insights" },
  { id: "youtube", name: "YouTube", enabled: true, purpose: "Educate & Grow", contentFocus: "Tutorials, Vlogs, Tips" },
  { id: "facebook", name: "Facebook", enabled: true, purpose: "Community Building", contentFocus: "Tips, Updates, Live" },
  { id: "tiktok", name: "TikTok", enabled: false, purpose: "Brand Awareness", contentFocus: "Short videos, Trends" },
];

const platformMeta = {
  instagram: { icon: Camera, color: "text-pink-400" },
  linkedin: { icon: Badge, color: "text-sky-400" },
  youtube: { icon: SquarePlay, color: "text-red-400" },
  facebook: { icon: MessageCircle, color: "text-blue-400" },
  tiktok: { icon: Hash, color: "text-zinc-100" },
};

function makeId(label: string) {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
}

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function SectionCard({
  number,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  number: number;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#171723]/82 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24)]">
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

function SelectBox({
  value,
  onChange,
  options,
  name,
}: {
  value: string;
  onChange?: (value: string) => void;
  options: string[];
  name?: string;
}) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-white/10 bg-white/[0.035] px-3 pr-9 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-zinc-950">
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

function MultiValueInput({
  values,
  onChange,
  placeholder,
  options = [],
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  options?: string[];
}) {
  const [draft, setDraft] = useState("");

  const addValue = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    onChange(uniq([...values, clean]));
    setDraft("");
  };

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-2">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(values.filter((item) => item !== value))}
            className="inline-flex h-7 items-center gap-2 rounded-md border border-white/10 bg-white/[0.045] px-2.5 text-xs text-zinc-100"
          >
            {value}
            <X className="h-3 w-3 text-zinc-400" />
          </button>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addValue(draft);
            }
            if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => addValue(draft)}
          placeholder={placeholder}
          className="h-7 min-w-[180px] flex-1 border-0 bg-transparent px-1 text-sm text-white shadow-none outline-none placeholder:text-zinc-500 focus:border-0 focus:shadow-none"
        />
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </div>
      {options.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-white/8 pt-2">
          {options.map((option) => {
            const selected = values.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange(selected ? values.filter((value) => value !== option) : [...values, option])}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs ${
                  selected
                    ? "border-purple-500/35 bg-purple-500/16 text-purple-100"
                    : "border-white/10 bg-white/[0.02] text-zinc-400"
                }`}
              >
                {selected && <Check className="h-3 w-3" />}
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm ${
        selected
          ? "border-purple-500/35 bg-purple-500/16 text-purple-100"
          : "border-white/10 bg-transparent text-zinc-400 hover:border-white/20"
      }`}
    >
      {selected ? <Check className="h-3.5 w-3.5 text-purple-300" /> : <Plus className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

export default function OnboardingForm({ initialData, name }: OnboardingFormProps) {
  const router = useRouter();
  const defaultRoles = initialData?.roles?.length ? initialData.roles : ["Entrepreneur", "Software Engineer", "E-commerce Expert"];
  const defaultNiches = initialData?.niches?.length ? initialData.niches : nicheOptions;
  const defaultAudiences = initialData?.audienceSegments?.length ? initialData.audienceSegments : audienceOptions;

  const [fullName, setFullName] = useState(initialData?.fullName || name || "");
  const [roles, setRoles] = useState(defaultRoles);
  const [tagline, setTagline] = useState(
    initialData?.tagline || "Building AI-powered solutions and e-commerce platforms that empower entrepreneurs and businesses to grow.",
  );
  const [niches, setNiches] = useState(defaultNiches);
  const [audiences, setAudiences] = useState(defaultAudiences);
  const [audienceDetails, setAudienceDetails] = useState(
    initialData?.audienceDetails || "Entrepreneurs and small business owners who want to build and grow their online business using AI and technology.",
  );
  const [brandTone, setBrandTone] = useState(initialData?.brandTone || "Friendly");
  const [tone, setTone] = useState(initialData?.tone || "Professional");
  const [personality, setPersonality] = useState(
    initialData?.personality?.length ? initialData.personality : personalityOptions,
  );
  const [pillars, setPillars] = useState<ContentPillar[]>(
    initialData?.contentPillarDetails?.length
      ? initialData.contentPillarDetails
      : initialData?.contentPillars?.length
        ? initialData.contentPillars.map((title, index) => ({
            id: makeId(title),
            title,
            emoji: defaultPillars[index]?.emoji || "•",
            note: defaultPillars[index]?.note || "",
          }))
        : defaultPillars,
  );
  const [draggedPillarId, setDraggedPillarId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goals>(
    initialData?.goals || {
      primary: "Build Personal Brand",
      other: goalOptions,
      timeline: "Long-term (6+ months)",
    },
  );
  const [platforms, setPlatforms] = useState<PlatformPreference[]>(
    initialData?.socialPreferences?.length ? initialData.socialPreferences : defaultPlatforms,
  );
  const [contentPreferences, setContentPreferences] = useState<ContentPreferences>(
    initialData?.contentPreferences || {
      types: contentTypeOptions,
      format: "Short & Visual",
      frequency: "3-4 times per week",
    },
  );
  const [references, setReferences] = useState<References>(
    initialData?.references || {
      brands: "Ali Abdaal, Gary Vee, Sara Blakely",
      notes: "Their simplicity, value-packed content, and real-life experiences.",
    },
  );
  const [showPreview, setShowPreview] = useState(false);

  const [state, formAction, isPending] = useActionState(saveBrandProfile, {
    error: null,
    success: false,
  } satisfies FormState);

  useEffect(() => {
    if (!state.success) return;

    const timeout = window.setTimeout(() => {
      router.push("/dashboard/content");
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [router, state.success]);

  const payload = useMemo(
    () => ({
      roles,
      niches,
      audienceSegments: audiences,
      personality,
      contentPillarDetails: pillars,
      goals,
      socialPreferences: platforms,
      contentPreferences,
      references,
    }),
    [roles, niches, audiences, personality, pillars, goals, platforms, contentPreferences, references],
  );

  const resetAll = () => {
    setFullName(name || "");
    setRoles(["Entrepreneur", "Software Engineer", "E-commerce Expert"]);
    setTagline("Building AI-powered solutions and e-commerce platforms that empower entrepreneurs and businesses to grow.");
    setNiches(nicheOptions);
    setAudiences(audienceOptions);
    setAudienceDetails("Entrepreneurs and small business owners who want to build and grow their online business using AI and technology.");
    setBrandTone("Friendly");
    setTone("Professional");
    setPersonality(personalityOptions);
    setPillars(defaultPillars);
    setGoals({ primary: "Build Personal Brand", other: goalOptions, timeline: "Long-term (6+ months)" });
    setPlatforms(defaultPlatforms);
    setContentPreferences({ types: contentTypeOptions, format: "Short & Visual", frequency: "3-4 times per week" });
    setReferences({ brands: "Ali Abdaal, Gary Vee, Sara Blakely", notes: "Their simplicity, value-packed content, and real-life experiences." });
  };

  const updatePillar = (id: string, patch: Partial<ContentPillar>) => {
    setPillars((current) => current.map((pillar) => (pillar.id === id ? { ...pillar, ...patch } : pillar)));
  };

  const movePillar = (targetId: string) => {
    if (!draggedPillarId || draggedPillarId === targetId) return;
    setPillars((current) => {
      const draggedIndex = current.findIndex((pillar) => pillar.id === draggedPillarId);
      const targetIndex = current.findIndex((pillar) => pillar.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return current;
      const next = [...current];
      const [dragged] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, dragged);
      return next;
    });
    setDraggedPillarId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
            onClick={() => setShowPreview(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-4 text-sm font-medium text-zinc-200 hover:bg-white/[0.06]"
          >
            <Eye className="h-4 w-4" />
            Preview My Brand
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="roles" value={JSON.stringify(payload.roles)} />
          <input type="hidden" name="niches" value={JSON.stringify(payload.niches)} />
          <input type="hidden" name="audienceSegments" value={JSON.stringify(payload.audienceSegments)} />
          <input type="hidden" name="personality" value={JSON.stringify(payload.personality)} />
          <input type="hidden" name="contentPillarDetails" value={JSON.stringify(payload.contentPillarDetails)} />
          <input type="hidden" name="goals" value={JSON.stringify(payload.goals)} />
          <input type="hidden" name="socialPreferences" value={JSON.stringify(payload.socialPreferences)} />
          <input type="hidden" name="contentPreferences" value={JSON.stringify(payload.contentPreferences)} />
          <input type="hidden" name="references" value={JSON.stringify(payload.references)} />
          <input type="hidden" name="language" value={initialData?.language || "english"} />
          <input type="hidden" name="defaultPostTarget" value="3" />

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
                  <TextInput name="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
                <div>
                  <FieldLabel>Profession / Role</FieldLabel>
                  <MultiValueInput values={roles} onChange={setRoles} placeholder="Add a role" />
                </div>
                <div>
                  <FieldLabel>Tagline / Short Bio</FieldLabel>
                  <TextArea
                    name="tagline"
                    value={tagline}
                    maxLength={160}
                    onChange={(event) => setTagline(event.target.value)}
                  />
                  <p className="mt-1 text-right text-xs text-zinc-500">{tagline.length}/160</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={2} title="Niche / Specialization" icon={Target}>
              <div className="flex flex-wrap gap-3">
                {nicheOptions.map((option) => (
                  <ToggleChip
                    key={option}
                    label={option}
                    selected={niches.includes(option)}
                    onClick={() => setNiches(niches.includes(option) ? niches.filter((item) => item !== option) : [...niches, option])}
                  />
                ))}
              </div>
              <div className="mt-4">
                <MultiValueInput values={niches} onChange={setNiches} placeholder="Add custom niche" />
              </div>
            </SectionCard>

            <SectionCard number={3} title="Target Audience" icon={Sparkles}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Who are you creating content for?</FieldLabel>
                  <MultiValueInput
                    values={audiences}
                    onChange={setAudiences}
                    options={audienceOptions}
                    placeholder="Add audience"
                  />
                </div>
                <div>
                  <FieldLabel>Audience Details (Optional)</FieldLabel>
                  <TextArea
                    name="audienceDetails"
                    value={audienceDetails}
                    maxLength={200}
                    onChange={(event) => setAudienceDetails(event.target.value)}
                  />
                  <p className="mt-1 text-right text-xs text-zinc-500">{audienceDetails.length}/200</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={4} title="Brand Voice & Tone" icon={Volume2}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Voice</FieldLabel>
                    <SelectBox
                      name="brandTone"
                      value={brandTone}
                      onChange={setBrandTone}
                      options={["Friendly", "Professional", "Educational", "Bold", "Funny"]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Tone</FieldLabel>
                    <SelectBox
                      name="tone"
                      value={tone}
                      onChange={setTone}
                      options={["Professional", "Conversational", "Aspirational", "Direct", "Warm"]}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Personality</FieldLabel>
                  <MultiValueInput
                    values={personality}
                    onChange={setPersonality}
                    options={personalityOptions}
                    placeholder="Add personality"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard number={5} title="Content Pillars" subtitle="(What you talk about)" icon={BriefcaseBusiness}>
              <div className="overflow-hidden rounded-md border border-white/10">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    draggable
                    onDragStart={() => setDraggedPillarId(pillar.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => movePillar(pillar.id)}
                    className="grid grid-cols-[26px_54px_1fr_1.2fr_32px] items-center gap-3 border-b border-white/8 px-3 py-3 last:border-b-0"
                  >
                    <GripVertical className="h-4 w-4 cursor-grab text-zinc-500 active:cursor-grabbing" />
                    <TextInput
                      aria-label="Pillar emoji"
                      value={pillar.emoji}
                      onChange={(event) => updatePillar(pillar.id, { emoji: event.target.value })}
                      className="text-center"
                    />
                    <TextInput
                      aria-label="Pillar title"
                      value={pillar.title}
                      onChange={(event) => updatePillar(pillar.id, { title: event.target.value })}
                    />
                    <TextInput
                      aria-label="Pillar note"
                      value={pillar.note}
                      onChange={(event) => updatePillar(pillar.id, { note: event.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setPillars(pillars.filter((item) => item.id !== pillar.id))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPillars([...pillars, { id: makeId("pillar"), emoji: "✨", title: "New Pillar", note: "" }])}
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
                  <SelectBox
                    value={goals.primary}
                    onChange={(primary) => setGoals({ ...goals, primary })}
                    options={["Build Personal Brand", "Generate Leads", "Grow Community", "Increase Sales"]}
                  />
                </div>
                <div>
                  <FieldLabel>Other Goals (Select all that apply)</FieldLabel>
                  <MultiValueInput
                    values={goals.other}
                    onChange={(other) => setGoals({ ...goals, other })}
                    options={goalOptions}
                    placeholder="Add goal"
                  />
                </div>
                <div>
                  <FieldLabel>Timeline</FieldLabel>
                  <SelectBox
                    value={goals.timeline}
                    onChange={(timeline) => setGoals({ ...goals, timeline })}
                    options={["Next 30 days", "Next 90 days", "Long-term (6+ months)", "Always-on"]}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard number={7} title="Social Media Preferences" subtitle="Select the platforms you're active on and your preferences" icon={Target}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {platforms.map((platform) => {
                const meta = platformMeta[platform.id as keyof typeof platformMeta] || platformMeta.tiktok;
                const PlatformIcon = meta.icon;
                return (
                  <div key={platform.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlatformIcon className={`h-5 w-5 ${meta.color}`} />
                        <span className="text-sm font-medium text-white">{platform.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPlatforms((current) =>
                            current.map((item) => (item.id === platform.id ? { ...item, enabled: !item.enabled } : item)),
                          )
                        }
                        className={`h-5 w-9 rounded-full p-0.5 transition ${platform.enabled ? "bg-purple-500" : "bg-zinc-600"}`}
                      >
                        <span className={`block h-4 w-4 rounded-full bg-white transition ${platform.enabled ? "translate-x-4" : ""}`} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Purpose</FieldLabel>
                        <SelectBox
                          value={platform.purpose}
                          onChange={(purpose) =>
                            setPlatforms((current) =>
                              current.map((item) => (item.id === platform.id ? { ...item, purpose } : item)),
                            )
                          }
                          options={purposeOptions}
                        />
                      </div>
                      <div>
                        <FieldLabel>Content Focus</FieldLabel>
                        <SelectBox
                          value={platform.contentFocus}
                          onChange={(contentFocus) =>
                            setPlatforms((current) =>
                              current.map((item) => (item.id === platform.id ? { ...item, contentFocus } : item)),
                            )
                          }
                          options={focusOptions}
                        />
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
                  <MultiValueInput
                    values={contentPreferences.types}
                    onChange={(types) => setContentPreferences({ ...contentPreferences, types })}
                    options={contentTypeOptions}
                    placeholder="Add content type"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Content Format You Prefer</FieldLabel>
                    <SelectBox
                      value={contentPreferences.format}
                      onChange={(format) => setContentPreferences({ ...contentPreferences, format })}
                      options={["Short & Visual", "Long-form Educational", "Story-led", "Mixed"]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Posting Frequency</FieldLabel>
                    <SelectBox
                      value={contentPreferences.frequency}
                      onChange={(frequency) => setContentPreferences({ ...contentPreferences, frequency })}
                      options={["Daily", "3-4 times per week", "Weekly", "Campaign-based"]}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={9} title="References & Inspiration" subtitle="(Optional)" icon={Heart}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Brands / Creators you like</FieldLabel>
                  <TextInput
                    value={references.brands}
                    onChange={(event) => setReferences({ ...references, brands: event.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>What do you like about them?</FieldLabel>
                  <TextArea
                    value={references.notes}
                    maxLength={200}
                    onChange={(event) => setReferences({ ...references, notes: event.target.value })}
                  />
                  <p className="mt-1 text-right text-xs text-zinc-500">{references.notes.length}/200</p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 items-center gap-4 rounded-lg border border-white/10 bg-[#171723]/82 p-4 md:grid-cols-[180px_1fr_420px]">
            <button
              type="button"
              onClick={resetAll}
              className="h-11 rounded-md border border-white/10 bg-white/[0.035] px-4 text-sm font-medium text-zinc-200 hover:bg-white/[0.06]"
            >
              Reset All
            </button>
            <p className="text-center text-sm text-zinc-500">Drag pillars to reorder. Every field is saved to your profile.</p>
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

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#171723] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Brand Preview</h3>
              <button type="button" onClick={() => setShowPreview(false)} className="rounded-md p-2 text-zinc-400 hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-zinc-300">
              <p><span className="text-zinc-500">Name:</span> {fullName || "Not set"}</p>
              <p><span className="text-zinc-500">Roles:</span> {roles.join(", ") || "Not set"}</p>
              <p><span className="text-zinc-500">Niches:</span> {niches.join(", ") || "Not set"}</p>
              <p><span className="text-zinc-500">Audience:</span> {audiences.join(", ") || "Not set"}</p>
              <p><span className="text-zinc-500">Voice:</span> {brandTone} / {tone}</p>
              <p><span className="text-zinc-500">Pillars:</span> {pillars.map((pillar) => pillar.title).join(", ")}</p>
              <p><span className="text-zinc-500">Active platforms:</span> {platforms.filter((platform) => platform.enabled).map((platform) => platform.name).join(", ")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
