import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, GitPullRequest, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { mockNotifications, type AppNotification } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const ICON: Record<AppNotification["kind"], typeof Bell> = {
  review: GitPullRequest, alert: AlertTriangle, merge: CheckCircle2, fail: XCircle,
};
const TONE: Record<AppNotification["kind"], string> = {
  review: "text-[color:var(--status-review)]",
  alert: "text-[color:var(--status-planning)]",
  merge: "text-[color:var(--status-merged)]",
  fail: "text-[color:var(--status-failed)]",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)}
        className="relative flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/40 hover:bg-accent text-muted-foreground hover:text-foreground transition"
        aria-label="Notifications">
        <Bell className="h-3.5 w-3.5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[color:var(--status-failed)] text-[9px] mono font-semibold text-white px-1">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Notifications</span>
            <button className="text-[10px] mono text-muted-foreground hover:text-foreground">mark all read</button>
          </div>
          <ul className="max-h-96 overflow-auto divide-y divide-border">
            {mockNotifications.map((n) => {
              const Icon = ICON[n.kind];
              const inner = (
                <div className={cn("flex items-start gap-2.5 p-3 hover:bg-accent/40", !n.read && "bg-accent/20")}>
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", TONE[n.kind])} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium truncate">{n.title}</span>
                      <span className="text-[10px] mono text-muted-foreground shrink-0">{n.ts}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.runId ? <Link to="/runs/$runId" params={{ runId: n.runId }} onClick={() => setOpen(false)}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
