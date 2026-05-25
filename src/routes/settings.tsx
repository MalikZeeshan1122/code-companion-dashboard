import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { mockLintProfiles, mockApprovalPolicy, ARCH_NODES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — Codex Ops" }] }),
});

const tabs = ["Profiles", "Policies", "Agent prompts", "Webhooks", "Budget"] as const;
type Tab = (typeof tabs)[number];

function Settings() {
  const [tab, setTab] = useState<Tab>("Profiles");

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Configure validators, approvals, agent prompts, and budgets.</p>

      <div className="mt-6 border-b border-border flex gap-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 py-2 text-sm border-b-2 -mb-px transition",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Profiles" && <Profiles />}
        {tab === "Policies" && <Policies />}
        {tab === "Agent prompts" && <AgentPrompts />}
        {tab === "Webhooks" && <Webhooks />}
        {tab === "Budget" && <Budget />}
      </div>

      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> Save changes
        </button>
      </div>
    </div>
  );
}

function Profiles() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Named lint + test command profiles applied per repo or language.</p>
      {mockLintProfiles.map((p) => (
        <div key={p.name} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm">{p.name}</div>
              <code className="block mt-1 text-xs mono text-muted-foreground truncate">{p.command}</code>
              <div className="mt-2 text-[10px] mono text-muted-foreground">applies to {p.files} files · last used {p.lastUsed}</div>
            </div>
            <button className="text-muted-foreground hover:text-[color:var(--status-failed)]"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      <button className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-ring">
        <Plus className="h-4 w-4" /> New profile
      </button>
    </div>
  );
}

function Policies() {
  const p = mockApprovalPolicy;
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <Row label="Policy name"><input defaultValue={p.name} className={inp} /></Row>
      <Row label="Min reviewers"><input type="number" defaultValue={p.minReviewers} className={inp + " w-24"} /></Row>
      <Row label="Auto-merge when risk score below"><input type="number" defaultValue={p.autoMergeRiskBelow} className={inp + " w-24"} /></Row>
      <Row label="Require passing tests"><Toggle initial={p.requirePassingTests} /></Row>
      <Row label="Blocked paths"><input defaultValue={p.blockedPaths.join(", ")} className={inp + " mono text-xs"} /></Row>
    </div>
  );
}

function AgentPrompts() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Override the system prompt and model config for each LangGraph node. Advanced.</p>
      {ARCH_NODES.map((n, i) => (
        <details key={n.key} className="rounded-lg border border-border bg-card" open={i === 3}>
          <summary className="cursor-pointer px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              <span className="mono text-[10px] text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>
              {n.label}
            </span>
            <span className="text-[10px] mono text-muted-foreground">claude-sonnet-4 · temp 0.2</span>
          </summary>
          <div className="px-4 pb-4 space-y-2">
            <textarea
              rows={3}
              defaultValue={`You are the ${n.label} node. ${n.desc}\nKeep outputs structured and concise.`}
              className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-xs mono focus:outline-none focus:border-ring resize-none"
            />
            <div className="grid grid-cols-3 gap-2">
              <Mini label="temperature" value="0.2" />
              <Mini label="max_tokens" value="4096" />
              <Mini label="retry" value="2" />
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function Webhooks() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Notify external systems on run events.</p>
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Row label="Slack webhook"><input placeholder="https://hooks.slack.com/services/…" className={inp + " mono text-xs"} /></Row>
        <Row label="Discord webhook"><input placeholder="https://discord.com/api/webhooks/…" className={inp + " mono text-xs"} /></Row>
        <Row label="Linear API key"><input type="password" placeholder="lin_api_…" className={inp + " mono text-xs"} /></Row>
        <div className="text-xs text-muted-foreground">
          Triggers: <span className="mono">run.completed</span>, <span className="mono">review.requested</span>, <span className="mono">run.failed</span>
        </div>
      </div>
    </div>
  );
}

function Budget() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <Row label="Max tokens per run"><input type="number" defaultValue={120000} className={inp + " w-32"} /></Row>
      <Row label="Max spend per run (USD)"><input type="number" defaultValue={5} step={0.5} className={inp + " w-24"} /></Row>
      <Row label="Daily budget (USD)"><input type="number" defaultValue={50} className={inp + " w-24"} /></Row>
      <Row label="Hard cutoff on overrun"><Toggle initial={true} /></Row>
      <Row label="Sandbox CPU limit"><input defaultValue="2 vCPU" className={inp + " w-32"} /></Row>
      <Row label="Sandbox RAM limit"><input defaultValue="4 GB" className={inp + " w-32"} /></Row>
    </div>
  );
}

const inp = "rounded-md border border-input bg-input/30 px-3 py-2 text-sm focus:outline-none focus:border-ring";
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 items-center">
      <div className="text-sm">{label}</div>
      <div>{children}</div>
    </div>
  );
}
function Toggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button type="button" onClick={() => setOn((v) => !v)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-background transition ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-background/60 border border-border px-2 py-1.5 text-[11px] mono">
      <div className="text-muted-foreground text-[9px] uppercase">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
