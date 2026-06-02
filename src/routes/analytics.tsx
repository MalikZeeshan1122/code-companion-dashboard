import { createFileRoute } from "@tanstack/react-router";
import { mockSuccessRate, mockHotFiles, mockTokensByType, mockRuns } from "@/lib/mockData";
import type { RealRun } from "@/lib/realRun";
import { listRunsFn } from "@/lib/agentRuns";
import {
  analyticsSummary,
  runsByDay,
  tokensByPersona,
  hotFilesFromRuns,
  type StatRun,
} from "@/lib/runStats";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  loader: async () => {
    let realRuns: RealRun[] = [];
    try {
      realRuns = await listRunsFn();
    } catch {
      realRuns = [];
    }
    return { realRuns };
  },
  head: () => ({ meta: [{ title: "Analytics — Codex Ops" }] }),
});

function Analytics() {
  const { realRuns } = Route.useLoaderData();
  const live = realRuns.length > 0;

  const statRuns: StatRun[] = live ? (realRuns as StatRun[]) : (mockRuns as StatRun[]);
  const summary = analyticsSummary(statRuns);

  const byDay = live ? runsByDay(statRuns) : mockSuccessRate;
  const byType = live ? tokensByPersona(statRuns) : mockTokensByType;
  const hotFiles = live ? hotFilesFromRuns(realRuns) : mockHotFiles;

  const maxDay = Math.max(1, ...byDay.map((d) => d.success + d.failed));
  const maxTouches = Math.max(1, ...hotFiles.map((f) => f.touches));
  const maxTokens = Math.max(1, ...byType.map((t) => t.tokens));

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          {live ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--status-merged)]/40 bg-[color:var(--status-merged)]/10 px-2 py-0.5 text-[10px] mono text-[color:var(--status-merged)]">
              <Radio className="h-3 w-3" /> Live · {realRuns.length}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] mono text-muted-foreground">
              Sample data
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {live
            ? "Agent performance computed from your persisted runs."
            : "Showing sample data — create runs to see your real performance."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Success rate" value={`${summary.successRate.toFixed(1)}%`} sub={`${summary.totalRuns} runs`} />
        <Stat label="Avg duration" value={`${Math.round(summary.avgDuration)}s`} sub="per run" />
        <Stat label="Total spend" value={`$${summary.totalCost.toFixed(2)}`} sub={live ? "all runs" : "last 7 days"} />
        <Stat label="Avg tokens/run" value={`${(summary.avgTokens / 1000).toFixed(1)}k`} sub="in + out" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title={live ? "Run volume by day" : "Success rate by day"}>
          <div className="flex items-end gap-2 h-44 pt-2">
            {byDay.map((d, idx) => {
              const total = d.success + d.failed;
              const sH = (d.success / maxDay) * 100;
              const fH = (d.failed / maxDay) * 100;
              return (
                <div key={`${d.day}-${idx}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] mono text-muted-foreground">{total}</div>
                  <div className="w-full flex flex-col-reverse gap-px h-32">
                    <div className="bg-[color:var(--status-merged)]/70 rounded-sm" style={{ height: `${sH}%` }} />
                    {d.failed > 0 && <div className="bg-[color:var(--status-failed)]/70 rounded-sm" style={{ height: `${fH}%` }} />}
                  </div>
                  <div className="text-[10px] mono text-muted-foreground">{d.day}</div>
                </div>
              );
            })}
          </div>
          <Legend items={[{ c: "var(--status-merged)", l: "Merged / active" }, { c: "var(--status-failed)", l: "Failed" }]} />
        </Panel>

        <Panel title="Tokens consumed by persona">
          {byType.length === 0 ? (
            <EmptyHint />
          ) : (
            <div className="space-y-2.5 pt-2">
              {byType.map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{t.type}</span>
                    <span className="mono text-muted-foreground">{(t.tokens / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-[color:var(--status-running)]/70 rounded-full" style={{ width: `${(t.tokens / maxTokens) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title={live ? "Most-touched files" : "Most-touched files (last 7 days)"}>
        {hotFiles.length === 0 ? (
          <EmptyHint />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            {hotFiles.map((f) => {
              const intensity = f.touches / maxTouches;
              return (
                <div
                  key={f.file}
                  className="rounded-md border border-border p-2.5"
                  style={{ background: `color-mix(in oklab, var(--status-running) ${Math.round(intensity * 35)}%, transparent)` }}
                >
                  <div className="text-[11px] mono truncate text-foreground">{f.file}</div>
                  <div className="text-[10px] mono text-muted-foreground mt-0.5">{f.touches} touches</div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function EmptyHint() {
  return <div className="py-6 text-center text-xs text-muted-foreground">Not enough data yet.</div>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold mono">{value}</div>
      <div className="text-[10px] mono text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}

function Legend({ items }: { items: { c: string; l: string }[] }) {
  return (
    <div className="flex gap-3 mt-3 text-[10px] mono text-muted-foreground">
      {items.map((i) => (
        <span key={i.l} className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: i.c }} />
          {i.l}
        </span>
      ))}
    </div>
  );
}
