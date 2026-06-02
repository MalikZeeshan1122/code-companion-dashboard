// Pure aggregation helpers shared by the Dashboard and Analytics pages.
// Operates on a minimal shape so both RealRun and the mock AgentRun work.

import type { RunStatus } from "@/lib/mockData";
import type { RealRun } from "@/lib/realRun";

export interface StatRun {
  status: RunStatus;
  createdAt: string;
  durationSec: number;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  persona: string;
  additions: number;
  deletions: number;
}

export interface DashboardStats {
  active: number;
  awaitingReview: number;
  merged: number;
  failed: number;
  totalTokens: number;
  totalCost: number;
}

export function dashboardStats(runs: StatRun[]): DashboardStats {
  return {
    active: runs.filter((r) => r.status === "planning" || r.status === "running").length,
    awaitingReview: runs.filter((r) => r.status === "needs_review").length,
    merged: runs.filter((r) => r.status === "merged").length,
    failed: runs.filter((r) => r.status === "failed").length,
    totalTokens: runs.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0),
    totalCost: runs.reduce((s, r) => s + r.costUsd, 0),
  };
}

export interface AnalyticsSummary {
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
  avgTokens: number;
}

export function analyticsSummary(runs: StatRun[]): AnalyticsSummary {
  const totalRuns = runs.length || 1;
  const terminal = runs.filter((r) => r.status === "merged" || r.status === "failed").length || 1;
  return {
    totalRuns: runs.length,
    successRate: (runs.filter((r) => r.status === "merged").length / terminal) * 100,
    avgDuration: runs.reduce((s, r) => s + r.durationSec, 0) / totalRuns,
    totalCost: runs.reduce((s, r) => s + r.costUsd, 0),
    avgTokens: runs.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0) / totalRuns,
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface DayBucket {
  day: string;
  success: number;
  failed: number;
}

/** Buckets runs into the last `days` calendar days (oldest -> newest). */
export function runsByDay(runs: StatRun[], days = 7): DayBucket[] {
  const buckets: DayBucket[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets.push({ day: DAY_LABELS[d.getDay()], success: 0, failed: 0 });
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - (days - 1));

  for (const r of runs) {
    const t = new Date(r.createdAt);
    const idx = Math.floor((t.getTime() - start.getTime()) / 86_400_000);
    if (idx < 0 || idx >= days) continue;
    if (r.status === "merged") buckets[idx].success += 1;
    else if (r.status === "failed") buckets[idx].failed += 1;
    else buckets[idx].success += 1; // count in-progress toward volume
  }
  return buckets;
}

export interface TokenByType {
  type: string;
  tokens: number;
}

export function tokensByPersona(runs: StatRun[]): TokenByType[] {
  const map = new Map<string, number>();
  for (const r of runs) {
    map.set(r.persona, (map.get(r.persona) ?? 0) + r.tokensIn + r.tokensOut);
  }
  return [...map.entries()]
    .map(([type, tokens]) => ({ type, tokens }))
    .sort((a, b) => b.tokens - a.tokens);
}

export interface HotFile {
  file: string;
  touches: number;
}

/** Counts how often each file path appears across real runs' diffs. */
export function hotFilesFromRuns(runs: RealRun[], limit = 8): HotFile[] {
  const map = new Map<string, number>();
  for (const r of runs) {
    for (const d of r.diffs) {
      map.set(d.filePath, (map.get(d.filePath) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([file, touches]) => ({ file, touches }))
    .sort((a, b) => b.touches - a.touches)
    .slice(0, limit);
}
