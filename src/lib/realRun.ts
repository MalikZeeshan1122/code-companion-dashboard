// Shared types for real (AI-generated, persisted) agent runs.
// This module is imported by both client and server — keep it free of any
// server-only imports (no node/cloudflare APIs, no fetch to OpenAI, etc).

export type RealRunStatus =
  | "planning"
  | "running"
  | "needs_review"
  | "merged"
  | "failed";

export type RealPersona =
  | "Refactor Bot"
  | "Feature Scaffolder"
  | "Security Auditor"
  | "Doc Writer";

export type RealRisk = "Conservative" | "Balanced" | "Aggressive";

export interface RealPlanStep {
  title: string;
  description: string;
  files: string[];
  rationale?: string;
}

export interface RealDiff {
  filePath: string;
  language: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
  riskScore: number;
  aiCommentary: string;
}

export interface RealValidation {
  name: string;
  command: string;
  status: "pass" | "fail" | "skip";
  output: string;
}

export type StageKey =
  | "clone"
  | "index"
  | "context"
  | "plan"
  | "patch"
  | "validate"
  | "review";

export interface RealStage {
  key: StageKey;
  label: string;
  status: "done" | "fail";
  durationMs: number;
  lines: string[];
}

export interface RealRun {
  id: string;
  repo: string;
  branch: string;
  task: string;
  persona: RealPersona;
  risk: RealRisk;
  maxFiles: number;
  requireTests: boolean;
  /** "openai" when a real model was used, "mock" for the deterministic fallback. */
  provider: "openai" | "mock";
  model: string;
  status: RealRunStatus;
  createdAt: string;
  subGoals: string[];
  summary: string;
  plan: RealPlanStep[];
  diffs: RealDiff[];
  validations: RealValidation[];
  stages: RealStage[];
  riskScore: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  durationSec: number;
  prUrl?: string;
}

/** Raw result returned by the agent before it is assembled into a RealRun. */
export interface AgentResult {
  provider: "openai" | "mock";
  model: string;
  summary: string;
  subGoals: string[];
  plan: RealPlanStep[];
  diffs: RealDiff[];
  validations: RealValidation[];
  riskScore: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export interface CreateRunInput {
  repo: string;
  branch: string;
  task: string;
  persona: RealPersona;
  risk: RealRisk;
  maxFiles: number;
  requireTests: boolean;
  allowGlob: string;
  blockGlob: string;
}

export const STAGE_ORDER: { key: StageKey; label: string }[] = [
  { key: "clone", label: "Repo cloner + indexer" },
  { key: "index", label: "AST parser + embedder" },
  { key: "context", label: "Context retriever (RAG)" },
  { key: "plan", label: "Edit planner agent" },
  { key: "patch", label: "Patch writer agent" },
  { key: "validate", label: "Validator (lint + test + types)" },
  { key: "review", label: "Diff formatter + reviewer" },
];

export function riskTone(score: number): string {
  if (score > 50) return "text-[color:var(--status-failed)]";
  if (score > 25) return "text-[color:var(--status-planning)]";
  return "text-[color:var(--status-merged)]";
}

export function riskLabel(score: number): string {
  if (score > 50) return "high";
  if (score > 25) return "medium";
  return "low";
}

export function formatTokens(n: number): string {
  return `${(n / 1000).toFixed(1)}k`;
}

/** Build a git-style unified diff for a single file from before/after text. */
export function fileUnifiedDiff(filePath: string, before: string, after: string): string {
  const a = before ? before.split("\n") : [];
  const b = after ? after.split("\n") : [];
  const setA = new Set(a);
  const setB = new Set(b);
  const body: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      body.push(` ${a[i]}`);
      i++;
      j++;
    } else if (j < b.length && !setA.has(b[j])) {
      body.push(`+${b[j]}`);
      j++;
    } else if (i < a.length && !setB.has(a[i])) {
      body.push(`-${a[i]}`);
      i++;
    } else if (i < a.length) {
      body.push(`-${a[i]}`);
      i++;
    } else {
      body.push(`+${b[j]}`);
      j++;
    }
  }
  return [
    `diff --git a/${filePath} b/${filePath}`,
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    `@@ -1,${a.length} +1,${b.length} @@`,
    ...body,
  ].join("\n");
}

/** Serialize a full run (header + per-file diffs) into a downloadable .patch. */
export function runToPatch(run: {
  id: string;
  repo: string;
  branch: string;
  task: string;
  diffs: { filePath: string; before: string; after: string }[];
}): string {
  const header = [
    `# Codex Ops patch — ${run.id}`,
    `# Repo: ${run.repo}`,
    `# Branch: ${run.branch}`,
    `# Task: ${run.task}`,
    "",
  ].join("\n");
  const files = run.diffs.map((d) => fileUnifiedDiff(d.filePath, d.before, d.after));
  return `${header}${files.join("\n\n")}\n`;
}
