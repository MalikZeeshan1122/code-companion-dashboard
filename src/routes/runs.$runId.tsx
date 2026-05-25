import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  mockRuns, mockFileTree, mockPlan, mockDiffs, mockValidations,
} from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { FileTree } from "@/components/FileTree";
import { DiffView } from "@/components/DiffView";
import {
  CheckCircle2, XCircle, Circle, FolderTree, Sparkles, ListChecks, FileDiff, FlaskConical, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs/$runId")({
  component: RunView,
  loader: ({ params }) => {
    const run = mockRuns.find((r) => r.id === params.runId) ?? mockRuns[0];
    if (!run) throw notFound();
    return { run };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.run.id ?? "Run"} — Codex Ops` }],
  }),
});

type StepKey = "index" | "context" | "plan" | "patch" | "validate";

const steps: { key: StepKey; label: string; icon: typeof FolderTree }[] = [
  { key: "index", label: "Indexing", icon: FolderTree },
  { key: "context", label: "Context", icon: Sparkles },
  { key: "plan", label: "Plan", icon: ListChecks },
  { key: "patch", label: "Patches", icon: FileDiff },
  { key: "validate", label: "Validation", icon: FlaskConical },
];

function RunView() {
  const { run } = Route.useLoaderData();
  const [step, setStep] = useState<StepKey>("patch");

  // For demo: mark all steps complete except validate which has 1 fail (matches mock)
  const stepStatus: Record<StepKey, "done" | "active" | "todo" | "fail"> = {
    index: "done",
    context: "done",
    plan: "done",
    patch: "done",
    validate: "fail",
  };

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mono">
          <Link to="/" className="hover:text-foreground">dashboard</Link>
          <span>/</span>
          <span>{run.id}</span>
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{run.task}</h1>
            <div className="mt-1 text-xs text-muted-foreground mono">
              {run.repo} · {run.branch} · {run.author}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={run.status} />
            <Link
              to="/runs/$runId/review"
              params={{ runId: run.id }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Review diff <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Step rail */}
        <div className="mt-5 flex items-center gap-1">
          {steps.map((s, i) => {
            const st = stepStatus[s.key];
            const Icon = s.icon;
            const active = step === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStep(s.key)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] mono",
                  st === "done" && "border-[color:var(--status-merged)]/50 bg-[color:var(--status-merged)]/15 text-[color:var(--status-merged)]",
                  st === "fail" && "border-[color:var(--status-failed)]/50 bg-[color:var(--status-failed)]/15 text-[color:var(--status-failed)]",
                  st === "active" && "border-primary/50 bg-primary/15 text-primary",
                  st === "todo" && "border-border text-muted-foreground",
                )}>
                  {st === "done" ? <CheckCircle2 className="h-3 w-3" /> : st === "fail" ? <XCircle className="h-3 w-3" /> : i + 1}
                </span>
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        {step === "index" && <IndexingStep />}
        {step === "context" && <ContextStep />}
        {step === "plan" && <PlanStep />}
        {step === "patch" && <PatchStep />}
        {step === "validate" && <ValidateStep />}
      </div>
    </div>
  );
}

function IndexingStep() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Repository indexing</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Cloned <span className="mono">acme/payments-api@main</span> · 247 files · 18,902 LOC · indexed in 2.4s.
      </p>
      <div className="rounded-lg border border-border bg-card p-3">
        <FileTree node={mockFileTree} />
      </div>
    </div>
  );
}

function ContextStep() {
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-6 max-w-5xl">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Retrieved context</h2>
        <p className="text-xs text-muted-foreground mb-3">Files ranked by semantic relevance to the task.</p>
        <div className="rounded-lg border border-border bg-card p-2">
          <FileTree node={mockFileTree} highlight />
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top matches</h2>
        <div className="space-y-2">
          {[
            { f: "src/routes/payments.ts", r: 0.95, why: "Defines POST /payments with ad-hoc body checks." },
            { f: "src/routes/refunds.ts", r: 0.92, why: "Mirror handler with similar validation gaps." },
            { f: "src/routes/webhooks.ts", r: 0.88, why: "Parses untrusted Stripe webhook payloads." },
            { f: "src/lib/validation.ts", r: 0.78, why: "Existing helper — extend rather than replace." },
          ].map((m) => (
            <div key={m.f} className="rounded-md border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <code className="text-xs text-[color:var(--syntax-fn)]">{m.f}</code>
                <span className="text-[10px] mono text-muted-foreground">relevance {Math.round(m.r * 100)}%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.why}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanStep() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Edit plan</h2>
      <p className="text-sm text-muted-foreground mb-4">
        The agent proposes the following steps. Each will be turned into a reviewable patch.
      </p>
      <ol className="space-y-3">
        {mockPlan.map((p, i) => (
          <li key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs mono font-semibold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{p.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
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
    </div>
  );
}

function PatchStep() {
  const [active, setActive] = useState(mockDiffs[0].filePath);
  const diff = mockDiffs.find((d) => d.filePath === active)!;

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4 h-full">
      <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          {mockDiffs.length} files changed
        </div>
        <div className="overflow-auto">
          {mockDiffs.map((d) => (
            <button
              key={d.filePath}
              onClick={() => setActive(d.filePath)}
              className={cn(
                "w-full text-left px-3 py-2 text-xs border-b border-border last:border-b-0 hover:bg-accent/40",
                active === d.filePath && "bg-accent",
              )}
            >
              <div className="mono truncate">{d.filePath}</div>
              <div className="mt-0.5 text-[10px] mono">
                <span className="text-[color:var(--diff-add-fg)]">+{d.additions}</span>{" "}
                <span className="text-[color:var(--diff-del-fg)]">−{d.deletions}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted/30">
          <code className="text-xs mono text-[color:var(--syntax-fn)]">{diff.filePath}</code>
          <span className="text-[10px] mono text-muted-foreground">unified diff</span>
        </div>
        <div className="overflow-auto">
          <DiffView before={diff.before} after={diff.after} />
        </div>
      </div>
    </div>
  );
}

function ValidateStep() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Validation results</h2>
      <div className="space-y-2">
        {mockValidations.map((v) => (
          <div key={v.name} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {v.status === "pass" ? (
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--status-merged)]" />
                ) : v.status === "fail" ? (
                  <XCircle className="h-4 w-4 text-[color:var(--status-failed)]" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{v.name}</span>
                <code className="text-[10px] text-muted-foreground mono">{v.command}</code>
              </div>
              <span className="text-[10px] mono text-muted-foreground">{v.duration}</span>
            </div>
            <pre className="mt-2 rounded bg-background/60 p-2 text-[11px] mono whitespace-pre-wrap text-muted-foreground">
{v.output}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
