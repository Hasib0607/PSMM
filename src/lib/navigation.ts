import {
  CalendarDays,
  FileText,
  Inbox,
  LayoutDashboard,
  PenSquare,
  Settings,
  Share2,
  Rss,
  Sparkles,
} from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview, posting goals, streak",
  },
  {
    title: "Content Studio",
    href: "/dashboard/content",
    icon: PenSquare,
    description: "One idea → multi-platform adapt",
  },
  {
    title: "Weekly Batch Planner",
    href: "/dashboard/batch",
    icon: Sparkles,
    description: "Plan and adapt 7 days of posts",
  },
  {
    title: "Research & Trends",
    href: "/dashboard/research",
    icon: Rss,
    description: "Scrape RSS feeds and competitors",
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    description: "Schedule and special days",
  },
  {
    title: "Inspiration Inbox",
    href: "/dashboard/inbox",
    icon: Inbox,
    description: "Saved links, notes, voice ideas",
  },
  {
    title: "Platforms",
    href: "/dashboard/platforms",
    icon: Share2,
    description: "Connect Facebook, Instagram, etc.",
  },
  {
    title: "Drafts",
    href: "/dashboard/drafts",
    icon: FileText,
    description: "All content drafts",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Brand profile and preferences",
  },
] as const;
