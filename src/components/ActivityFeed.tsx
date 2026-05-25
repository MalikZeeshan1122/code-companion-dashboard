import { mockActivity } from "@/lib/mockData";
import { Link } from "@tanstack/react-router";

const nodeColor: Record<string, string> = {
  clone: "text-[color:var(--syntax-string)]",
  ast: "text-[color:var(--syntax-fn)]",
  context: "text-[color:var(--syntax-keyword)]",
  plan: "text-[color:var(--status-planning)]",
  patch: "text-[color:var(--status-running)]",
  validate: "text-[color:var(--status-review)]",
  review: "text-[color:var(--status-merged)]",
};

export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const items = mockActivity.slice(0, limit);
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Activity feed</span>
        <span className="text-[10px] mono text-muted-foreground">live</span>
      </div>
      <ul className="divide-y divide-border max-h-72 overflow-auto">
        {items.map((a, i) => (
          <li key={i} className="px-3 py-2 text-xs flex items-baseline gap-2.5 hover:bg-accent/30">
            <span className="mono text-[10px] text-muted-foreground w-14 shrink-0">{a.ts}</span>
            <span className={`mono text-[10px] uppercase w-16 shrink-0 ${nodeColor[a.node] ?? ""}`}>{a.node}</span>
            <Link
              to="/runs/$runId"
              params={{ runId: a.runId }}
              className="mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              {a.runId}
            </Link>
            <span className="flex-1 truncate">{a.msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
