import { createFileRoute, Link } from "@tanstack/react-router";
import { mockRuns } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { SystemHealth } from "@/components/SystemHealth";
import { ResourceMonitor } from "@/components/ResourceMonitor";
import { EventStream } from "@/components/EventStream";
import { IntelligenceFeed } from "@/components/IntelligenceFeed";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { Plus, GitPullRequest, FileCode2, Activity, CheckCircle2, AlertTriangle, Coins } from "lucide-react";


export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Command Center — Codex Ops" }] }),
});

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Dashboard() {
  const active = mockRuns.filter((r) => r.status === "planning" || r.status === "running" || r.status === "needs_review");
  const totalTokens = mockRuns.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0);

  const stats = [
    { label: "Active runs", value: active.length, icon: Activity, tone: "text-[color:var(--status-running)]" },
    { label: "Awaiting review", value: mockRuns.filter((r) => r.status === "needs_review").length, icon: GitPullRequest, tone: "text-[color:var(--status-review)]" },
    { label: "Merged", value: mockRuns.filter((r) => r.status === "merged").length, icon: CheckCircle2, tone: "text-[color:var(--status-merged)]" },
    { label: "Failed", value: mockRuns.filter((r) => r.status === "failed").length, icon: AlertTriangle, tone: "text-[color:var(--status-failed)]" },
    { label: "Tokens 24h", value: `${(totalTokens / 1000).toFixed(0)}k`, icon: Coins, tone: "text-[color:var(--syntax-string)]" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Live multi-agent orchestration across your connected repos.</p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" /> New task
        </Link>
      </div>

      <SystemHealth />
      <ResourceMonitor />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <div className="mt-2 text-2xl font-semibold mono">{s.value}</div>
            </div>
          );
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active runs</h2>
          <span className="text-[10px] mono text-muted-foreground">{active.length} concurrent · max 5</span>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {active.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No active runs. Kick one off from New Task.
            </div>
          ) : (
            active.map((r) => <RunCard key={r.id} r={r} />)
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">

        <div className="space-y-6 min-w-0">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent activity</h2>
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {mockRuns.slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  to="/runs/$runId"
                  params={{ runId: r.id }}
                  className="flex items-center gap-3 p-3 hover:bg-accent/40 transition text-sm"
                >
                  <StatusBadge status={r.status} />
                  <span className="mono text-xs text-muted-foreground truncate w-44 shrink-0">{r.repo}</span>
                  <span className="flex-1 truncate">{r.task}</span>
                  <span className="mono text-xs text-muted-foreground hidden md:inline">
                    +{r.additions} −{r.deletions}
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{timeAgo(r.createdAt)}</span>
                </Link>
              ))}
            </div>
          </section>

          <EventStream />
        </div>

        <aside className="space-y-6">
          <IntelligenceFeed />
          <ActivityFeed />
          <ArchitectureDiagram activeNode="patch" completed={["clone", "ast", "context", "plan"]} compact />
        </aside>
      </div>
    </div>
  );
}


function RunCard({ r }: { r: ReturnType<typeof mockRuns.slice>[number] }) {
  const totalTokens = r.tokensIn + r.tokensOut;
  return (
    <Link
      to="/runs/$runId"
      params={{ runId: r.id }}
      className="block rounded-lg border border-border bg-card p-4 hover:bg-accent/30 transition group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mono min-w-0">
          <FileCode2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{r.repo}</span>
          <span className="opacity-50">·</span>
          <span>{r.branch}</span>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <div className="mt-2 text-sm font-medium line-clamp-2">{r.task}</div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] mono text-muted-foreground">
        <div>
          <div className="text-[9px] uppercase">Persona</div>
          <div className="text-foreground/80 truncate">{r.persona}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase">Tokens</div>
          <div className="text-foreground/80">{(totalTokens / 1000).toFixed(1)}k</div>
        </div>
        <div>
          <div className="text-[9px] uppercase">Risk</div>
          <div className={r.riskScore > 50 ? "text-[color:var(--status-failed)]" : r.riskScore > 25 ? "text-[color:var(--status-planning)]" : "text-[color:var(--status-merged)]"}>
            {r.riskScore}/100
          </div>
        </div>
      </div>
      <div className="mt-3 h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-[color:var(--status-running)] transition-all"
          style={{ width: r.status === "planning" ? "20%" : r.status === "running" ? "60%" : "90%" }}
        />
      </div>
    </Link>
  );
}
