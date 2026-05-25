import { mockAlerts, type AlertSeverity } from "@/lib/mockData";
import { Lightbulb, AlertTriangle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON: Record<AlertSeverity, typeof Lightbulb> = { info: Lightbulb, warn: Flame, critical: AlertTriangle };
const TONE: Record<AlertSeverity, string> = {
  info: "text-[color:var(--syntax-fn)] border-[color:var(--syntax-fn)]/30",
  warn: "text-[color:var(--status-planning)] border-[color:var(--status-planning)]/30",
  critical: "text-[color:var(--status-failed)] border-[color:var(--status-failed)]/30",
};

export function IntelligenceFeed() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Intelligence feed</span>
        <span className="text-[10px] mono text-muted-foreground">{mockAlerts.length} insights</span>
      </div>
      <ul className="divide-y divide-border">
        {mockAlerts.map((a, i) => {
          const Icon = ICON[a.severity];
          return (
            <li key={i} className="p-3 hover:bg-accent/30">
              <div className="flex items-start gap-2">
                <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border bg-background/50", TONE[a.severity])}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{a.title}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{a.body}</p>
                  {a.action && (
                    <button className="mt-1.5 text-[10px] mono text-[color:var(--syntax-fn)] hover:underline">
                      {a.action} →
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
