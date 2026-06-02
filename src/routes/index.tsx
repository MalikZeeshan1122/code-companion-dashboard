import { createFileRoute, Link } from "@tanstack/react-router";
import { mockRuns } from "@/lib/mockData";
import type { RealRun } from "@/lib/realRun";
import { listRunsFn } from "@/lib/agentRuns";
import { dashboardStats, type StatRun } from "@/lib/runStats";
import { StatusBadge } from "@/components/StatusBadge";
import { SystemHealth } from "@/components/SystemHealth";
import { ResourceMonitor } from "@/components/ResourceMonitor";
import { EventStream } from "@/components/EventStream";
import { IntelligenceFeed } from "@/components/IntelligenceFeed";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { Plus, GitPullRequest, FileCode2, Activity, CheckCircle2, AlertTriangle, Coins, Radio } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  loader: async () => {
    let realRuns: RealRun[] = [];
    try {
      realRuns = await listRunsFn();
    } catch {
      realRuns = [];
    }
    return { realRuns };
  },
  head: () => ({ meta: [{ title: "Command Center — Codex Ops" }] }),
});

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface CardRun {
  id: string;
  repo: string;
  branch: string;
  task: string;
  persona: string;
  tokensIn: number;
  tokensOut: number;
  riskScore: number;
  status: StatRun["status"];
  additions: number;
  deletions: number;
  durationSec: number;
  costUsd: number;
  createdAt: string;
  source: "live" | "sample";
}

function toCardRun(r: RealRun | (typeof mockRuns)[number], source: "live" | "sample"): CardRun {
  return {
    id: r.id,
    repo: r.repo,
    branch: r.branch,
    task: r.task,
    persona: r.persona,
    tokensIn: r.tokensIn,
    tokensOut: r.tokensOut,
    riskScore: r.riskScore,
    status: r.status,
    additions: r.additions,
    deletions: r.deletions,
    durationSec: r.durationSec,
    costUsd: r.costUsd,
    createdAt: r.createdAt,
    source,
  };
}

function Dashboard() {
  const { realRuns } = Route.useLoaderData();
  const live = realRuns.length > 0;
  const source: "live" | "sample" = live ? "live" : "sample";

  const cards: CardRun[] = live
    ? realRuns.map((r) => toCardRun(r, "live"))
    : mockRuns.map((r) => toCardRun(r, "sample"));

  const statRuns: StatRun[] = cards;
  const s = dashboardStats(statRuns);

  const active = cards.filter(
    (r) => r.status === "planning" || r.status === "running" || r.status === "needs_review",
  );

  const stats = [
    { label: "Active runs", value: s.active, icon: Activity, tone: "text-[color:var(--status-running)]" },
    { label: "Awaiting review", value: s.awaitingReview, icon: GitPullRequest, tone: "text-[color:var(--status-review)]" },
    { label: "Merged", value: s.merged, icon: CheckCircle2, tone: "text-[color:var(--status-merged)]" },
    { label: "Failed", value: s.failed, icon: AlertTriangle, tone: "text-[color:var(--status-failed)]" },
    { label: "Tokens total", value: `${(s.totalTokens / 1000).toFixed(0)}k`, icon: Coins, tone: "text-[color:var(--syntax-string)]" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
            <DataSourceBadge source={source} count={realRuns.length} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {live
              ? "Live metrics from your persisted agent runs."
              : "No live runs yet — showing sample data. Kick off a task to populate this dashboard."}
          </p>
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
        {stats.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{st.label}</span>
                <Icon className={`h-4 w-4 ${st.tone}`} />
              </div>
              <div className="mt-2 text-2xl font-semibold mono">{st.value}</div>
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
              No active runs.{" "}
              <Link to="/new" className="text-primary hover:underline">
                Kick one off from New Task.
              </Link>
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
              {cards.slice(0, 6).map((r) =>
                r.source === "live" ? (
                  <Link
                    key={r.id}
                    to="/live/$runId"
                    params={{ runId: r.id }}
                    className="flex items-center gap-3 p-3 hover:bg-accent/40 transition text-sm"
                  >
                    <RecentRow r={r} />
                  </Link>
                ) : (
                  <Link
                    key={r.id}
                    to="/runs/$runId"
                    params={{ runId: r.id }}
                    className="flex items-center gap-3 p-3 hover:bg-accent/40 transition text-sm"
                  >
                    <RecentRow r={r} />
                  </Link>
                ),
              )}
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

function DataSourceBadge({ source, count }: { source: "live" | "sample"; count: number }) {
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--status-merged)]/40 bg-[color:var(--status-merged)]/10 px-2 py-0.5 text-[10px] mono text-[color:var(--status-merged)]">
        <Radio className="h-3 w-3" /> Live · {count}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] mono text-muted-foreground">
      Sample data
    </span>
  );
}

function RecentRow({ r }: { r: CardRun }) {
  return (
    <>
      <StatusBadge status={r.status} />
      <span className="mono text-xs text-muted-foreground truncate w-44 shrink-0">{r.repo}</span>
      <span className="flex-1 truncate">{r.task}</span>
      <span className="mono text-xs text-muted-foreground hidden md:inline">
        +{r.additions} −{r.deletions}
      </span>
      <span className="text-xs text-muted-foreground w-16 text-right">{timeAgo(r.createdAt)}</span>
    </>
  );
}

function RunCard({ r }: { r: CardRun }) {
  const totalTokens = r.tokensIn + r.tokensOut;
  const inner = (
    <>
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
    </>
  );

  const className = "block rounded-lg border border-border bg-card p-4 hover:bg-accent/30 transition group";

  return r.source === "live" ? (
    <Link to="/live/$runId" params={{ runId: r.id }} className={className}>
      {inner}
    </Link>
  ) : (
    <Link to="/runs/$runId" params={{ runId: r.id }} className={className}>
      {inner}
    </Link>
  );
}
