import { cn } from "@/lib/utils";
import type { RunStatus } from "@/lib/mockData";
import { STATUS_LABEL } from "@/lib/mockData";

const styles: Record<RunStatus, string> = {
  planning: "bg-[color:var(--status-planning)]/15 text-[color:var(--status-planning)] border-[color:var(--status-planning)]/30",
  running: "bg-[color:var(--status-running)]/15 text-[color:var(--status-running)] border-[color:var(--status-running)]/30",
  needs_review: "bg-[color:var(--status-review)]/15 text-[color:var(--status-review)] border-[color:var(--status-review)]/30",
  merged: "bg-[color:var(--status-merged)]/15 text-[color:var(--status-merged)] border-[color:var(--status-merged)]/30",
  failed: "bg-[color:var(--status-failed)]/15 text-[color:var(--status-failed)] border-[color:var(--status-failed)]/30",
};

const dots: Record<RunStatus, string> = {
  planning: "bg-[color:var(--status-planning)]",
  running: "bg-[color:var(--status-running)] animate-pulse",
  needs_review: "bg-[color:var(--status-review)]",
  merged: "bg-[color:var(--status-merged)]",
  failed: "bg-[color:var(--status-failed)]",
};

export function StatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
