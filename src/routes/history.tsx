import { createFileRoute, Link } from "@tanstack/react-router";
import { mockRuns } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Download } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: History,
  head: () => ({ meta: [{ title: "History — Codex Ops" }] }),
});

function History() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <h1 className="text-2xl font-semibold tracking-tight">Run history</h1>
      <p className="text-sm text-muted-foreground mt-1">Every agent run, success or failure.</p>

      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Repo</th>
              <th className="text-left px-4 py-2 font-medium">Task</th>
              <th className="text-right px-4 py-2 font-medium">Changes</th>
              <th className="text-right px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockRuns.map((r) => (
              <tr key={r.id} className="hover:bg-accent/30">
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 mono text-xs">{r.repo}<div className="text-muted-foreground">{r.branch}</div></td>
                <td className="px-4 py-3">
                  <Link to="/runs/$runId" params={{ runId: r.id }} className="hover:underline">
                    {r.task}
                  </Link>
                  <div className="text-xs text-muted-foreground mono">{r.id}</div>
                </td>
                <td className="px-4 py-3 text-right mono text-xs">
                  <span className="text-[color:var(--diff-add-fg)]">+{r.additions}</span>{" "}
                  <span className="text-[color:var(--diff-del-fg)]">−{r.deletions}</span>
                  <div className="text-muted-foreground">{r.filesChanged} files</div>
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent">
                    <Download className="h-3 w-3" /> diff
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
