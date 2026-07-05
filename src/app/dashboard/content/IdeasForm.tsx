"use client";

import React, { useState, useActionState, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { generateDraft } from "./actions";
import { getLocalDayBounds, getTodayString, getTomorrowString } from "@/lib/dates";
import { Mic, Square, Link2, Loader2, Sparkles, FileText, Check } from "lucide-react";

interface IdeasFormProps {
  initialGoals: {
    today: number;
    tomorrow: number;
  };
  hasBrandProfile: boolean;
  customTemplates?: any[];
  defaultIdea?: string;
}

export default function IdeasForm({ initialGoals, hasBrandProfile, customTemplates = [], defaultIdea = "" }: IdeasFormProps) {
  const router = useRouter();

  const SYSTEM_TEMPLATES = [
    { id: "none", name: "None (AI Default Tone)", structure: "" },
    { id: "story", name: "Story-Driven Hook & Narrative", structure: "Begin with a personal story/conflict. Keep paragraphs short. Emphasize lessons learned. Conclude with a thought-provoking question." },
    { id: "value", name: "Value Drop / Bulleted Tips", structure: "Start with a high-impact promise. Present 3-5 bullet points with emojis. Keep spacing generous. End with a save/share call-to-action." },
    { id: "contrarian", name: "Contrarian / Bold Take", structure: "Start with a controversial statement refuting common wisdom. Explain why the popular method fails and your alternative succeeds. Ask audience for their disagreements." },
    { id: "casestudy", name: "Case Study / Framework", structure: "Start with a specific result (e.g. 'How we achieved X'). Break down the exact timeline and step-by-step roadmap. Call to action should be to send a DM or click a link." },
    { id: "bts", name: "Behind the Scenes / Raw Diary", structure: "Share a raw, unpolished, 'work in progress' update. Focus on the current struggle, a breakthrough, or a sneak peek. Prompt the audience to share their current progress." }
  ];

  const allTemplates = [...SYSTEM_TEMPLATES, ...customTemplates];

  // Posting goals state
  const [goals, setGoals] = useState({
    today: initialGoals.today,
    tomorrow: initialGoals.tomorrow,
  });
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsMessage, setGoalsMessage] = useState("");

  // Platform selection state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook", "linkedin"]);

  // Active tab in output preview
  const [activePreviewTab, setActivePreviewTab] = useState<string>("");

  // Controlled core idea text state
  const [ideaText, setIdeaText] = useState(defaultIdea);

  // Voice Note Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // URL link import states
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [urlError, setUrlError] = useState("");

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setIsRecording(false);
        setTranscribing(true);

        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");

        try {
          const res = await fetch("/api/voice-import", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.text) {
            setIdeaText((prev) => (prev ? prev + "\n" + data.text : data.text));
          } else {
            alert(data.error || "Failed to transcribe audio.");
          }
        } catch (err) {
          console.error(err);
          alert("Error transcribing audio note.");
        } finally {
          setTranscribing(false);
          // Stop stream tracks
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to get audio stream:", err);
      alert("Please allow microphone access to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl) return;
    setSummarizing(true);
    setUrlError("");
    try {
      const res = await fetch("/api/url-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setIdeaText((prev) => (prev ? prev + "\n" + data.summary : data.summary));
        setImportUrl("");
        setShowUrlInput(false);
      } else {
        setUrlError(data.error || "Failed to import URL.");
      }
    } catch (err) {
      console.error(err);
      setUrlError("Failed to fetch and summarize content.");
    } finally {
      setSummarizing(false);
    }
  };

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Append selected platforms
      formData.delete("platforms");
      selectedPlatforms.forEach(p => formData.append("platforms", p));

      const result = await generateDraft(prevState, formData);
      if (result?.redirectOnboarding) {
        router.push("/onboarding");
        return result;
      }
      if (result?.success && result?.content) {
        // Set first platform as active preview tab
        const firstPlatform = Object.keys(result.content)[0];
        setActivePreviewTab(firstPlatform || "");
      }
      return result;
    },
    { error: null, success: false, content: null, draftId: null, redirectOnboarding: false } as any
  );

  const handleGoalChange = (day: "today" | "tomorrow", val: number) => {
    setGoals({ ...goals, [day]: val });
  };

  const saveGoals = async () => {
    setSavingGoals(true);
    setGoalsMessage("");
    try {
      const todayDate = getTodayString();
      const tomorrowDate = getTomorrowString();

      // Save today's goal
      const resToday = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayDate, targetCount: goals.today }),
      });

      // Save tomorrow's goal
      const resTomorrow = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: tomorrowDate, targetCount: goals.tomorrow }),
      });

      if (!resToday.ok || !resTomorrow.ok) {
        throw new Error("Failed to save goals: non-2xx status");
      }

      setGoalsMessage("Goals saved successfully!");
      setTimeout(() => setGoalsMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setGoalsMessage("Failed to save goals");
    } finally {
      setSavingGoals(false);
    }
  };

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length === 1) return; // Must select at least one
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  if (!hasBrandProfile) {
    return (
      <div className="w-full max-w-2xl glass-card rounded-2xl p-8 text-center glow-purple">
        <h2 className="text-2xl font-bold text-gradient mb-4">Onboarding Required</h2>
        <p className="text-zinc-400 text-sm mb-6">
          To start generating adapted content, you need to set up your personal brand profile tone and niche parameters.
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors"
        >
          Go to Onboarding Form
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Top control bar: Posting Goals */}
      <div className="glass-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Posting Targets</h2>
          <p className="text-xs text-zinc-400">Set daily publish targets</p>
        </div>
        <div className="flex gap-4 col-span-2 sm:items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="flex gap-6 w-full">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Today</label>
              <input
                type="number"
                min="0"
                max="20"
                value={goals.today}
                onChange={e => handleGoalChange("today", parseInt(e.target.value || "0", 10))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tomorrow</label>
              <input
                type="number"
                min="0"
                max="20"
                value={goals.tomorrow}
                onChange={e => handleGoalChange("tomorrow", parseInt(e.target.value || "0", 10))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 w-full sm:w-auto">
            <button
              onClick={saveGoals}
              disabled={savingGoals}
              className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {savingGoals ? "Saving..." : "Save Goals"}
            </button>
            {goalsMessage && (
              <span className="text-[10px] text-purple-400 mt-1">{goalsMessage}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Generator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Form inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 glow-purple">
            <h3 className="text-md font-bold text-white mb-4">Adapt One Idea</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {state.error && (
                <div className="bg-red-950/50 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
                  {state.error}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-zinc-400">Core Idea</label>
                  <div className="flex gap-2">
                    {/* Voice Note Button */}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={transcribing}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border cursor-pointer ${
                        isRecording
                          ? "bg-red-950/40 border-red-500/30 text-red-400 animate-pulse"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-3 w-3 fill-red-400" />
                          <span>Stop ({formatTime(recordingSeconds)})</span>
                        </>
                      ) : transcribing ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                          <span>Transcribing...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3" />
                          <span>Record Voice</span>
                        </>
                      )}
                    </button>

                    {/* URL Link Button */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border cursor-pointer ${
                        showUrlInput
                          ? "bg-purple-950/40 border-purple-500/30 text-purple-400"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <Link2 className="h-3 w-3" />
                      <span>Import Link</span>
                    </button>
                  </div>
                </div>

                {/* URL Input Box */}
                {showUrlInput && (
                  <div className="mb-3 p-3 bg-zinc-900/40 border border-zinc-900 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Paste article or link URL here..."
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleUrlImport}
                        disabled={summarizing || !importUrl}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {summarizing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Import"}
                      </button>
                    </div>
                    {urlError && <p className="text-[10px] text-red-400">{urlError}</p>}
                  </div>
                )}

                <textarea
                  name="idea"
                  required
                  rows={4}
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="e.g. 5 tips to boost productivity while working from home as a software engineer"
                  className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Caption Template Style</label>
                <select
                  name="template"
                  className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-white text-sm focus:border-purple-500 outline-none transition-colors"
                >
                  {allTemplates.map(t => (
                    <option key={t.id} value={t.id} className="bg-zinc-950 text-white text-xs">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-3">Target Channels</label>
                <div className="grid grid-cols-2 gap-3">
                  {["facebook", "instagram", "linkedin", "youtube", "tiktok"].map(p => {
                    const selected = selectedPlatforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-semibold capitalize border transition-all duration-200 ${
                          selected
                            ? "bg-purple-900/30 border-purple-500/50 text-purple-200"
                            : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPending ? "Adapting Idea..." : "Adapt & Generate"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Adapt Results Panel */}
        <div className="lg:col-span-3">
          {state.success && state.content ? (
            <div className="glass-card rounded-2xl p-6 glow-blue h-full flex flex-col">
              <h3 className="text-md font-bold text-white mb-4">Adapted Versions</h3>
              
              {/* Platform selector tabs */}
              <div className="flex border-b border-zinc-800 mb-6 gap-2 overflow-x-auto pb-1">
                {Object.keys(state.content).map(platform => (
                  <button
                    key={platform}
                    onClick={() => setActivePreviewTab(platform)}
                    className={`px-4 py-2 text-xs font-bold capitalize transition-all border-b-2 -mb-[5px] ${
                      activePreviewTab === platform
                        ? "border-purple-500 text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>

              {/* Tab Content Display */}
              <div className="flex-1 space-y-4">
                {activePreviewTab === "facebook" && state.content.facebook && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Facebook Hook</span>
                      <p className="text-sm font-semibold text-white mt-1 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                        {state.content.facebook.hook}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Caption Body</span>
                      <p className="text-sm text-zinc-300 mt-1 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-lg border border-zinc-900">
                        {state.content.facebook.caption}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Hashtags</span>
                      <p className="text-xs text-blue-400 mt-1 font-semibold">
                        {state.content.facebook.hashtags.join(" ")}
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === "linkedin" && state.content.linkedin && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">LinkedIn Hook</span>
                      <p className="text-sm font-semibold text-white mt-1 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                        {state.content.linkedin.hook}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">LinkedIn Post Body</span>
                      <p className="text-sm text-zinc-300 mt-1 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-lg border border-zinc-900">
                        {state.content.linkedin.caption}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Call To Action (CTA)</span>
                      <p className="text-sm text-purple-300 mt-1 font-medium bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/10">
                        {state.content.linkedin.cta}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Hashtags</span>
                      <p className="text-xs text-blue-400 mt-1 font-semibold">
                        {state.content.linkedin.hashtags.join(" ")}
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === "instagram" && state.content.instagram && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-pink-400 font-bold">Instagram Caption</span>
                      <p className="text-sm text-zinc-300 mt-1 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-lg border border-zinc-900">
                        {state.content.instagram.caption}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-pink-400 font-bold">Hashtags</span>
                      <p className="text-xs text-blue-400 mt-1 font-semibold">
                        {state.content.instagram.hashtags.join(" ")}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-pink-400 font-bold">Midjourney / AI Image Prompt Idea</span>
                      <p className="text-xs text-zinc-400 mt-1 italic bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                        {state.content.instagram.imagePrompt}
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === "youtube" && state.content.youtube && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Video Title</span>
                      <p className="text-sm font-semibold text-white mt-1 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                        {state.content.youtube.title}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Description Details</span>
                      <p className="text-sm text-zinc-300 mt-1 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-lg border border-zinc-900">
                        {state.content.youtube.description}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Keywords / Tags</span>
                      <p className="text-xs text-zinc-400 mt-1">
                        {state.content.youtube.tags.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === "tiktok" && state.content.tiktok && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">TikTok Hook</span>
                      <p className="text-sm font-semibold text-white mt-1 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                        {state.content.tiktok.hook}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">TikTok Caption</span>
                      <p className="text-sm text-zinc-300 mt-1 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-lg border border-zinc-900">
                        {state.content.tiktok.caption}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">Hashtags</span>
                      <p className="text-xs text-blue-400 mt-1 font-semibold">
                        {state.content.tiktok.hashtags.join(" ")}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">Video Concept / Script brief</span>
                      <p className="text-xs text-zinc-400 mt-1 italic bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                        {state.content.tiktok.videoConcept}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 border-t border-zinc-800 pt-4 flex justify-between items-center text-xs text-zinc-500">
                <span>Draft ID: {state.draftId}</span>
                <span className="text-purple-400 font-semibold">Saved as Draft in Database</span>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 h-full flex flex-col justify-center items-center text-center text-zinc-500 border border-dashed border-zinc-800">
              <span className="text-sm">Adapt an idea to preview generated channels</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
