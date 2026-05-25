import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { mockPrompts, ARCH_NODES } from "@/lib/mockData";
import { Save, History, FlaskConical, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prompts")({
  component: PromptStudio,
  head: () => ({ meta: [{ title: "Prompt Studio — Codex Ops" }] }),
});

function PromptStudio() {
  const [active, setActive] = useState(mockPrompts[0]);
  const [body, setBody] = useState(mockPrompts[0].body);
  const tokenCount = Math.round(body.length / 4);
  const node = ARCH_NODES.find((n) => n.key === active.node);

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Prompt Studio</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tune system prompts per LangGraph node. A/B test in isolation, ship with version history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <FlaskConical className="h-3.5 w-3.5" /> A/B test
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <History className="h-3.5 w-3.5" /> History
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Save className="h-3.5 w-3.5" /> Save {active.version}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[240px_1fr_300px]">
        <aside className="border-r border-border bg-sidebar/40 overflow-auto">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            Agent nodes
          </div>
          {ARCH_NODES.map((n) => {
            const p = mockPrompts.find((x) => x.node === n.key);
            const isActive = active.node === n.key;
            return (
              <button
                key={n.key}
                disabled={!p}
                onClick={() => { if (p) { setActive(p); setBody(p.body); } }}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-border text-xs disabled:opacity-40 disabled:cursor-not-allowed",
                  isActive ? "bg-accent" : "hover:bg-accent/40",
                )}
              >
                <div className="font-medium truncate">{n.label}</div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] mono text-muted-foreground">
                  <span>{p?.version ?? "—"}</span>
                  {p && <span className="text-[color:var(--status-merged)]"><ThumbsUp className="h-2.5 w-2.5 inline mr-0.5" />{p.winRate}%</span>}
                </div>
              </button>
            );
          })}
        </aside>

        <section className="flex flex-col min-w-0 bg-background">
          <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium">{node?.label}</span>
              <span className="mono text-[10px] text-muted-foreground">prompts/{active.node}/{active.version}.md</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] mono text-muted-foreground">
              <span>~{tokenCount} tokens</span>
              <span>{body.split("\n").length} lines</span>
            </div>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full resize-none bg-background p-4 mono text-[12px] leading-relaxed focus:outline-none text-foreground/90"
          />
          <div className="border-t border-border px-4 py-2 bg-card/50 text-[10px] mono text-muted-foreground flex items-center justify-between">
            <span>Variables: <span className="text-[color:var(--syntax-keyword)]">{"{{task_description}}"}</span> <span className="text-[color:var(--syntax-keyword)]">{"{{retrieved_context}}"}</span></span>
            <span>claude-sonnet-4-20250514 · temp 0.2</span>
          </div>
        </section>

        <aside className="border-l border-border bg-card/40 overflow-auto p-4 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Performance</div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Win rate" value={`${active.winRate}%`} tone="text-[color:var(--status-merged)]" />
              <Stat label="Avg tokens" value={`${(active.avgTokens / 1000).toFixed(1)}k`} />
              <Stat label="Updated" value={active.updatedAt} />
              <Stat label="Version" value={active.version} />
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Version history</div>
            <ul className="space-y-1.5">
              {["v4.2", "v4.1", "v4.0", "v3.2", "v3.1"].map((v, i) => (
                <li key={v} className="flex items-center justify-between text-[11px] mono rounded border border-border px-2 py-1.5 hover:bg-accent/40 cursor-pointer">
                  <span>{v}</span>
                  <span className={cn("text-[10px]", i === 0 ? "text-[color:var(--status-merged)]" : "text-muted-foreground")}>
                    {[91, 88, 84, 79, 75][i]}% win
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Test harness</div>
            <div className="rounded border border-border bg-background/40 p-2.5 text-[11px] text-muted-foreground">
              <div className="mono text-[10px] mb-1.5">sample input</div>
              <pre className="text-[10px] whitespace-pre-wrap leading-relaxed">{`task: "add Zod validation to all routes"
files: 847
language: typescript`}</pre>
              <button className="mt-2 w-full rounded bg-primary/15 text-primary text-[11px] py-1 hover:bg-primary/20">
                Run in isolation →
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded border border-border bg-background/40 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mono text-sm font-semibold mt-0.5", tone)}>{value}</div>
    </div>
  );
}
