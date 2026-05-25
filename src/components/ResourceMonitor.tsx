import { mockSparklines } from "@/lib/mockData";

function Sparkline({ data, color, label, value, unit }: { data: number[]; color: string; label: string; value: string; unit?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 120, H = 30;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${H} ${points} ${W},${H}`;

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mono text-sm font-semibold tabular-nums">
          {value}<span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
        </div>
      </div>
      <svg width={W} height={H} className="shrink-0">
        <polygon points={areaPoints} fill={color} opacity="0.18" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function ResourceMonitor() {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Resource monitor</span>
        <span className="text-[10px] mono text-muted-foreground">last 60s</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Sparkline data={mockSparklines.cpu} color="oklch(0.72 0.16 245)" label="Docker CPU avg" value="47" unit="%" />
        <Sparkline data={mockSparklines.redisQueue} color="oklch(0.75 0.15 75)" label="Redis queue" value="12" unit=" jobs" />
        <Sparkline data={mockSparklines.tokensPerMin} color="oklch(0.7 0.18 150)" label="Token rate" value="1.02k" unit="/min" />
      </div>
    </div>
  );
}
