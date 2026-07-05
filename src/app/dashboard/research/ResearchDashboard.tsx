"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addRssFeed, deleteRssFeed, addCompetitor, deleteCompetitor, fetchTrendSuggestions, scanCompetitorAccounts } from "./actions";
import { Rss, Users, Sparkles, Trash2, Plus, Loader2, Globe, Shield, FileText } from "lucide-react";

interface ResearchDashboardProps {
  initialFeeds: any[];
  initialCompetitors: any[];
}

export default function ResearchDashboard({ initialFeeds, initialCompetitors }: ResearchDashboardProps) {
  const [feeds, setFeeds] = useState(initialFeeds);
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const [scanningCompetitors, setScanningCompetitors] = useState(false);

  // RSS Form States
  const [feedUrl, setFeedUrl] = useState("");
  const [feedNiche, setFeedNiche] = useState("");
  const [addingFeed, setAddingFeed] = useState(false);

  // Competitor Form States
  const [compUrl, setCompUrl] = useState("");
  const [compPlatform, setCompPlatform] = useState("facebook");
  const [compNotes, setCompNotes] = useState("");
  const [addingComp, setAddingComp] = useState(false);

  // Handle RSS Submit
  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl) return;
    setAddingFeed(true);
    try {
      const res = await addRssFeed(feedUrl, feedNiche);
      if (res.success) {
        setFeedUrl("");
        setFeedNiche("");
        alert("RSS Feed added successfully!");
        window.location.reload();
      } else {
        alert(res.error || "Failed to add RSS feed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding feed.");
    } finally {
      setAddingFeed(false);
    }
  };

  // Handle RSS Delete
  const handleDeleteFeed = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feed?")) return;
    try {
      const res = await deleteRssFeed(id);
      if (res.success) {
        setFeeds(prev => prev.filter(f => f.id !== id));
      } else {
        alert(res.error || "Failed to delete RSS feed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting feed.");
    }
  };

  // Handle Competitor Submit
  const handleAddComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compUrl) return;
    setAddingComp(true);
    try {
      const res = await addCompetitor(compUrl, compPlatform, compNotes);
      if (res.success) {
        setCompUrl("");
        setCompNotes("");
        alert("Competitor account added successfully!");
        window.location.reload();
      } else {
        alert(res.error || "Failed to add competitor account.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding competitor.");
    } finally {
      setAddingComp(false);
    }
  };

  // Handle Competitor Delete
  const handleDeleteComp = async (id: string) => {
    if (!confirm("Are you sure you want to remove this competitor?")) return;
    try {
      const res = await deleteCompetitor(id);
      if (res.success) {
        setCompetitors(prev => prev.filter(c => c.id !== id));
      } else {
        alert(res.error || "Failed to delete competitor.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting competitor.");
    }
  };

  // Handle Scrape & Suggest
  const handleFetchSuggestions = async () => {
    setFetchingTrends(true);
    try {
      const res = await fetchTrendSuggestions();
      if (res.success) {
        alert(`Successfully scanned RSS logs! ${res.count} trending content suggestions have been pushed to your Inspiration Inbox!`);
      } else {
        alert(res.error || "Failed to pull trend recommendations.");
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing trends.");
    } finally {
      setFetchingTrends(false);
    }
  };

  const handleScanCompetitors = async () => {
    setScanningCompetitors(true);
    try {
      const res = await scanCompetitorAccounts();
      if (res.success) {
        alert(`${res.count} competitor insights added to your Inspiration Inbox!`);
      } else {
        alert(res.error || "Failed to scan competitors.");
      }
    } catch (err) {
      console.error(err);
      alert("Error scanning competitors.");
    } finally {
      setScanningCompetitors(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto">
      {/* Top Banner Control */}
      <Card className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 text-white p-6 rounded-xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <span className="p-3 bg-purple-500/20 text-purple-400 rounded-lg text-xl shrink-0 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-bold text-base text-zinc-100">AI Trends Discovery Engine</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Scrape and analyze all your registered RSS news feeds at once. OpenAI will identify current hot topics and suggest new inspiration topics.
            </p>
          </div>
        </div>
        <Button
          onClick={handleFetchSuggestions}
          disabled={fetchingTrends || feeds.length === 0}
          className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-6 py-3 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {fetchingTrends ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Scanning Feeds...</span>
            </>
          ) : (
            <>
              <Rss className="h-4 w-4" />
              <span>Scan Feeds & Suggest Ideas</span>
            </>
          )}
        </Button>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: RSS Feeds */}
        <div className="space-y-6">
          <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-900/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-200 font-bold">
                <Rss className="h-4 w-4 text-purple-400" />
                <span>Niche RSS Feeds ({feeds.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Add Feed Form */}
              <form onSubmit={handleAddFeed} className="flex gap-2">
                <input
                  type="url"
                  placeholder="Feed URL (Atom or RSS XML)..."
                  value={feedUrl}
                  onChange={e => setFeedUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-zinc-900/40 border border-zinc-800 rounded text-xs text-white outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <input
                  type="text"
                  placeholder="Niche (e.g. Tech)..."
                  value={feedNiche}
                  onChange={e => setFeedNiche(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-zinc-900/40 border border-zinc-800 rounded text-xs text-white outline-none focus:border-purple-500 transition-colors"
                />
                <Button
                  type="submit"
                  disabled={addingFeed}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 cursor-pointer"
                >
                  {addingFeed ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </form>

              {/* Feeds List */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {feeds.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 py-4 text-center">No RSS feeds added yet.</p>
                ) : (
                  feeds.map(feed => (
                    <div key={feed.id} className="flex items-center justify-between p-3 bg-zinc-900/20 border border-zinc-900 rounded-lg text-xs">
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <p className="text-zinc-200 truncate font-semibold">{feed.feedUrl}</p>
                        </div>
                        <div className="flex gap-2 items-center text-[10px] text-zinc-500">
                          <span>Niche: <span className="text-purple-400 font-medium">{feed.niche}</span></span>
                          {feed.lastFetchedAt && (
                            <span>• Last Fetch: {new Date(feed.lastFetchedAt).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Competitor Watch */}
        <div className="space-y-6">
          <Card className="bg-zinc-950/40 border-zinc-900 text-white backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-900/50 pb-3">
              <CardTitle className="flex items-center justify-between text-sm text-zinc-200 font-bold">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>Competitor Watch ({competitors.length})</span>
                </div>
                <Button
                  onClick={handleScanCompetitors}
                  disabled={scanningCompetitors || competitors.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-3 py-1 h-7 cursor-pointer"
                >
                  {scanningCompetitors ? "Scanning..." : "Scan All"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Add Competitor Form */}
              <form onSubmit={handleAddComp} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Profile URL (e.g. fb.com/name)..."
                    value={compUrl}
                    onChange={e => setCompUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-zinc-900/40 border border-zinc-800 rounded text-xs text-white outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                  <select
                    value={compPlatform}
                    onChange={e => setCompPlatform(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-white outline-none"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Notes (e.g. industry rival)..."
                    value={compNotes}
                    onChange={e => setCompNotes(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-zinc-900/40 border border-zinc-800 rounded text-xs text-white outline-none focus:border-purple-500 transition-colors"
                  />
                  <Button
                    type="submit"
                    disabled={addingComp}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-1.5 cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    {addingComp ? <Loader2 className="h-3 w-3 animate-spin" /> : "Track"}
                  </Button>
                </div>
              </form>

              {/* Competitors List */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {competitors.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 py-4 text-center">No competitor accounts added yet.</p>
                ) : (
                  competitors.map(comp => (
                    <div key={comp.id} className="flex items-center justify-between p-3 bg-zinc-900/20 border border-zinc-900 rounded-lg text-xs">
                      <div className="space-y-1 min-w-0 pr-4">
                        <p className="text-zinc-200 truncate font-semibold">{comp.accountUrl}</p>
                        <div className="flex gap-2 items-center text-[10px] text-zinc-500">
                          <Badge className="bg-purple-950/20 text-purple-400 border border-purple-500/10 text-[8px] px-1 py-0 capitalize">
                            {comp.platform}
                          </Badge>
                          {comp.notes && (
                            <span className="truncate italic text-zinc-400">Notes: {comp.notes}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComp(comp.id)}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
