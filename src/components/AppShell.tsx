import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Plus, History, Settings, Bot, GitBranch, BarChart3, Network, Command, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/new", label: "New Task", icon: Plus, exact: false },
  { to: "/history", label: "History", icon: History, exact: false },
  { to: "/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/agents", label: "Architecture", icon: Network, exact: false },
  { to: "/prompts", label: "Prompt Studio", icon: Sparkles, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-56 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-14 items-center justify-between gap-2 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">Codex Ops</div>
              <div className="text-[10px] text-muted-foreground mono">agent-v2.3.1</div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>Press</span>
            <kbd className="mono px-1 border border-border rounded text-[10px]">⌘K</kbd>
            <span>anywhere</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1.5"><GitBranch className="h-3 w-3" />main · clean</div>
            <div className="mono">7 runs today · $14.82</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden flex h-12 items-center gap-2 border-b border-border px-3">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Codex Ops</span>
          <div className="ml-auto"><NotificationBell /></div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <CommandPalette />
    </div>
  );
}
