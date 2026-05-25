import { createFileRoute, Link } from "@tanstack/react-router";
import { mockRuns } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, GitPullRequest, FileCode2, Activity, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Codex Ops" }] }),
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
  const recent = mockRuns.slice(0, 6);

  const stats = [
    { label: "Active runs", value: active.length, icon: Activity, tone: "text-[color:var(--status-running)]" },
    { label: "Awaiting review", value: mockRuns.filter((r) => r.status === "needs_review").length, icon: GitPullRequest, tone: "text-[color:var(--status-review)]" },
    { label: "Merged this week", value: mockRuns.filter((r) => r.status === "merged").length, icon: CheckCircle2, tone: "text-[color:var(--status-merged)]" },
    { label: "Failed", value: mockRuns.filter((r) => r.status === "failed").length, icon: AlertTriangle, tone: "text-[color:var(--status-failed)]" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Repo-level agent runs across your connected projects.</p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" /> New task
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
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

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active runs</h2>
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {active.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No active runs.</div>
          ) : (
            active.map((r) => (
              <Link
                key={r.id}
                to="/runs/$runId"
                params={{ runId: r.id }}
                className="block border-b border-border last:border-b-0 p-4 hover:bg-accent/40 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
                      <FileCode2 className="h-3 w-3" />
                      {r.repo} · {r.branch}
                      <span className="opacity-50">·</span>
                      <span>{r.id}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium truncate">{r.task}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {timeAgo(r.createdAt)} · {r.author}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent activity</h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {recent.map((r) => (
            <Link
              key={r.id}
              to="/runs/$runId"
              params={{ runId: r.id }}
              className="flex items-center gap-3 p-3 hover:bg-accent/40 transition text-sm"
            >
              <StatusBadge status={r.status} />
              <span className="mono text-xs text-muted-foreground truncate w-44 shrink-0">{r.repo}</span>
              <span className="flex-1 truncate">{r.task}</span>
              <span className="mono text-xs text-muted-foreground">
                +{r.additions} −{r.deletions}
              </span>
              <span className="text-xs text-muted-foreground w-16 text-right">{timeAgo(r.createdAt)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
