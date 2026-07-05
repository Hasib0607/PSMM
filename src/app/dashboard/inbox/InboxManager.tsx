"use client";

import React, { useState, useActionState, startTransition } from "react";
import { createInboxItem, updateInboxItem, deleteInboxItem, archiveInboxItem, transformItemToDraft } from "./actions";
import { useRouter } from "next/navigation";

interface InboxItem {
  id: string;
  type: string;
  title: string | null;
  content: string;
  tags: any; // JSON
  status: string;
  draftId: string | null;
  createdAt: Date;
}

interface InboxManagerProps {
  items: InboxItem[];
}

export default function InboxManager({ items }: InboxManagerProps) {
  const router = useRouter();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InboxItem | null>(null);
  const [transformingItem, setTransformingItem] = useState<InboxItem | null>(null);

  // Transform platform selector state
  const [transformPlatforms, setTransformPlatforms] = useState<string[]>(["facebook", "linkedin"]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformError, setTransformError] = useState("");
  const [transformSuccess, setTransformSuccess] = useState("");

  // Filter items by status
  const activeItems = items.filter(item => item.status !== "archived");
  const archivedItems = items.filter(item => item.status === "archived");
  const [showArchived, setShowArchived] = useState(false);

  // Create action state
  const [createState, createFormAction, createPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await createInboxItem(prevState, formData);
      if (res.success) {
        setShowAddModal(false);
      }
      return res;
    },
    { error: null, success: false } as any
  );

  // Update action state
  const [updateState, updateFormAction, updatePending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!editingItem) return prevState;
      const res = await updateInboxItem(editingItem.id, prevState, formData);
      if (res.success) {
        setEditingItem(null);
      }
      return res;
    },
    { error: null, success: false } as any
  );

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      createFormAction(formData);
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      updateFormAction(formData);
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this inspiration item?")) {
      await deleteInboxItem(id);
    }
  };

  const handleToggleArchive = async (item: InboxItem) => {
    const nextStatus = item.status === "archived" ? "new" : "archived";
    await archiveInboxItem(item.id, nextStatus);
  };

  const toggleTransformPlatform = (platform: string) => {
    if (transformPlatforms.includes(platform)) {
      if (transformPlatforms.length === 1) return;
      setTransformPlatforms(transformPlatforms.filter(p => p !== platform));
    } else {
      setTransformPlatforms([...transformPlatforms, platform]);
    }
  };

  const handleTransform = async () => {
    if (!transformingItem) return;
    setIsTransforming(true);
    setTransformError("");
    setTransformSuccess("");

    try {
      const res = await transformItemToDraft(transformingItem.id, transformPlatforms);
      if (res.error) {
        setTransformError(res.error);
      } else {
        setTransformSuccess("Transformed successfully! Redirecting...");
        setTimeout(() => {
          setTransformingItem(null);
          router.push("/dashboard/drafts");
        }, 1500);
      }
    } catch (err) {
      setTransformError("Something went wrong");
    } finally {
      setIsTransforming(false);
    }
  };

  const renderItemCard = (item: InboxItem) => {
    const tagsArray = Array.isArray(item.tags) ? (item.tags as string[]) : [];
    return (
      <div key={item.id} className="glass-card rounded-xl p-5 flex flex-col justify-between border border-zinc-800 hover:border-zinc-700 transition-all duration-200">
        <div>
          <div className="flex justify-between items-start gap-2 mb-3">
            <span className="px-2 py-0.5 bg-purple-950/40 border border-purple-500/20 text-purple-300 rounded text-[10px] uppercase font-bold tracking-wider">
              {item.type}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              item.status === "used" ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-300" : "bg-blue-950/40 border border-blue-500/20 text-blue-300"
            }`}>
              {item.status}
            </span>
          </div>

          <h4 className="text-md font-bold text-white mb-2 leading-snug">{item.title || "Untitled Note"}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap mb-4 max-h-32 overflow-y-auto">
            {item.content}
          </p>
        </div>

        <div>
          {tagsArray.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tagsArray.map(tag => (
                <span key={tag} className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-900 pt-3 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(item)}
                className="text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleToggleArchive(item)}
                className="text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                {item.status === "archived" ? "Restore" : "Archive"}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>

            {item.status !== "used" ? (
              <button
                onClick={() => setTransformingItem(item)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded text-[10px] font-bold transition-all duration-150 active:scale-95"
              >
                Transform
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500 italic">Transformed</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Inspiration Inbox</h1>
          <p className="text-xs text-zinc-400 mt-1">Capture ideas, snippets, and links to adapt later</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            + Add Inspiration
          </button>
        </div>
      </div>

      {/* Grid of active items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeItems.length > 0 ? (
          activeItems.map(item => renderItemCard(item))
        ) : (
          <div className="col-span-full py-12 flex flex-col justify-center items-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            <span className="text-sm font-semibold">Your inbox is empty</span>
            <span className="text-xs mt-1 text-zinc-600">Save a quick note or link to get started!</span>
          </div>
        )}
      </div>

      {/* Grid of archived items */}
      {showArchived && (
        <div className="space-y-4 pt-6 border-t border-zinc-900">
          <h3 className="text-lg font-bold text-zinc-300">Archived Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {archivedItems.length > 0 ? (
              archivedItems.map(item => renderItemCard(item))
            ) : (
              <p className="text-xs text-zinc-500 col-span-full">No archived items found</p>
            )}
          </div>
        </div>
      )}

      {/* CREATE INSPIRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 glow-purple border border-zinc-800 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-6">Add Inspiration Item</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createState?.error && (
                <div className="bg-red-950/50 border border-red-500/30 text-red-200 px-3 py-2 rounded text-xs text-center">
                  {createState.error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                  <select
                    name="type"
                    defaultValue="note"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
                  >
                    <option value="note">Note</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="productivity, tech"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Appium setup tips"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Content / Body</label>
                <textarea
                  name="content"
                  required
                  rows={5}
                  placeholder="Paste your link details, notes, or ideas here..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={createPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-2.5 rounded-lg text-xs transition-colors"
              >
                {createPending ? "Adding..." : "Add Inspiration"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INSPIRATION MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 glow-purple border border-zinc-800 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-6">Edit Inspiration</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {updateState?.error && (
                <div className="bg-red-950/50 border border-red-500/30 text-red-200 px-3 py-2 rounded text-xs text-center">
                  {updateState.error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                  <select
                    name="type"
                    defaultValue={editingItem.type}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
                  >
                    <option value="note">Note</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={Array.isArray(editingItem.tags) ? (editingItem.tags as string[]).join(", ") : ""}
                    placeholder="productivity, tech"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingItem.title || ""}
                  placeholder="e.g. Appium setup tips"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Content / Body</label>
                <textarea
                  name="content"
                  required
                  rows={5}
                  defaultValue={editingItem.content}
                  placeholder="Paste your link details, notes, or ideas here..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={updatePending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-2.5 rounded-lg text-xs transition-colors"
              >
                {updatePending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFORM PLATFORMS DIALOG */}
      {transformingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 glow-blue border border-zinc-800 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setTransformingItem(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-md font-bold text-white mb-2">Transform to Draft</h3>
            <p className="text-xs text-zinc-400 mb-6">Select channels to adapt this inspiration using OpenAI:</p>

            {transformError && (
              <div className="bg-red-950/50 border border-red-500/30 text-red-200 px-3 py-2 rounded text-xs text-center mb-4">
                {transformError}
              </div>
            )}

            {transformSuccess && (
              <div className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 px-3 py-2 rounded text-xs text-center mb-4">
                {transformSuccess}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-2">
                {["facebook", "instagram", "linkedin", "youtube", "tiktok"].map(p => {
                  const active = transformPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => toggleTransformPlatform(p)}
                      className={`px-3 py-2 rounded-lg border text-xs capitalize transition-all font-semibold ${
                        active
                          ? "bg-purple-900/30 border-purple-500/50 text-purple-200"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-750"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleTransform}
              disabled={isTransforming}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              {isTransforming ? "Running OpenAI Brain..." : "Trigger AI Adaptation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
