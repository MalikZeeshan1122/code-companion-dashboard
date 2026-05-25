import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { mockEventStream, EVENT_TONE, type EventKind } from "@/lib/mockData";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS: EventKind[] = ["RUN_STARTED", "PATCH_WRITTEN", "VALIDATION_FAIL", "VALIDATION_PASS", "CONTEXT_HIT", "CRITIC_REVISE", "RUN_MERGED", "RUN_FAILED", "TOKEN_SPIKE"];

export function EventStream() {
  const [filter, setFilter] = useState<EventKind | "all">("all");
  const events = filter === "all" ? mockEventStream : mockEventStream.filter((e) => e.kind === filter);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      <div className="border-b border-border px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Global event stream</span>
          <span className="inline-flex items-center gap-1 text-[10px] mono text-[color:var(--status-merged)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-merged)] animate-pulse" />
            live
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] mono">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as EventKind | "all")}
            className="bg-transparent border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">all events</option>
            {KINDS.map((k) => <option key={k} value={k}>{k.toLowerCase()}</option>)}
          </select>
        </div>
      </div>
      <ul className="max-h-80 overflow-auto divide-y divide-border/60">
        {events.map((e, i) => (
          <li key={i} className="px-3 py-1.5 text-xs grid grid-cols-[88px_64px_110px_1fr_auto] items-center gap-2 hover:bg-accent/40">
            <span className="mono text-[10px] text-muted-foreground tabular-nums">{e.ts}</span>
            <Link to="/runs/$runId" params={{ runId: e.runId }}
              className="mono text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline truncate">
              [{e.runId.replace("run_", "")}]
            </Link>
            <span className={cn("mono text-[10px] font-semibold uppercase tracking-wide truncate", EVENT_TONE[e.kind])}>
              {e.kind}
            </span>
            <span className="mono text-[10px] text-foreground/80 truncate">{e.target}</span>
            <span className="mono text-[10px] text-muted-foreground truncate hidden sm:inline">{e.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
