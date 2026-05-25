import { createFileRoute } from "@tanstack/react-router";
import { mockSuccessRate, mockHotFiles, mockTokensByType, mockRuns } from "@/lib/mockData";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — Codex Ops" }] }),
});

function Analytics() {
  const totalRuns = mockRuns.length;
  const successRate = (mockRuns.filter((r) => r.status === "merged").length / totalRuns) * 100;
  const avgDuration = mockRuns.reduce((s, r) => s + r.durationSec, 0) / totalRuns;
  const totalCost = mockRuns.reduce((s, r) => s + r.costUsd, 0);

  const maxDay = Math.max(...mockSuccessRate.map((d) => d.success + d.failed));
  const maxTouches = Math.max(...mockHotFiles.map((f) => f.touches));
  const maxTokens = Math.max(...mockTokensByType.map((t) => t.tokens));

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Agent performance across all runs in the last 7 days.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Success rate" value={`${successRate.toFixed(1)}%`} sub={`${totalRuns} runs`} />
        <Stat label="Avg duration" value={`${Math.round(avgDuration)}s`} sub="per run" />
        <Stat label="Total spend" value={`$${totalCost.toFixed(2)}`} sub="last 7 days" />
        <Stat label="Avg tokens/run" value={`${Math.round(mockRuns.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0) / totalRuns / 1000)}k`} sub="in + out" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Success rate by day">
          <div className="flex items-end gap-2 h-44 pt-2">
            {mockSuccessRate.map((d) => {
              const total = d.success + d.failed;
              const sH = (d.success / maxDay) * 100;
              const fH = (d.failed / maxDay) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
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
          <Legend items={[{ c: "var(--status-merged)", l: "Merged" }, { c: "var(--status-failed)", l: "Failed" }]} />
        </Panel>

        <Panel title="Tokens consumed by task type">
          <div className="space-y-2.5 pt-2">
            {mockTokensByType.map((t) => (
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
        </Panel>
      </div>

      <Panel title="Most-touched files (last 7 days)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {mockHotFiles.map((f) => {
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
      </Panel>
    </div>
  );
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
