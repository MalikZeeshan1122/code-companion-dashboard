import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, GitBranch, Github, Wand2, Shield, FileCode2, BookOpen, Wrench } from "lucide-react";
import { mockSubGoals, type AgentPersona } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/new")({
  component: NewTask,
  head: () => ({ meta: [{ title: "New Task — Codex Ops" }] }),
});

const templates = [
  "Add input validation to all API routes using Zod",
  "Migrate auth middleware from JWT cookies to Bearer tokens",
  "Add --json output flag to all CLI subcommands",
  "Replace deprecated Stripe API v2 calls with v3 equivalents",
  "Convert sync DB calls in workers to async with connection pool",
];

const personas: { key: AgentPersona; icon: typeof Wrench; desc: string }[] = [
  { key: "Refactor Bot", icon: Wrench, desc: "Behavior-preserving multi-file edits." },
  { key: "Feature Scaffolder", icon: FileCode2, desc: "New endpoints, modules, scaffolding." },
  { key: "Security Auditor", icon: Shield, desc: "Find & patch security weaknesses." },
  { key: "Doc Writer", icon: BookOpen, desc: "Generate docs, TSDoc, READMEs." },
];

type Risk = "Conservative" | "Balanced" | "Aggressive";

function NewTask() {
  const navigate = useNavigate();
  const [repo, setRepo] = useState("https://github.com/acme/payments-api");
  const [branch, setBranch] = useState("main");
  const [task, setTask] = useState("");
  const [persona, setPersona] = useState<AgentPersona>("Refactor Bot");
  const [risk, setRisk] = useState<Risk>("Balanced");
  const [maxFiles, setMaxFiles] = useState(20);
  const [requireTests, setRequireTests] = useState(true);
  const [allowGlob, setAllowGlob] = useState("src/**, tests/**");
  const [blockGlob, setBlockGlob] = useState("infra/**, .github/**");
  const [subGoals, setSubGoals] = useState<string[]>([]);
  const [decomposing, setDecomposing] = useState(false);

  const decompose = () => {
    if (!task.trim()) return;
    setDecomposing(true);
    setTimeout(() => {
      setSubGoals(mockSubGoals);
      setDecomposing(false);
    }, 700);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/runs/$runId", params: { runId: "run_8af23" } });
  };

  const complexity = Math.min(100, maxFiles * 3 + (task.length > 80 ? 20 : 10) + (risk === "Aggressive" ? 25 : risk === "Balanced" ? 12 : 0));

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">New agent task</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Point the agent at a repo, pick a persona, set guardrails, and let it plan, patch, and surface a diff for review.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <Section title="Source">
          <div className="grid md:grid-cols-2 gap-4">
            <Labeled label="GitHub repository">
              <Field icon={Github}>
                <input value={repo} onChange={(e) => setRepo(e.target.value)} className={fieldCls} />
              </Field>
              <Hint ok>✓ acme/payments-api accessible · main exists · 847 files</Hint>
            </Labeled>
            <Labeled label="Target branch">
              <Field icon={GitBranch}>
                <input value={branch} onChange={(e) => setBranch(e.target.value)} className={fieldCls} />
              </Field>
              <Hint>3 commits ahead of origin/main</Hint>
            </Labeled>
          </div>
        </Section>

        <Section title="Task">
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onBlur={decompose}
            placeholder="e.g. Add input validation to all API routes using Zod"
            rows={4}
            className="block w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm focus:outline-none focus:border-ring resize-none"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button key={t} type="button" onClick={() => { setTask(t); setSubGoals([]); }}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-ring transition">
                {t}
              </button>
            ))}
          </div>
          {(subGoals.length > 0 || decomposing) && (
            <div className="mt-4 rounded-md border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
                <Wand2 className="h-3 w-3" /> AI-decomposed sub-goals
              </div>
              {decomposing ? (
                <div className="text-xs text-muted-foreground mono animate-pulse">analyzing task…</div>
              ) : (
                <ul className="space-y-1.5">
                  {subGoals.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="mt-1" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Section>

        <Section title="Agent persona">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {personas.map((p) => {
              const Icon = p.icon;
              const active = persona === p.key;
              return (
                <button
                  key={p.key} type="button"
                  onClick={() => setPersona(p.key)}
                  className={cn(
                    "text-left rounded-md border p-3 transition",
                    active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-ring/50",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="mt-1.5 text-sm font-medium">{p.key}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Constraints">
          <div className="grid md:grid-cols-2 gap-4">
            <Labeled label="Risk level">
              <div className="flex rounded-md border border-border overflow-hidden">
                {(["Conservative", "Balanced", "Aggressive"] as Risk[]).map((r) => (
                  <button key={r} type="button" onClick={() => setRisk(r)}
                    className={cn("flex-1 px-3 py-2 text-xs font-medium transition", risk === r ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                    {r}
                  </button>
                ))}
              </div>
            </Labeled>
            <Labeled label="Max files to touch">
              <input type="number" min={1} max={200} value={maxFiles} onChange={(e) => setMaxFiles(Number(e.target.value))}
                className={fieldCls + " px-3 py-2"} />
            </Labeled>
            <Labeled label="Allowed paths (glob)">
              <input value={allowGlob} onChange={(e) => setAllowGlob(e.target.value)} className={fieldCls + " px-3 py-2 mono text-xs"} />
            </Labeled>
            <Labeled label="Blocked paths (glob)">
              <input value={blockGlob} onChange={(e) => setBlockGlob(e.target.value)} className={fieldCls + " px-3 py-2 mono text-xs"} />
            </Labeled>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={requireTests} onChange={(e) => setRequireTests(e.target.checked)} />
            Require passing tests before patch submission
          </label>
        </Section>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Estimated complexity</div>
              <div className="mt-1 text-2xl font-semibold mono">{complexity}/100</div>
              <div className="text-[11px] text-muted-foreground">~{Math.round(complexity * 4.2)} LOC · ~{Math.round(complexity / 5)} files · est. ${(complexity * 0.012).toFixed(2)}</div>
            </div>
            <div className="w-40 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-[color:var(--status-running)]" style={{ width: `${complexity}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">Runs in an isolated Docker sandbox. You review the diff before any PR is opened.</div>
          <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Sparkles className="h-4 w-4" /> Kick off agent
          </button>
        </div>
      </form>
    </div>
  );
}

const fieldCls = "flex-1 bg-transparent text-sm focus:outline-none w-full";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      {children}
    </section>
  );
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function Field({ icon: Icon, children }: { icon: typeof Github; children: React.ReactNode }) {
  return (
    <div className="flex items-center rounded-md border border-input bg-input/30 focus-within:border-ring">
      <Icon className="ml-3 h-4 w-4 text-muted-foreground" />
      <div className="flex-1 px-3 py-2 text-sm mono">{children}</div>
    </div>
  );
}
function Hint({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return <div className={cn("mt-1 text-[10px] mono", ok ? "text-[color:var(--status-merged)]" : "text-muted-foreground")}>{children}</div>;
}
