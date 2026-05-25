import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { mockRuns } from "@/lib/mockData";

const navItems = [
  { label: "Go to Dashboard", to: "/" as const },
  { label: "New Task", to: "/new" as const },
  { label: "Run History", to: "/history" as const },
  { label: "Analytics", to: "/analytics" as const },
  { label: "Agent Architecture", to: "/agents" as const },
  { label: "Settings", to: "/settings" as const },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  const ql = q.toLowerCase();
  const navHits = navItems.filter((n) => n.label.toLowerCase().includes(ql));
  const runHits = mockRuns
    .filter((r) => r.task.toLowerCase().includes(ql) || r.repo.toLowerCase().includes(ql) || r.id.includes(ql))
    .slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search runs, jump to a page…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <kbd className="text-[10px] mono px-1.5 py-0.5 border border-border rounded text-muted-foreground">esc</kbd>
        </div>
        <div className="max-h-80 overflow-auto py-2">
          {navHits.length > 0 && (
            <Section title="Navigation">
              {navHits.map((n) => (
                <Item
                  key={n.to}
                  label={n.label}
                  onSelect={() => { setOpen(false); navigate({ to: n.to }); }}
                />
              ))}
            </Section>
          )}
          {runHits.length > 0 && (
            <Section title="Runs">
              {runHits.map((r) => (
                <Item
                  key={r.id}
                  label={r.task}
                  hint={`${r.repo} · ${r.id}`}
                  onSelect={() => { setOpen(false); navigate({ to: "/runs/$runId", params: { runId: r.id } }); }}
                />
              ))}
            </Section>
          )}
          {navHits.length === 0 && runHits.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No matches</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-2">
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Item({ label, hint, onSelect }: { label: string; hint?: string; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
    >
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-[10px] mono text-muted-foreground truncate">{hint}</span>}
    </button>
  );
}
