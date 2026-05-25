import { createFileRoute } from "@tanstack/react-router";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { ARCH_NODES } from "@/lib/mockData";

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
  head: () => ({ meta: [{ title: "Architecture — Codex Ops" }] }),
});

function AgentsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent architecture</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The LangGraph state graph that orchestrates every run. Each node has its own prompt, model config, and retry policy.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <ArchitectureDiagram activeNode="patch" completed={["clone", "ast", "context", "plan"]} />

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Node details</div>
          <div className="space-y-2">
            {ARCH_NODES.map((n, i) => (
              <details key={n.key} className="rounded-md border border-border bg-background/40 group" open={i === 4}>
                <summary className="px-3 py-2 cursor-pointer text-sm font-medium flex items-center justify-between">
                  <span>
                    <span className="mono text-[10px] text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>
                    {n.label}
                  </span>
                  <span className="text-[10px] mono text-muted-foreground">claude-sonnet-4</span>
                </summary>
                <div className="px-3 pb-3 text-xs text-muted-foreground space-y-1.5">
                  <p>{n.desc}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Field k="temp" v="0.2" />
                    <Field k="max_tokens" v="4096" />
                    <Field k="retry" v="2x" />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">State transitions</div>
        <pre className="text-[11px] mono text-muted-foreground whitespace-pre overflow-auto bg-background/40 p-3 rounded">
{`User Task Input
      ↓
 Orchestrator Agent (LangGraph StateGraph)
      ↓
 ┌──────────────────────────────────────┐
 │  Node 1: Repo Cloner + Indexer       │
 │  Node 2: AST Parser + Embedder       │
 │  Node 3: Context Retriever (RAG)     │
 │  Node 4: Edit Planner Agent          │
 │  Node 5: Patch Writer Agent          │  ← self-critique loop
 │  Node 6: Validator (lint+test+types) │  ← Docker sandbox
 │  Node 7: Diff Formatter + Reviewer   │
 └──────────────────────────────────────┘
      ↓
 Human Review Gate → PR Submission`}
        </pre>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded bg-background/60 border border-border px-2 py-1 text-[10px] mono">
      <span className="text-muted-foreground">{k}</span>
      <span className="ml-1 text-foreground">{v}</span>
    </div>
  );
}
