"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Paintbrush,
  Eye,
  Table2,
  CheckSquare,
  CalendarDays,
  Library,
  Download,
  Moon,
  Sun,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const THEME_EVENT = "pg-theme-change";

function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/setup", label: "Setup", icon: CalendarRange },
  { href: "/editor", label: "Editor", icon: Paintbrush },
  { href: "/preview", label: "Preview", icon: Eye },
  { href: "/planner", label: "Planner", icon: Table2 },
  { href: "/today", label: "Today", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/library", label: "Library", icon: Library },
  { href: "/export", label: "Export", icon: Download },
];

export function AppSidebar() {
  const pathname = usePathname();
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("pg:theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground sticky top-0">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="grid size-8 place-items-center rounded-md bg-[#40c463] text-white font-bold text-sm">
          CA
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">ContribArt</div>
          <div className="text-xs text-muted-foreground">
            Turn your graph into pixel art
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === href
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5"
          onClick={toggleTheme}
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? "Light mode" : "Dark mode"}
        </Button>
      </div>
    </aside>
  );
}
