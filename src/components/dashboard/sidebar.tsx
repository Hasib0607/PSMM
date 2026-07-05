"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-900 bg-zinc-950/60 backdrop-blur-md">
      <div className="border-b border-zinc-900 px-6 py-5">
        <Link href="/dashboard" className="block">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            PSMM
          </p>
          <h1 className="text-lg font-bold text-gradient">
            Social Manager
          </h1>
          <p className="mt-1 text-xs text-zinc-500">Personal accounts only</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 border border-transparent",
                isActive
                  ? "bg-purple-950/40 border-purple-500/20 text-purple-200"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-purple-400/80" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-900">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 border border-transparent transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
