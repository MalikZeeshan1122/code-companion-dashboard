import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { mockRuns, mockBranches, mockCommitFiles, generateCommitMessage, type CommitFile } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import {
  GitBranch, GitCommitHorizontal, ArrowUpFromLine, CircleCheck, CircleX, Copy, Check,
  Shield, Lock, FilePlus, FileMinus, FileEdit, GitPullRequest, RotateCcw, ChevronDown,
  Terminal, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs/$runId/push")({
  component: PushPage,
  loader: ({ params }) => {
    const run = mockRuns.find((r) => r.id === params.runId) ?? mockRuns[0];
    return { run };
  },
  head: () => ({ meta: [{ title: "Commit & Push — Codex Ops" }] }),
});

const PHASES = [
  { key: "idle", label: "Configure" },
  { key: "committing", label: "Commit" },
  { key: "pushing", label: "Push" },
  { key: "pr", label: "Pull Request" },
  { key: "done", label: "Done" },
] as const;

type PhaseKey = (typeof PHASES)[number]["key"] | "error";

function PushPage() {
  const { run } = Route.useLoaderData();

  const [branch, setBranch] = useState(`agent/${run.id}`);
  const [baseBranch, setBaseBranch] = useState("main");
  const [commitMsg, setCommitMsg] = useState(generateCommitMessage(run));
  const [commitBody, setCommitBody] = useState(`Agent-run: ${run.id}\nRisk score: ${run.riskScore}/100\nPersona: ${run.persona}`);
  const [files, setFiles] = useState<CommitFile[]>(mockCommitFiles);
  const [prTitle, setPrTitle] = useState(commitMsg);
  const [prBody, setPrBody] = useState(`## Summary\n${run.task}\n\n## Changes\n${mockCommitFiles.map((f) => `- ${f.filePath} (+${f.additions} −${f.deletions})`).join("\n")}\n\n## Validation\n- TypeScript: pass\n- ESLint: pass\n- Unit tests: pass`);
  const [phase, setPhase] = useState<typeof PHASES[number]["key"]>("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isBranchNew = !mockBranches.some((b) => b.name === branch);
  const stagedCount = files.filter((f) => f.staged).length;
  const totalAdditions = files.filter((f) => f.staged).reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.filter((f) => f.staged).reduce((s, f) => s + f.deletions, 0);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].slice(0, 12)}  ${line}`]);
  }, []);

  const startPush = () => {
    setPhase("committing");
    setProgress(0);
    setLogs([]);
    setPrUrl(null);
  };

  // Simulate pipeline
  useEffect(() => {
    if (phase === "idle") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const step = (ms: number, cb: () => void) => timers.push(setTimeout(cb, ms));

    if (phase === "committing") {
      appendLog(`git checkout -b ${branch}`);
      step(400, () => setProgress(15));
      step(700, () => appendLog(`Switched to a new branch '${branch}'`));
      step(900, () => appendLog(`git add ${files.filter((f) => f.staged).map((f) => f.filePath).join(" ")}`));
      step(1100, () => setProgress(30));
      step(1300, () => appendLog(`git commit -m "${commitMsg}"`));
      step(1600, () => appendLog(`[${branch} ${Math.random().toString(36).slice(2, 10)}] ${commitMsg}`));
      step(1800, () => appendLog(`${stagedCount} files changed, ${totalAdditions} insertions(+), ${totalDeletions} deletions(-)`));
      step(2000, () => { setProgress(45); setPhase("pushing"); });
    }

    if (phase === "pushing") {
      appendLog(`git push origin ${branch} --set-upstream`);
      step(400, () => setProgress(60));
      step(900, () => appendLog("remote: Resolving deltas: 100% (12/12), done."));
      step(1200, () => appendLog(`remote: Create a pull request for '${branch}' on GitHub`));
      step(1500, () => { setProgress(75); setPhase("pr"); });
    }

    if (phase === "pr") {
      appendLog("Creating pull request via GitHub API...");
      step(600, () => setProgress(85));
      step(1200, () => appendLog(`POST /repos/${run.repo}/pulls → 201 Created`));
      step(1600, () => {
        const url = `https://github.com/${run.repo}/pull/${Math.floor(Math.random() * 800 + 100)}`;
        setPrUrl(url);
        appendLog(`Pull request opened: ${url}`);
        setProgress(100);
        setPhase("done");
      });
    }

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const toggleFile = (fp: string) => {
    setFiles((prev) => prev.map((f) => (f.filePath === fp ? { ...f, staged: !f.staged } : f)));
  };

  const fileIcon = (s: CommitFile["status"]) => {
    switch (s) {
      case "added": return <FilePlus className="h-3.5 w-3.5 text-[color:var(--diff-add-fg)]" />;
      case "deleted": return <FileMinus className="h-3.5 w-3.5 text-[color:var(--diff-del-fg)]" />;
      default: return <FileEdit className="h-3.5 w-3.5 text-[color:var(--syntax-fn)]" />;
    }
  };

  const activePhaseIdx = PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mono">
          <Link to="/" className="hover:text-foreground">dashboard</Link>
          <span>/</span>
          <Link to="/runs/$runId" params={{ runId: run.id }} className="hover:text-foreground">{run.id}</Link>
          <span>/</span>
          <Link to="/runs/$runId/review" params={{ runId: run.id }} className="hover:text-foreground">review</Link>
          <span>/</span>
          <span>push</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-base font-semibold truncate">Commit & Push</h1>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={run.status} />
          </div>
        </div>
      </div>

      {/* Phase rail */}
      <div className="border-b border-border bg-card/30 px-6 py-2">
        <div className="flex items-center gap-1">
          {PHASES.map((p, i) => {
            const done = activePhaseIdx > i;
            const current = activePhaseIdx === i;
            return (
              <div key={p.key} className="flex items-center gap-1">
                <span className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded",
                  done && "text-[color:var(--status-merged)]",
                  current && "bg-accent text-accent-foreground",
                  !done && !current && "text-muted-foreground"
                )}>
                  {p.label}
                </span>
                {i < PHASES.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}
              </div>
            );
          })}
        </div>
        {phase !== "idle" && phase !== "done" && (
          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-[color:var(--status-running)] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Branch selector */}
            <section className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-[color:var(--syntax-fn)]" />
                <h2 className="text-sm font-medium">Branch</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground">New branch</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs mono focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {isBranchNew ? (
                        <span className="text-[10px] text-[color:var(--status-merged)] shrink- 0">new</span>
                      ) : (
                        <span className="text-[10px] text-[color:var(--status-planning)] shrink-0">exists</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Base</label>
                    <div className="mt-1 relative">
                      <select
                        value={baseBranch}
                        onChange={(e) => setBaseBranch(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-2.5 py-1.5 text-xs mono focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {mockBranches.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name} {b.protected ? "(protected)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {mockBranches.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => { setBaseBranch(b.name); }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] mono transition",
                        baseBranch === b.name
                          ? "border-[color:var(--status-running)] bg-[color:var(--status-running)]/10 text-[color:var(--status-running)]"
                          : "border-border text-muted-foreground hover:bg-accent/40"
                      )}
                    >
                      {b.protected ? <Lock className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Commit composer */}
            <section className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommitHorizontal className="h-4 w-4 text-[color:var(--syntax-fn)]" />
                  <h2 className="text-sm font-medium">Commit</h2>
                </div>
                <button
                  onClick={() => {
                    const sug = generateCommitMessage(run);
                    setCommitMsg(sug);
                    setCommitBody(`Agent-run: ${run.id}\nRisk score: ${run.riskScore}/100\nPersona: ${run.persona}`);
                  }}
                  className="flex items-center gap-1 text-[11px] text-[color:var(--syntax-fn)] hover:underline"
                >
                  <Sparkles className="h-3 w-3" /> Regenerate
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Subject</label>
                  <input
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs mono focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Body</label>
                  <textarea
                    value={commitBody}
                    onChange={(e) => setCommitBody(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Staging area */}
            <section className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[color:var(--syntax-fn)]" />
                  <h2 className="text-sm font-medium">Staged files</h2>
                  <span className="text-[10px] mono text-muted-foreground">
                    {stagedCount}/{files.length} · +{totalAdditions} −{totalDeletions}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiles((p) => p.map((f) => ({ ...f, staged: true })))}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Stage all
                  </button>
                  <button
                    onClick={() => setFiles((p) => p.map((f) => ({ ...f, staged: false })))}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Unstage all
                  </button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {files.map((f) => (
                  <div
                    key={f.filePath}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition",
                      !f.staged && "opacity-60"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={f.staged}
                      onChange={() => toggleFile(f.filePath)}
                      className="h-3.5 w-3.5 rounded border-border accent-[color:var(--status-running)]"
                    />
                    <div className="flex-1 min-w-1 flex items-center gap-2">
                      {fileIcon(f.status)}
                      <span className="text-xs mono truncate">{f.filePath}</span>
                    </div>
                    <span className="text-[10px] mono">
                      <span className="text-[color:var(--diff-add-fg)]">+{f.additions}</span>{" "}
                      <span className="text-[color:var(--diff-del-fg)]">−{f.deletions}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* PR composer (only after push or idle) */}
            {(phase === "idle" || phase === "done") && (
              <section className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-[color:var(--syntax-fn)]" />
                  <h2 className="text-sm font-medium">Pull Request</h2>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Title</label>
                    <input
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Description</label>
                    <textarea
                      value={prBody}
                      onChange={(e) => setPrBody(e.target.value)}
                      rows={5}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right column: actions + logs */}
          <div className="space-y-4">
            {/* Action card */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                <span className="mono">{run.repo}</span>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Branch</span>
                  <span className="mono text-foreground">{branch}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base</span>
                  <span className="mono text-foreground">{baseBranch}</span>
                </div>
                <div className="flex justify-between">
                  <span>Files</span>
                  <span className="mono text-foreground">{stagedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lines</span>
                  <span className="mono text-foreground">+{totalAdditions} −{totalDeletions}</span>
                </div>
              </div>

              {phase === "idle" && (
                <button
                  onClick={startPush}
                  disabled={stagedCount === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5" /> Commit & Push
                </button>
              )}

              {(phase === "committing" || phase === "pushing" || phase === "pr") && (
                <div className="flex items-center gap-2 text-xs text-[color:var(--status-running)]">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-[color:var(--status-running)] border-t-transparent animate-spin" />
                  {PHASES.find((p) => p.key === phase)?.label}…
                </div>
              )}

              {phase === "done" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[color:var(--status-merged)]">
                    <CircleCheck className="h-4 w-4" /> Pushed & PR opened
                  </div>
                  {prUrl && (
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={prUrl}
                        className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] mono text-muted-foreground"
                      />
                      <button
                        onClick={() => { navigator.clipboard.writeText(prUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="rounded-md border border-border p-1.5 hover:bg-accent"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--status-merged)]" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => { setPhase("idle"); setProgress(0); setLogs([]); setPrUrl(null); }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </button>
                </div>
              )}

              {phase === "error" && (
                <div className="flex items-center gap-2 text-xs text-[color:var(--status-failed)]">
                  <CircleX className="h-4 w-4" /> Push failed
                </div>
              )}
            </div>

            {/* Terminal log */}
            {(phase !== "idle" || logs.length > 0) && (
              <div className="rounded-lg border border-border bg-[oklch(0.14_0.012_250)] overflow-hidden flex flex-col">
                <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground mono">git operations</span>
                </div>
                <div className="p-3 space-y-1 max-h-80 overflow-auto">
                  {logs.map((l, i) => (
                    <div key={i} className="text-[11px] mono text-muted-foreground whitespace-pre-wrap">
                      {l}
                    </div>
                  ))}
                  {(phase === "committing" || phase === "pushing" || phase === "pr") && (
                    <div className="text-[11px] mono text-[color:var(--status-running)] animate-pulse">_</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
