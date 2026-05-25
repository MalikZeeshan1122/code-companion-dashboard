import { mockSystemHealth } from "@/lib/mockData";
import { Cpu, Layers, Activity, Zap } from "lucide-react";

export function SystemHealth() {
  const h = mockSystemHealth;
  const budgetPct = Math.min(100, (h.spentTodayUsd / h.dailyBudgetUsd) * 100);
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">System health</div>
        <span className="inline-flex items-center gap-1 text-[10px] mono text-[color:var(--status-merged)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-merged)] animate-pulse" />
          operational
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={Layers} label="Docker pool" value={`${h.dockerPool.active}/${h.dockerPool.max}`} sub={`${h.dockerPool.idle} idle`} />
        <Metric icon={Activity} label="Redis queue" value={h.redisQueueDepth.toString()} sub="pending jobs" />
        <Metric icon={Cpu} label="Workers" value={`${h.workers.active}/${h.workers.capacity}`} sub={`p50 ${h.apiLatencyMs}ms`} />
        <Metric icon={Zap} label="Budget" value={`$${h.spentTodayUsd.toFixed(2)}`} sub={`of $${h.dailyBudgetUsd}/day`} />
      </div>
      <div className="mt-3">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-[color:var(--status-running)] transition-all"
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] mono text-muted-foreground">
          <span>{(h.tokensTodayIn / 1000).toFixed(1)}k in · {(h.tokensTodayOut / 1000).toFixed(1)}k out</span>
          <span>{budgetPct.toFixed(0)}% of daily budget</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof Cpu; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md bg-background/40 border border-border p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 mono text-base font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground mono">{sub}</div>
    </div>
  );
}
