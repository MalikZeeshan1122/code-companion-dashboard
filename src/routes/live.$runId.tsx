import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Coins, Clock, ShieldAlert, GitPullRequest, CheckCircle2, XCircle, Circle,
  ListChecks, FileDiff, Sparkles, Loader2, ExternalLink, Bot, Cpu, FlaskConical,
} from "lucide-react";
import { getRunFn, openPrFn } from "@/lib/agentRuns";
import type { RealRun } from "@/lib/realRun";
import { riskTone, riskLabel, formatTokens } from "@/lib/realRun";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { DiffView } from "@/components/DiffView";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live/$runId")({
  component: LiveRun,
  loader: async ({ params }) => {
    const run = await getRunFn({ data: { id: params.runId } });
    if (!run) throw notFound();
    return { run };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.run.task ?? "Run"} — Codex Ops` }],
  }),
});

type StageState = "todo" | "running" | "done" | "fail";

function LiveRun() {
  const { run: initialRun } = Route.useLoaderData();
  const [run, setRun] = useState<RealRun>(initialRun);

  // Animate only on the first arrival after creation (flag set by /new).
  const [fresh] = useState(() => {
    if (typeof window === "undefined") return false;
    const key = `codexops:animate:${initialRun.id}`;
    const f = sessionStorage.getItem(key) === "1";
    if (f) sessionStorage.removeItem(key);
    return f;
  });

  const stages = run.stages;
  const [current, setCurrent] = useState(fresh ? 0 : stages.length);
  const [done, setDone] = useState(!fresh);
  const [lineCounts, setLineCounts] = useState<number[]>(
    fresh ? stages.map(() => 0) : stages.map((s) => s.lines.length),
  );
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!fresh) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const driveStage = (idx: number) => {
      if (cancelled) return;
      if (idx >= stages.length) {
        setDone(true);
        return;
      }
      setCurrent(idx);
      const lines = stages[idx].lines;
      let shown = 0;
      const step = () => {
        if (cancelled) return;
        shown += 1;
        setLineCounts((prev) => {
          const next = [...prev];
          next[idx] = shown;
          return next;
        });
        if (shown < lines.length) timers.push(setTimeout(step, 110));
        else timers.push(setTimeout(() => driveStage(idx + 1), 420));
      };
      if (lines.length) timers.push(setTimeout(step, 240));
      else timers.push(setTimeout(() => driveStage(idx + 1), 520));
    };

    driveStage(0);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [fresh, stages]);

  // Live elapsed timer while animating.
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  const stageState = (idx: number): StageState => {
    if (idx < current) return stages[idx].status === "fail" ? "fail" : "done";
    if (idx === current && !done) return stages[idx].status === "fail" ? "fail" : "running";
    if (done) return stages[idx].status === "fail" ? "fail" : "done";
    return "todo";
  };

  const totalTokens = run.tokensIn + run.tokensOut;

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mono">
          <Link to="/" className="hover:text-foreground">dashboard</Link>
          <span>/</span>
          <Link to="/history" className="hover:text-foreground">history</Link>
          <span>/</span>
          <span>{run.id}</span>
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{run.task}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mono">
              <span>{run.repo}</span><span>·</span><span>{run.branch}</span><span>·</span>
              <span className="inline-flex items-center gap-1"><Bot className="h-3 w-3" />{run.persona}</span>
              <span>·</span>
              <span className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
                run.provider === "openai"
                  ? "bg-[color:var(--syntax-fn)]/15 text-[color:var(--syntax-fn)]"
                  : "bg-muted text-muted-foreground",
              )}>
                <Cpu className="h-3 w-3" />{run.model}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={done ? run.status : "running"} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <Meter icon={Coins} label="Tokens" value={formatTokens(totalTokens)} sub={`${run.tokensIn} in · ${run.tokensOut} out`} />
          <Meter icon={Clock} label="Duration" value={done ? `${run.durationSec}s` : `${elapsed}s`} sub={done ? "completed" : "running…"} />
          <Meter icon={Coins} label="Cost" value={`$${run.costUsd.toFixed(run.costUsd < 0.01 ? 4 : 2)}`} sub={run.provider} />
          <Meter
            icon={ShieldAlert}
            label="Risk"
            value={`${run.riskScore}/100`}
            sub={riskLabel(run.riskScore)}
            tone={riskTone(run.riskScore)}
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid lg:grid-cols-[360px_1fr] gap-0 min-h-full">
          {/* Pipeline rail */}
          <aside className="border-r border-border bg-background/40 p-4 space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Agent pipeline
            </h2>
            {stages.map((stage, idx) => {
              const st = stageState(idx);
              return (
                <div key={stage.key} className={cn(
                  "rounded-lg border bg-card overflow-hidden transition-colors",
                  st === "running" ? "border-[color:var(--status-running)]/50" : "border-border",
                )}>
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <StageDot state={st} />
                    <span className="text-sm font-medium flex-1">{stage.label}</span>
                    <span className="text-[10px] mono text-muted-foreground">
                      {st === "running" ? "…" : st === "todo" ? "queued" : `${(stage.durationMs / 1000).toFixed(1)}s`}
                    </span>
                  </div>
                  {(st === "running" || st === "done" || st === "fail") && stage.lines.length > 0 && (
                    <pre className="border-t border-border bg-background/40 px-3 py-2 text-[10.5px] mono leading-relaxed text-muted-foreground whitespace-pre-wrap">
{stage.lines.slice(0, lineCounts[idx]).join("\n")}{st === "running" && <span className="animate-pulse">▋</span>}
                    </pre>
                  )}
                </div>
              );
            })}
          </aside>

          {/* Results */}
          <section className="p-6">
            {!done ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[color:var(--status-running)]" />
                <p className="mt-4 text-sm font-medium">Agent is working…</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Cloning, indexing, retrieving context, and drafting patches. Real output streams into the pipeline on the left.
                </p>
              </div>
            ) : (
              <Results run={run} onMerged={setRun} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StageDot({ state }: { state: StageState }) {
  if (state === "done") return <CheckCircle2 className="h-4 w-4 text-[color:var(--status-merged)]" />;
  if (state === "fail") return <XCircle className="h-4 w-4 text-[color:var(--status-failed)]" />;
  if (state === "running")
    return <Loader2 className="h-4 w-4 animate-spin text-[color:var(--status-running)]" />;
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}

function Meter({ icon: Icon, label, value, sub, tone }: { icon: typeof Coins; label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn("mt-0.5 mono text-sm font-semibold", tone)}>{value}</div>
      <div className="text-[10px] mono text-muted-foreground truncate">{sub}</div>
    </div>
  );
}

type Tab = "plan" | "patch" | "validate";

function Results({ run, onMerged }: { run: RealRun; onMerged: (r: RealRun) => void }) {
  const [tab, setTab] = useState<Tab>("plan");
  const [activeFile, setActiveFile] = useState(run.diffs[0]?.filePath ?? "");
  const [pring, setPring] = useState(false);
  const diff = run.diffs.find((d) => d.filePath === activeFile) ?? run.diffs[0];

  const openPr = async () => {
    setPring(true);
    const pending = toast.loading("Opening pull request…");
    try {
      const updated = await openPrFn({ data: { id: run.id } });
      if (updated) {
        onMerged(updated);
        toast.success("Pull request opened", {
          id: pending,
          description: updated.prUrl,
          action: updated.prUrl
            ? { label: "Open", onClick: () => window.open(updated.prUrl, "_blank") }
            : undefined,
        });
      } else {
        toast.success("Pull request opened", { id: pending });
      }
    } catch (err) {
      toast.error("Could not open PR", {
        id: pending,
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPring(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--syntax-fn)]" /> Agent summary
        </div>
        <p className="text-sm">{run.summary}</p>
        {run.subGoals.length > 0 && (
          <ul className="mt-3 grid sm:grid-cols-2 gap-1.5">
            {run.subGoals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[color:var(--status-merged)]" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-1">
        <TabBtn active={tab === "plan"} onClick={() => setTab("plan")} icon={ListChecks}>
          Plan ({run.plan.length})
        </TabBtn>
        <TabBtn active={tab === "patch"} onClick={() => setTab("patch")} icon={FileDiff}>
          Patches ({run.diffs.length})
        </TabBtn>
        <TabBtn active={tab === "validate"} onClick={() => setTab("validate")} icon={FlaskConical}>
          Validation ({run.validations.length})
        </TabBtn>
      </div>

      {tab === "plan" && (
        <ol className="space-y-3">
          {run.plan.map((p, i) => (
            <li key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs mono font-semibold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{p.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                  {p.rationale && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground border-l-2 border-[color:var(--syntax-fn)]/40 pl-2">
                      <span className="mono text-[9px] uppercase mr-1 text-[color:var(--syntax-fn)]">why</span>{p.rationale}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.files.map((f) => (
                      <code key={f} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-[color:var(--syntax-fn)]">{f}</code>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {tab === "patch" && diff && (
        <div className="grid md:grid-cols-[240px_1fr] gap-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              {run.diffs.length} files changed
            </div>
            <div className="overflow-auto">
              {run.diffs.map((d) => (
                <button key={d.filePath} onClick={() => setActiveFile(d.filePath)}
                  className={cn("w-full text-left px-3 py-2 text-xs border-b border-border last:border-b-0 hover:bg-accent/40",
                    activeFile === d.filePath && "bg-accent")}>
                  <div className="mono truncate">{d.filePath}</div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[10px] mono">
                      <span className="text-[color:var(--diff-add-fg)]">+{d.additions}</span>{" "}
                      <span className="text-[color:var(--diff-del-fg)]">−{d.deletions}</span>
                    </span>
                    <span className="text-[9px] mono text-muted-foreground">risk {d.riskScore}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted/30">
              <code className="text-xs mono text-[color:var(--syntax-fn)] truncate">{diff.filePath}</code>
              <span className="text-[10px] mono text-muted-foreground shrink-0">risk {diff.riskScore}/100</span>
            </div>
            {diff.aiCommentary && (
              <div className="border-b border-border bg-[color:var(--syntax-fn)]/5 px-3 py-2 text-xs flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 text-[color:var(--syntax-fn)] shrink-0" />
                <span className="text-muted-foreground"><span className="text-[color:var(--syntax-fn)] mono text-[10px] mr-1.5">AI</span>{diff.aiCommentary}</span>
              </div>
            )}
            <div className="overflow-auto">
              <DiffView before={diff.before} after={diff.after} />
            </div>
          </div>
        </div>
      )}

      {tab === "validate" && (
        <div className="space-y-2">
          {run.validations.map((v) => (
            <div key={v.name} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                {v.status === "pass" ? <CheckCircle2 className="h-4 w-4 text-[color:var(--status-merged)]" /> :
                  v.status === "fail" ? <XCircle className="h-4 w-4 text-[color:var(--status-failed)]" /> :
                  <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium">{v.name}</span>
                <code className="text-[10px] text-muted-foreground mono">{v.command}</code>
              </div>
              {v.output && (
                <pre className="mt-2 rounded bg-background/60 p-2 text-[11px] mono whitespace-pre-wrap text-muted-foreground">{v.output}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
        {run.prUrl ? (
          <>
            <div className="text-sm">
              <div className="font-medium text-[color:var(--status-merged)] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Pull request opened
              </div>
              <a href={run.prUrl} target="_blank" rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs mono text-muted-foreground hover:text-foreground">
                {run.prUrl} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Link to="/history" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              Back to history
            </Link>
          </>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              Review the patches above, then open a pull request against{" "}
              <span className="mono">{run.branch}</span>.
            </div>
            <button onClick={openPr} disabled={pring}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {pring ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitPullRequest className="h-4 w-4" />}
              {pring ? "Opening PR…" : "Approve & open PR"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: (p: { className?: string }) => React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}>
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}
