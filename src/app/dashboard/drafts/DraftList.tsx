"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, ChevronDown, ChevronUp, Share2, Eye, Clock, ExternalLink } from "lucide-react";
import { deleteDraft, publishDraft, approveDraft } from "./actions";

interface DraftListProps {
  initialDrafts: any[];
}

export function DraftList({ initialDrafts }: DraftListProps) {
  const [drafts, setDrafts] = useState<any[]>(initialDrafts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<{ [draftId: string]: string }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [scheduleDates, setScheduleDates] = useState<{ [draftId: string]: string }>({});

  const handleApprove = async (draftId: string) => {
    setApprovingId(draftId);
    try {
      const res = await approveDraft(draftId);
      if (res.success) {
        alert("Draft approved! You can now publish or schedule it.");
        window.location.reload();
      } else {
        alert(res.error || "Failed to approve draft.");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving draft.");
    } finally {
      setApprovingId(null);
    }
  };

  const handlePublish = async (draftId: string, platform: string, scheduledTime?: string) => {
    setPublishingId(draftId);
    try {
      const res = await publishDraft(draftId, platform, scheduledTime);
      if (res.success) {
        alert(scheduledTime ? "Post scheduled successfully!" : "Post sent to background publisher! Status will update shortly.");
        window.location.reload();
      } else {
        alert(res.error || "Failed to initiate publishing.");
      }
    } catch (err) {
      console.error(err);
      alert("Error publishing post.");
    } finally {
      setPublishingId(null);
    }
  };

  const toggleExpand = (id: string, platformVersions: any) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Default to first platform in versions
      const platforms = Object.keys(platformVersions || {});
      if (platforms.length > 0 && !activePlatformTab[id]) {
        setActivePlatformTab((prev) => ({ ...prev, [id]: platforms[0] }));
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    setDeletingId(id);
    try {
      const res = await deleteDraft(id);
      if (res.success) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        if (expandedId === id) setExpandedId(null);
      } else {
        alert(res.error || "Failed to delete draft");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const getPlatformLabel = (key: string) => {
    switch (key) {
      case "facebook": return "Facebook";
      case "instagram": return "Instagram";
      case "linkedin": return "LinkedIn";
      case "youtube": return "YouTube";
      case "tiktok": return "TikTok";
      default: return key;
    }
  };

  if (drafts.length === 0) {
    return (
      <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
        <CardContent className="py-16 text-center text-sm text-zinc-500 flex flex-col items-center justify-center gap-4">
          <Share2 className="h-10 w-10 text-zinc-700" />
          <div className="space-y-1">
            <p className="font-semibold text-zinc-400">No drafts found</p>
            <p className="text-xs text-zinc-500">Go to the Content Studio page to generate multi-platform drafts from a single idea.</p>
          </div>
          <Button variant="outline" className="mt-2 border-zinc-800 text-zinc-300 hover:bg-zinc-900 cursor-pointer" onClick={() => window.location.href = "/dashboard/content"}>
            Create Content
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => {
        const isExpanded = expandedId === draft.id;
        const platforms = Object.keys(draft.platformVersions || {});
        const activeTab = activePlatformTab[draft.id] || (platforms.length > 0 ? platforms[0] : "");
        const activeContent = draft.platformVersions?.[activeTab];

        return (
          <Card
            key={draft.id}
            className={`bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm transition-all duration-200 ${
              isExpanded ? "ring-1 ring-purple-500/20" : ""
            }`}
          >
            {/* Header summary row */}
            <div
              className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/10 transition-colors"
              onClick={() => toggleExpand(draft.id, draft.platformVersions)}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="font-semibold text-zinc-100 text-sm truncate pr-4">
                  {draft.sourceIdea}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1.5">
                    {platforms.map((platform) => (
                      <Badge
                        key={platform}
                        className="bg-purple-950/20 text-purple-400 border border-purple-500/10 text-[9px] px-1.5 py-0.5"
                      >
                        {getPlatformLabel(platform)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(draft.id);
                  }}
                  disabled={deletingId === draft.id}
                  className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="text-zinc-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </div>

            {/* Expanded Content Preview Tabs */}
            {isExpanded && (
              <div className="border-t border-zinc-900/50 p-5 bg-zinc-950/20 space-y-4">
                {/* Platform select mini-tabs */}
                <div className="flex border-b border-zinc-900 gap-1">
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setActivePlatformTab((prev) => ({ ...prev, [draft.id]: platform }))}
                      className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-[2px] transition-all cursor-pointer ${
                        activeTab === platform
                          ? "border-purple-500 text-purple-400"
                          : "border-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {getPlatformLabel(platform)}
                    </button>
                  ))}
                </div>

                {/* Platform Specific content version details */}
                {activeContent ? (
                  <div className="space-y-4 text-xs leading-relaxed text-zinc-300 bg-zinc-950/60 p-4 rounded-lg border border-zinc-900">
                    {/* Render fields depending on platform */}
                    {activeContent.title && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Title</p>
                        <p className="text-zinc-100 font-semibold">{activeContent.title}</p>
                      </div>
                    )}

                    {activeContent.hook && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Hook</p>
                        <p className="text-zinc-200 italic">&ldquo;{activeContent.hook}&rdquo;</p>
                      </div>
                    )}

                    {activeContent.caption && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Caption / Main Content</p>
                        <p className="whitespace-pre-line text-zinc-300">{activeContent.caption}</p>
                      </div>
                    )}

                    {activeContent.cta && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Call to Action (CTA)</p>
                        <p className="text-purple-300">{activeContent.cta}</p>
                      </div>
                    )}

                    {activeContent.videoConcept && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Video Concept Script</p>
                        <p className="bg-zinc-900/50 p-2 rounded text-zinc-400 whitespace-pre-line border border-zinc-800/20">{activeContent.videoConcept}</p>
                      </div>
                    )}

                    {activeContent.imagePrompt && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">AI Image Generation Prompt</p>
                        <p className="bg-zinc-900/50 p-2 rounded text-zinc-400 italic border border-zinc-800/20">{activeContent.imagePrompt}</p>
                      </div>
                    )}

                    {activeContent.description && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Description</p>
                        <p className="whitespace-pre-line text-zinc-300">{activeContent.description}</p>
                      </div>
                    )}

                    {activeContent.hashtags && activeContent.hashtags.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Hashtags</p>
                        <div className="flex flex-wrap gap-1">
                          {activeContent.hashtags.map((tag: string) => (
                            <span key={tag} className="text-purple-400/80">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeContent.tags && activeContent.tags.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {activeContent.tags.map((tag: string) => (
                            <span key={tag} className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Publishing action buttons */}
                    <div className="pt-4 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Status:</span>
                        <Badge className={`${
                          draft.status === "published" ? "bg-green-950/40 text-green-400 border-green-500/20" :
                          draft.status === "scheduled" ? "bg-blue-950/40 text-blue-400 border-blue-500/20" :
                          draft.status === "failed" ? "bg-red-950/40 text-red-400 border-red-500/20" :
                          "bg-zinc-900 text-zinc-400 border-zinc-800"
                        } text-[9px] capitalize`}>
                          {draft.status}
                        </Badge>
                        {draft.scheduledAt && (
                          <span className="text-[10px] text-zinc-500">
                            Scheduled for {new Date(draft.scheduledAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {activeTab === "facebook" && draft.status !== "published" && (
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                          {(draft.status === "draft" || draft.status === "failed" || draft.status === "needs_review") && (
                            <Button
                              onClick={() => handleApprove(draft.id)}
                              disabled={approvingId === draft.id}
                              className="bg-green-950/40 hover:bg-green-900/40 border border-green-500/20 text-green-300 text-xs font-semibold px-3 py-1 cursor-pointer"
                            >
                              {approvingId === draft.id ? "Approving..." : "Approve"}
                            </Button>
                          )}
                          {(draft.status === "approved" || draft.status === "scheduled") && (
                            <>
                              <input
                                type="datetime-local"
                                value={scheduleDates[draft.id] || ""}
                                onChange={(e) => setScheduleDates(prev => ({ ...prev, [draft.id]: e.target.value }))}
                                className="px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs text-white outline-none focus:border-purple-500 transition-colors"
                              />
                              <Button
                                onClick={() => handlePublish(draft.id, activeTab, scheduleDates[draft.id])}
                                disabled={publishingId === draft.id}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1 cursor-pointer"
                              >
                                {publishingId === draft.id ? "Working..." : scheduleDates[draft.id] ? "Schedule" : "Publish Now"}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs py-4 text-center">No content available for this platform.</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
