import { mockFileImpacts, mockDepAudit } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function ImpactSidebar({ filePath }: { filePath: string }) {
  const impact = mockFileImpacts[filePath];
  if (!impact) {
    return <div className="p-4 text-xs text-muted-foreground">No impact analysis available for this file yet.</div>;
  }
  return (
    <div className="overflow-auto p-4 space-y-3 text-xs">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Impact analysis</div>
        <code className="mono text-[11px] text-[color:var(--syntax-fn)] break-all">{impact.filePath}</code>
      </div>

      {impact.functions.length > 0 && (
        <Section title={`Functions modified (${impact.functions.length})`}>
          {impact.functions.map((f) => {
            const delta = f.complexityAfter - f.complexityBefore;
            return (
              <div key={f.name} className="mono text-[11px] flex items-center justify-between">
                <span className="text-[color:var(--syntax-fn)]">{f.name}()</span>
                <span className="text-muted-foreground">
                  {f.complexityBefore}→{f.complexityAfter}{" "}
                  <span className={cn(delta < 0 ? "text-[color:var(--status-merged)]" : delta > 0 ? "text-[color:var(--status-failed)]" : "text-muted-foreground")}>
                    {delta < 0 ? "✓" : delta > 0 ? "↑" : "→"}
                  </span>
                </span>
              </div>
            );
          })}
        </Section>
      )}

      <Section title="Type safety">
        <KV k="Implicit any" before={impact.typeSafety.beforeAny} after={impact.typeSafety.afterAny} better="lower" />
        <KV k="Unsafe casts" before={impact.typeSafety.beforeCast} after={impact.typeSafety.afterCast} better="lower" />
      </Section>

      <Section title="Test coverage">
        <KV k="Lines" before={`${impact.coverage.lineBefore}%`} after={`${impact.coverage.lineAfter}%`} better="higher" rawDelta={impact.coverage.lineAfter - impact.coverage.lineBefore} />
        <KV k="Branches" before={`${impact.coverage.branchBefore}%`} after={`${impact.coverage.branchAfter}%`} better="higher" rawDelta={impact.coverage.branchAfter - impact.coverage.branchBefore} />
      </Section>

      <Section title="Dependencies">
        {mockDepAudit.added.map((d) => (
          <div key={d.name} className="mono text-[11px] flex items-center justify-between">
            <span><span className="text-[color:var(--status-merged)]">+</span> {d.name}@{d.version}</span>
            <span className="text-muted-foreground text-[10px]">{d.weeklyDownloads}/wk {d.trusted && "✓"}</span>
          </div>
        ))}
        {mockDepAudit.removed.map((d) => (
          <div key={d.name} className="mono text-[11px]">
            <span className="text-[color:var(--status-failed)]">−</span> {d.name}@{d.version}
          </div>
        ))}
      </Section>

      <Section title="Performance">
        <div className="mono text-[11px] text-muted-foreground">
          Overhead: <span className="text-foreground">+{impact.perfDeltaMs}ms</span>/request (negligible)
        </div>
      </Section>

      <Section title="Security">
        <ul className="space-y-1">
          {impact.securityNotes.map((n, i) => (
            <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <span className="text-[color:var(--status-merged)] mt-0.5">✓</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border bg-background/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function KV({ k, before, after, better, rawDelta }: { k: string; before: number | string; after: number | string; better: "higher" | "lower"; rawDelta?: number }) {
  const delta = rawDelta ?? (Number(after) - Number(before));
  const good = better === "higher" ? delta > 0 : delta < 0;
  const same = delta === 0;
  return (
    <div className="mono text-[11px] flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground">{before}</span>
        <span className="text-muted-foreground">→</span>
        <span>{after}</span>
        <span className={cn("text-[10px]", same ? "text-muted-foreground" : good ? "text-[color:var(--status-merged)]" : "text-[color:var(--status-failed)]")}>
          {same ? "→" : good ? "✓" : "✗"}
        </span>
      </span>
    </div>
  );
}
