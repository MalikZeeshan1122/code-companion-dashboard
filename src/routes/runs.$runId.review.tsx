import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { mockDiffs, mockRuns } from "@/lib/mockData";
import { DiffView } from "@/components/DiffView";
import { Check, X, ArrowUpFromLine, Trash2, MessageSquare, Columns2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs/$runId/review")({
  component: ReviewPage,
  loader: ({ params }) => {
    const run = mockRuns.find((r) => r.id === params.runId) ?? mockRuns[0];
    return { run };
  },
  head: () => ({ meta: [{ title: "Review — Codex Ops" }] }),
});

function ReviewPage() {
  const { run } = Route.useLoaderData();
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected" | "pending">>(
    () => Object.fromEntries(mockDiffs.map((d) => [d.filePath, "pending"])),
  );
  const [active, setActive] = useState(mockDiffs[0].filePath);
  const [split, setSplit] = useState(true);
  const [comment, setComment] = useState("");

  const diff = mockDiffs.find((d) => d.filePath === active)!;
  const approved = Object.values(decisions).filter((v) => v === "approved").length;
  const rejected = Object.values(decisions).filter((v) => v === "rejected").length;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mono">
          <Link to="/" className="hover:text-foreground">dashboard</Link>
          <span>/</span>
          <Link to="/runs/$runId" params={{ runId: run.id }} className="hover:text-foreground">{run.id}</Link>
          <span>/</span>
          <span>review</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-base font-semibold truncate">{run.task}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSplit((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent"
            >
              {split ? <FileText className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
              {split ? "Unified" : "Split"}
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <Trash2 className="h-3.5 w-3.5" /> Discard
            </button>
            <button
              disabled={approved === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <GitPullRequest className="h-3.5 w-3.5" /> Submit PR ({approved})
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* File list */}
        <aside className="border-r border-border bg-sidebar/50 overflow-auto">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border flex items-center justify-between">
            <span>{mockDiffs.length} files</span>
            <span className="mono">
              <span className="text-[color:var(--status-merged)]">{approved}✓</span>{" · "}
              <span className="text-[color:var(--status-failed)]">{rejected}✗</span>
            </span>
          </div>
          {mockDiffs.map((d) => {
            const dec = decisions[d.filePath];
            return (
              <div
                key={d.filePath}
                className={cn(
                  "border-b border-border px-3 py-2 cursor-pointer hover:bg-accent/40",
                  active === d.filePath && "bg-accent",
                )}
                onClick={() => setActive(d.filePath)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs mono truncate">{d.filePath}</div>
                    <div className="mt-0.5 text-[10px] mono">
                      <span className="text-[color:var(--diff-add-fg)]">+{d.additions}</span>{" "}
                      <span className="text-[color:var(--diff-del-fg)]">−{d.deletions}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDecisions((p) => ({ ...p, [d.filePath]: dec === "approved" ? "pending" : "approved" })); }}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition",
                        dec === "approved"
                          ? "bg-[color:var(--status-merged)]/20 border-[color:var(--status-merged)]/50 text-[color:var(--status-merged)]"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                      title="Approve"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDecisions((p) => ({ ...p, [d.filePath]: dec === "rejected" ? "pending" : "rejected" })); }}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition",
                        dec === "rejected"
                          ? "bg-[color:var(--status-failed)]/20 border-[color:var(--status-failed)]/50 text-[color:var(--status-failed)]"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                      title="Reject"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Diff + comment */}
        <section className="flex flex-col min-w-0">
          <div className="border-b border-border px-4 py-2 bg-muted/30 flex items-center justify-between">
            <code className="text-xs mono text-[color:var(--syntax-fn)]">{diff.filePath}</code>
            <span className="text-[10px] mono text-muted-foreground">
              {split ? "split view" : "unified"} · +{diff.additions} −{diff.deletions}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <DiffView before={diff.before} after={diff.after} split={split} />
          </div>
          <div className="border-t border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-2 text-muted-foreground" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment for the agent (e.g. 'use safeParse instead of parse')…"
                rows={2}
                className="flex-1 bg-transparent text-sm focus:outline-none resize-none"
              />
              <button className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-accent">
                Send to agent
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
