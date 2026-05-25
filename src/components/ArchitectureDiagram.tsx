import { ARCH_NODES, type NodeKey } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface Props {
  activeNode?: NodeKey;
  completed?: NodeKey[];
  failed?: NodeKey[];
  compact?: boolean;
}

export function ArchitectureDiagram({ activeNode, completed = [], failed = [], compact = false }: Props) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", compact ? "text-xs" : "text-sm")}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">LangGraph orchestrator</div>
          <div className="text-sm font-medium">Agent state graph</div>
        </div>
        <div className="flex items-center gap-3 text-[10px] mono text-muted-foreground">
          <Legend dot="bg-muted" label="todo" />
          <Legend dot="bg-[color:var(--status-running)] animate-pulse" label="active" />
          <Legend dot="bg-[color:var(--status-merged)]" label="done" />
          <Legend dot="bg-[color:var(--status-failed)]" label="fail" />
        </div>
      </div>

      <div className="relative">
        {/* Spine */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
        <ol className="space-y-1.5">
          {ARCH_NODES.map((n, i) => {
            const isActive = activeNode === n.key;
            const isDone = completed.includes(n.key);
            const isFail = failed.includes(n.key);
            return (
              <li key={n.key} className="relative pl-9">
                <span
                  className={cn(
                    "absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] mono font-semibold",
                    isFail && "border-[color:var(--status-failed)]/60 bg-[color:var(--status-failed)]/20 text-[color:var(--status-failed)]",
                    isActive && !isFail && "border-[color:var(--status-running)]/60 bg-[color:var(--status-running)]/20 text-[color:var(--status-running)] animate-pulse",
                    isDone && !isActive && !isFail && "border-[color:var(--status-merged)]/60 bg-[color:var(--status-merged)]/20 text-[color:var(--status-merged)]",
                    !isActive && !isDone && !isFail && "border-border text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div
                  className={cn(
                    "rounded-md border px-3 py-1.5 transition",
                    isActive ? "border-[color:var(--status-running)]/40 bg-[color:var(--status-running)]/5" : "border-border bg-background/40",
                  )}
                >
                  <div className="font-medium">{n.label}</div>
                  {!compact && <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
