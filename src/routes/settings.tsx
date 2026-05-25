import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — Codex Ops" }] }),
});

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-border last:border-b-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm mono focus:outline-none focus:border-ring";

function Settings() {
  const [lint, setLint] = useState("eslint src/ --max-warnings 0");
  const [test, setTest] = useState("vitest run");
  const [threshold, setThreshold] = useState(2);
  const [autoMerge, setAutoMerge] = useState(false);
  const [maxFiles, setMaxFiles] = useState(40);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Configure how the agent validates and ships changes.</p>

      <div className="mt-8 rounded-lg border border-border bg-card px-5">
        <Field label="Lint command" hint="Run after patches are written. Must exit 0 to pass.">
          <input className={inputCls} value={lint} onChange={(e) => setLint(e.target.value)} />
        </Field>
        <Field label="Test command" hint="Run in the sandboxed container after lint passes.">
          <input className={inputCls} value={test} onChange={(e) => setTest(e.target.value)} />
        </Field>
        <Field label="Reviewer approvals" hint="Number of human reviewers required before a PR can merge.">
          <input
            type="number" min={0} max={5}
            className={inputCls + " w-24"}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </Field>
        <Field label="Max files per run" hint="Stop the agent if it tries to touch more than this many files.">
          <input
            type="number" min={1} max={500}
            className={inputCls + " w-24"}
            value={maxFiles}
            onChange={(e) => setMaxFiles(Number(e.target.value))}
          />
        </Field>
        <Field label="Auto-merge on green" hint="Merge automatically when all checks pass and approvals are met.">
          <button
            type="button"
            onClick={() => setAutoMerge((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${autoMerge ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-background transition ${autoMerge ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </Field>
      </div>

      <div className="mt-5 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> Save settings
        </button>
      </div>
    </div>
  );
}
