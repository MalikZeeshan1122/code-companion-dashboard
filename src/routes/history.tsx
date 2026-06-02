import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Download, Trash2, RefreshCw, ArrowUp, ArrowDown, ChevronsUpDown,
  Cpu, Sparkles, Inbox,
} from "lucide-react";
import { mockRuns, STATUS_LABEL, type RunStatus } from "@/lib/mockData";
import { listRunsFn, deleteRunFn } from "@/lib/agentRuns";
import { runToPatch, type RealRun } from "@/lib/realRun";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  component: History,
  loader: async () => {
    let realRuns: RealRun[] = [];
    try {
      realRuns = await listRunsFn();
    } catch {
      realRuns = [];
    }
    return { realRuns };
  },
  head: () => ({ meta: [{ title: "History — Codex Ops" }] }),
});

type Source = "live" | "sample";
type SortKey = "date" | "changes" | "cost" | "status";
type SortDir = "asc" | "desc";

interface Row {
  id: string;
  repo: string;
  branch: string;
  task: string;
  status: RunStatus;
  createdAt: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  costUsd: number | null;
  model: string | null;
  source: Source;
  run?: RealRun;
}

const STATUS_RANK: Record<RunStatus, number> = {
  running: 0,
  planning: 1,
  needs_review: 2,
  merged: 3,
  failed: 4,
};

const HIDDEN_KEY = "codexops:hiddenRuns";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/x-patch" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function samplePatch(row: Row): string {
  return [
    `# Codex Ops patch — ${row.id}`,
    `# Repo: ${row.repo}`,
    `# Branch: ${row.branch}`,
    `# Task: ${row.task}`,
    `# Sample run — ${row.filesChanged} files, +${row.additions}/-${row.deletions}`,
    "",
    "# Full unified diffs are available for live runs created via /new.",
    "",
  ].join("\n");
}

function History() {
  const { realRuns: initialReal } = Route.useLoaderData();

  const [realRuns, setRealRuns] = useState<RealRun[]>(initialReal);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  // Load persisted hidden ids.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_KEY);
      if (raw) setHidden(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  const persistHidden = (next: Set<string>) => {
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const runs = await listRunsFn();
      setRealRuns(runs);
      setUpdatedAt(Date.now());
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  };

  // Live refresh: poll every 8s + re-render the "updated Xs ago" label every 1s.
  useEffect(() => {
    const poll = setInterval(refresh, 8000);
    const label = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(label);
    };
  }, []);

  const remove = async (row: Row) => {
    const next = new Set(hidden);
    next.add(row.id);
    persistHidden(next);
    if (row.source === "live") {
      setRealRuns((prev) => prev.filter((r) => r.id !== row.id));
      try {
        await deleteRunFn({ data: { id: row.id } });
        toast.success("Run deleted", { description: row.id });
      } catch {
        toast.error("Could not delete run on the server", { description: "It has been hidden locally." });
      }
    } else {
      // Sample run: hidden locally and easily restorable.
      toast.success("Run hidden", {
        description: row.id,
        action: {
          label: "Undo",
          onClick: () => {
            const restored = new Set(hidden);
            restored.delete(row.id);
            persistHidden(restored);
          },
        },
      });
    }
  };

  const download = (row: Row) => {
    const text = row.run ? runToPatch(row.run) : samplePatch(row);
    downloadText(`${row.id}.patch`, text);
    toast.success("Diff downloaded", { description: `${row.id}.patch` });
  };

  const allRows: Row[] = useMemo(() => {
    const live: Row[] = realRuns.map((r) => ({
      id: r.id,
      repo: r.repo,
      branch: r.branch,
      task: r.task,
      status: r.status,
      createdAt: r.createdAt,
      additions: r.additions,
      deletions: r.deletions,
      filesChanged: r.filesChanged,
      costUsd: r.costUsd,
      model: r.model,
      source: "live",
      run: r,
    }));
    const sample: Row[] = mockRuns.map((r) => ({
      id: r.id,
      repo: r.repo,
      branch: r.branch,
      task: r.task,
      status: r.status,
      createdAt: r.createdAt,
      additions: r.additions,
      deletions: r.deletions,
      filesChanged: r.filesChanged,
      costUsd: r.costUsd,
      model: null,
      source: "sample",
    }));
    return [...live, ...sample];
  }, [realRuns]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = allRows.filter((r) => !hidden.has(r.id));
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);
    if (q) {
      rows = rows.filter(
        (r) =>
          r.task.toLowerCase().includes(q) ||
          r.repo.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "changes":
          return (a.additions + a.deletions - (b.additions + b.deletions)) * dir;
        case "cost":
          return ((a.costUsd ?? 0) - (b.costUsd ?? 0)) * dir;
        case "status":
          return (STATUS_RANK[a.status] - STATUS_RANK[b.status]) * dir;
        case "date":
        default:
          return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * dir;
      }
    });
    return rows;
  }, [allRows, hidden, query, statusFilter, sortKey, sortDir]);

  const counts = useMemo(() => {
    const base = allRows.filter((r) => !hidden.has(r.id));
    const map: Record<string, number> = { all: base.length };
    (Object.keys(STATUS_RANK) as RunStatus[]).forEach((s) => {
      map[s] = base.filter((r) => r.status === s).length;
    });
    return map;
  }, [allRows, hidden]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const liveCount = realRuns.filter((r) => !hidden.has(r.id)).length;
  void tick; // re-render trigger for the relative timestamp

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Run history</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every agent run, success or failure. {liveCount} live · {mockRuns.length} sample.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-merged)] animate-pulse" />
            updated {relativeTime(updatedAt)}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search task, repo, branch, or id…"
            className="w-full rounded-md border border-input bg-input/30 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="All" count={counts.all} />
          {(Object.keys(STATUS_RANK) as RunStatus[]).map((s) => (
            <FilterChip
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={STATUS_LABEL[s]}
              count={counts[s] ?? 0}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onClick={toggleSort} />
              <th className="text-left px-4 py-2 font-medium">Repo</th>
              <th className="text-left px-4 py-2 font-medium">Task</th>
              <SortHeader label="Changes" sortKey="changes" active={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
              <SortHeader label="Cost" sortKey="cost" active={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
              <SortHeader label="Date" sortKey="date" active={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleRows.map((r) => (
              <tr key={r.id} className="hover:bg-accent/30">
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 mono text-xs">
                  {r.repo}
                  <div className="text-muted-foreground">{r.branch}</div>
                </td>
                <td className="px-4 py-3 max-w-[320px]">
                  <Link
                    to={r.source === "live" ? "/live/$runId" : "/runs/$runId"}
                    params={{ runId: r.id }}
                    className="hover:underline line-clamp-1"
                  >
                    {r.task}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground mono">
                    <span>{r.id}</span>
                    {r.source === "live" ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-[color:var(--syntax-fn)]/15 px-1 text-[9px] text-[color:var(--syntax-fn)]">
                        <Sparkles className="h-2.5 w-2.5" /> live
                      </span>
                    ) : (
                      <span className="rounded bg-muted px-1 text-[9px]">sample</span>
                    )}
                    {r.model && (
                      <span className="inline-flex items-center gap-0.5">
                        <Cpu className="h-2.5 w-2.5" />{r.model}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right mono text-xs">
                  <span className="text-[color:var(--diff-add-fg)]">+{r.additions}</span>{" "}
                  <span className="text-[color:var(--diff-del-fg)]">−{r.deletions}</span>
                  <div className="text-muted-foreground">{r.filesChanged} files</div>
                </td>
                <td className="px-4 py-3 text-right mono text-xs">
                  {r.costUsd != null ? `$${r.costUsd.toFixed(r.costUsd < 0.01 ? 4 : 2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => download(r)}
                      title="Download .patch"
                      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
                    >
                      <Download className="h-3 w-3" /> diff
                    </button>
                    <button
                      onClick={() => remove(r)}
                      title="Delete from history"
                      className="inline-flex items-center justify-center rounded border border-border p-1.5 text-muted-foreground hover:bg-[color:var(--status-failed)]/15 hover:text-[color:var(--status-failed)] hover:border-[color:var(--status-failed)]/40"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visibleRows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No runs match your filters</p>
            <p className="text-xs text-muted-foreground">
              Try clearing the search or status filter
              {hidden.size > 0 && ", or restore hidden runs"}.
            </p>
            {(query || statusFilter !== "all" || hidden.size > 0) && (
              <button
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  persistHidden(new Set());
                }}
                className="mt-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
              >
                Reset filters {hidden.size > 0 && "& restore hidden"}
              </button>
            )}
          </div>
        )}
      </div>

      {hidden.size > 0 && visibleRows.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{hidden.size} run(s) hidden.</span>
          <button onClick={() => persistHidden(new Set())} className="hover:text-foreground underline">
            Restore hidden
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
        active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-ring/50",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 text-[10px] mono", active ? "bg-primary/20" : "bg-muted")}>{count}</span>
    </button>
  );
}

function SortHeader({
  label, sortKey, active, dir, onClick, align = "left",
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = active === sortKey;
  return (
    <th className={cn("px-4 py-2 font-medium", align === "right" ? "text-right" : "text-left")}>
      <button
        onClick={() => onClick(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-wider hover:text-foreground transition",
          isActive ? "text-foreground" : "",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        {isActive ? (
          dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function relativeTime(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}
