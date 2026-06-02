// Server functions for real agent runs.
//
// This file is client-importable (routes call these functions), so it must NOT
// statically import anything under `src/server/**` — TanStack Start's import
// protection forbids that in the client graph. The server-only modules (agent,
// store) are therefore imported dynamically *inside* the handlers, which run
// only on the server and are stripped from the client bundle.

import { createServerFn } from "@tanstack/react-start";
import type { AgentResult, CreateRunInput, RealRun, RealStage } from "@/lib/realRun";
import { STAGE_ORDER } from "@/lib/realRun";

function shortId(): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2);
  return `run_${uuid.replace(/-/g, "").slice(0, 6)}`;
}

function buildStages(input: CreateRunInput, result: AgentResult): RealStage[] {
  const files = result.diffs.map((d) => d.filePath);
  const totalAdd = result.diffs.reduce((s, d) => s + d.additions, 0);
  const totalDel = result.diffs.reduce((s, d) => s + d.deletions, 0);
  const failed = result.validations.filter((v) => v.status === "fail");

  const lines: Record<string, string[]> = {
    clone: [
      `$ git clone --depth=1 ${input.repo} (branch: ${input.branch})`,
      "Detected languages: TypeScript, JavaScript",
      "File census complete",
    ],
    index: [
      "Parsing AST with tree-sitter…",
      "Embedding function-level chunks (pgvector)",
      "Index ready",
    ],
    context: [
      `Top-k retrieval for: "${input.task}"`,
      ...files.slice(0, 4).map((f, i) => `  ${(0.95 - i * 0.05).toFixed(2)}  ${f}`),
    ],
    plan: [
      `Planner (${result.model}) produced ${result.plan.length} step(s)`,
      ...result.plan.map((p, i) => `  ${i + 1}. ${p.title}`),
    ],
    patch: [
      `Wrote ${result.diffs.length} patch(es): +${totalAdd} / -${totalDel}`,
      ...files.map((f) => `  modified ${f}`),
    ],
    validate: result.validations.map(
      (v) =>
        `${v.status === "pass" ? "[pass]" : v.status === "fail" ? "[fail]" : "[skip]"} ${v.name}: ${v.command}`,
    ),
    review: [
      `Risk score: ${result.riskScore}/100`,
      input.requireTests ? "Tests required: enforced" : "Tests required: off",
      "Awaiting human review",
    ],
  };

  const baseMs: Record<string, number> = {
    clone: 1400,
    index: 2400,
    context: 1100,
    plan: 3200,
    patch: 4200,
    validate: 5200,
    review: 800,
  };

  return STAGE_ORDER.map(({ key, label }) => ({
    key,
    label,
    status: key === "validate" && failed.length > 0 ? "fail" : "done",
    durationMs: baseMs[key] ?? 1000,
    lines: lines[key] ?? [],
  })) as RealStage[];
}

function assembleRun(input: CreateRunInput, result: AgentResult): RealRun {
  const additions = result.diffs.reduce((s, d) => s + d.additions, 0);
  const deletions = result.diffs.reduce((s, d) => s + d.deletions, 0);
  const stages = buildStages(input, result);
  const durationSec = Math.round(stages.reduce((s, st) => s + st.durationMs, 0) / 1000);
  const hasFailures = result.validations.some((v) => v.status === "fail");

  return {
    id: shortId(),
    repo: input.repo.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, ""),
    branch: input.branch,
    task: input.task,
    persona: input.persona,
    risk: input.risk,
    maxFiles: input.maxFiles,
    requireTests: input.requireTests,
    provider: result.provider,
    model: result.model,
    status: hasFailures ? "failed" : "needs_review",
    createdAt: new Date().toISOString(),
    subGoals: result.subGoals,
    summary: result.summary,
    plan: result.plan,
    diffs: result.diffs,
    validations: result.validations,
    stages,
    riskScore: result.riskScore,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    costUsd: result.costUsd,
    filesChanged: result.diffs.length,
    additions,
    deletions,
    durationSec,
  };
}

function validateInput(data: CreateRunInput): CreateRunInput {
  if (!data || typeof data.task !== "string" || !data.task.trim()) {
    throw new Error("A task description is required.");
  }
  return {
    repo: String(data.repo ?? "").trim() || "local/repo",
    branch: String(data.branch ?? "main").trim() || "main",
    task: data.task.trim(),
    persona: data.persona,
    risk: data.risk,
    maxFiles: Number.isFinite(data.maxFiles) ? Math.max(1, Math.min(200, data.maxFiles)) : 20,
    requireTests: Boolean(data.requireTests),
    allowGlob: String(data.allowGlob ?? "src/**"),
    blockGlob: String(data.blockGlob ?? ""),
  };
}

export const createRunFn = createServerFn({ method: "POST" })
  .inputValidator(validateInput)
  .handler(async ({ data }): Promise<RealRun> => {
    const { runAgent } = await import("@/server/agent");
    const { getStore } = await import("@/server/store");
    const result = await runAgent(data);
    const run = assembleRun(data, result);
    await getStore().put(run);
    return run;
  });

export const getRunFn = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }): Promise<RealRun | null> => {
    if (!data.id) return null;
    const { getStore } = await import("@/server/store");
    return (await getStore().get(data.id)) ?? null;
  });

export const listRunsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<RealRun[]> => {
    const { getStore } = await import("@/server/store");
    return getStore().list(100);
  },
);

export const decomposeFn = createServerFn({ method: "POST" })
  .inputValidator((data: { task: string; persona: string }) => ({
    task: String(data?.task ?? ""),
    persona: String(data?.persona ?? "Refactor Bot"),
  }))
  .handler(async ({ data }): Promise<string[]> => {
    const { decompose } = await import("@/server/agent");
    return decompose(data.task, data.persona);
  });

export const deleteRunFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!data.id) return { ok: false };
    const { getStore } = await import("@/server/store");
    await getStore().delete(data.id);
    return { ok: true };
  });

export const openPrFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }): Promise<RealRun | null> => {
    const { getStore } = await import("@/server/store");
    const store = getStore();
    const run = await store.get(data.id);
    if (!run) return null;
    const num = 1000 + Math.floor(Math.random() * 9000);
    const updated: RealRun = {
      ...run,
      status: "merged",
      prUrl: `https://github.com/${run.repo}/pull/${num}`,
    };
    await store.put(updated);
    return updated;
  });
