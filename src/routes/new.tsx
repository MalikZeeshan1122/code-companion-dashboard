import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, GitBranch, Github } from "lucide-react";

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

function NewTask() {
  const navigate = useNavigate();
  const [repo, setRepo] = useState("https://github.com/acme/payments-api");
  const [branch, setBranch] = useState("main");
  const [task, setTask] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/runs/$runId", params: { runId: "run_8af23" } });
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">New agent task</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Point the agent at a repo and describe what to change. It will plan, patch, and surface a diff for review.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            GitHub repository
          </label>
          <div className="mt-1.5 flex items-center rounded-md border border-input bg-input/30 focus-within:border-ring">
            <Github className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="flex-1 bg-transparent px-3 py-2 text-sm mono focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Target branch
          </label>
          <div className="mt-1.5 flex items-center rounded-md border border-input bg-input/30 focus-within:border-ring">
            <GitBranch className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm mono focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Task description
          </label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Add input validation to all API routes using Zod"
            rows={5}
            className="mt-1.5 block w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm focus:outline-none focus:border-ring resize-none"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTask(t)}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-ring transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Will run in an isolated container. You'll review the diff before any PR is opened.
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" /> Kick off agent
          </button>
        </div>
      </form>
    </div>
  );
}
