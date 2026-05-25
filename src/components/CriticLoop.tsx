import { mockCriticLoop } from "@/lib/mockData";
import { CheckCircle2, RotateCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CriticLoop() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Planner ↔ Critic loop</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">3 iterations · convergence 0.94 · approved</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--status-merged)]/15 text-[color:var(--status-merged)] px-2 py-0.5 text-[10px] mono">
          <CheckCircle2 className="h-3 w-3" /> converged
        </span>
      </div>
      <ol className="space-y-1.5">
        {mockCriticLoop.map((step, i) => {
          const isPlanner = step.actor === "planner";
          const isApprove = step.verdict === "approve";
          return (
            <li key={i} className="flex items-start gap-2 text-[11px]">
              <span className={cn(
                "mono text-[9px] mt-0.5 w-9 shrink-0 text-center rounded px-1 py-0.5",
                isPlanner ? "bg-[color:var(--status-running)]/15 text-[color:var(--status-running)]" : "bg-[color:var(--status-planning)]/15 text-[color:var(--status-planning)]",
              )}>
                {isPlanner ? "PLAN" : "CRIT"}
              </span>
              <ArrowRight className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground flex-1">{step.msg}</span>
              {step.verdict === "revise" && <RotateCw className="h-3 w-3 mt-0.5 text-[color:var(--status-planning)] shrink-0" />}
              {isApprove && <CheckCircle2 className="h-3 w-3 mt-0.5 text-[color:var(--status-merged)] shrink-0" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
