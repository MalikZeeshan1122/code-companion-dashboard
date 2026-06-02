// The actual coding agent. Calls OpenAI to plan a repo-level change and propose
// per-file patches as structured JSON. Falls back to a deterministic mock
// generator when no API key is configured, so the app runs out of the box.

import type {
  AgentResult,
  CreateRunInput,
  RealDiff,
  RealPlanStep,
  RealValidation,
} from "@/lib/realRun";
import { getEnv } from "./env";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 60_000;

// USD per 1M tokens (input, output). Falls back to gpt-4o-mini pricing.
const PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1": { in: 2.0, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4.1-nano": { in: 0.1, out: 0.4 },
};

function countDiffLines(before: string, after: string): { additions: number; deletions: number } {
  const a = before ? before.split("\n") : [];
  const b = after ? after.split("\n") : [];
  const setA = new Set(a);
  const setB = new Set(b);
  const additions = b.filter((line) => !setA.has(line)).length;
  const deletions = a.filter((line) => !setB.has(line)).length;
  return { additions, deletions };
}

function clampRisk(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const price = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  return (tokensIn * price.in + tokensOut * price.out) / 1_000_000;
}

const personaBrief: Record<string, string> = {
  "Refactor Bot":
    "You perform behavior-preserving, multi-file refactors. Prefer minimal, surgical edits.",
  "Feature Scaffolder":
    "You scaffold new endpoints, modules, and files cleanly following existing conventions.",
  "Security Auditor":
    "You find and patch security weaknesses (injection, auth, validation, secrets).",
  "Doc Writer":
    "You write documentation, TSDoc comments, and READMEs; you avoid changing runtime behavior.",
};

function buildPrompt(input: CreateRunInput): { system: string; user: string } {
  const persona = personaBrief[input.persona] ?? personaBrief["Refactor Bot"];
  const fileBudget = Math.max(1, Math.min(input.maxFiles, 5));

  const system = [
    "You are Codex Ops, an autonomous repo-level coding agent.",
    persona,
    `Risk posture: ${input.risk}. Conservative = smallest safe change; Aggressive = broader sweeping edits.`,
    `Touch at most ${fileBudget} files. Respect allowed paths (${input.allowGlob}) and never touch blocked paths (${input.blockGlob}).`,
    input.requireTests
      ? "Tests are required: include at least one test-related validation."
      : "Tests are optional.",
    "",
    "Return ONLY a JSON object with EXACTLY this shape:",
    `{
  "summary": string,                       // one or two sentences
  "subGoals": string[],                    // 3-6 concrete sub-goals
  "plan": [{ "title": string, "description": string, "files": string[], "rationale": string }],
  "files": [{
    "filePath": string,
    "language": string,                    // e.g. "typescript", "python"
    "before": string,                      // representative CURRENT snippet (use "" for brand new files)
    "after": string,                       // proposed snippet after the edit
    "aiCommentary": string,                // why this change + any risk note
    "riskScore": number                    // 0-100
  }],
  "validations": [{ "name": string, "command": string, "status": "pass"|"fail"|"skip", "output": string }],
  "riskScore": number                      // overall 0-100
}`,
    "Keep before/after snippets concise (roughly 6-25 lines each) but realistic and internally consistent.",
    "Do not include markdown fences or any prose outside the JSON object.",
  ].join("\n");

  const user = [
    `Repository: ${input.repo}`,
    `Branch: ${input.branch}`,
    `Persona: ${input.persona}`,
    `Task: ${input.task}`,
  ].join("\n");

  return { system, user };
}

interface RawAgentJson {
  summary?: string;
  subGoals?: unknown;
  plan?: unknown;
  files?: unknown;
  validations?: unknown;
  riskScore?: unknown;
}

function normalize(raw: RawAgentJson): {
  summary: string;
  subGoals: string[];
  plan: RealPlanStep[];
  diffs: RealDiff[];
  validations: RealValidation[];
  riskScore: number;
} {
  const subGoals = Array.isArray(raw.subGoals)
    ? raw.subGoals.map((s) => String(s)).filter(Boolean).slice(0, 8)
    : [];

  const plan: RealPlanStep[] = Array.isArray(raw.plan)
    ? raw.plan.map((p) => {
        const step = (p ?? {}) as Record<string, unknown>;
        return {
          title: String(step.title ?? "Untitled step"),
          description: String(step.description ?? ""),
          files: Array.isArray(step.files) ? step.files.map((f) => String(f)) : [],
          rationale: step.rationale ? String(step.rationale) : undefined,
        };
      })
    : [];

  const diffs: RealDiff[] = Array.isArray(raw.files)
    ? raw.files.map((f) => {
        const file = (f ?? {}) as Record<string, unknown>;
        const before = String(file.before ?? "");
        const after = String(file.after ?? "");
        const { additions, deletions } = countDiffLines(before, after);
        return {
          filePath: String(file.filePath ?? "unknown"),
          language: String(file.language ?? "typescript"),
          before,
          after,
          additions,
          deletions,
          riskScore: clampRisk(file.riskScore, 20),
          aiCommentary: String(file.aiCommentary ?? ""),
        };
      })
    : [];

  const validations: RealValidation[] = Array.isArray(raw.validations)
    ? raw.validations.map((v) => {
        const check = (v ?? {}) as Record<string, unknown>;
        const status = String(check.status ?? "skip");
        return {
          name: String(check.name ?? "check"),
          command: String(check.command ?? ""),
          status: status === "pass" || status === "fail" ? status : "skip",
          output: String(check.output ?? ""),
        };
      })
    : [];

  const overallRisk = clampRisk(
    raw.riskScore,
    diffs.length ? Math.round(diffs.reduce((s, d) => s + d.riskScore, 0) / diffs.length) : 25,
  );

  return {
    summary: String(raw.summary ?? "Proposed change generated by the agent."),
    subGoals,
    plan,
    diffs,
    validations,
    riskScore: overallRisk,
  };
}

async function callOpenAI(input: CreateRunInput, apiKey: string): Promise<AgentResult> {
  const model = getEnv("OPENAI_MODEL") ?? DEFAULT_MODEL;
  const { system, user } = buildPrompt(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = normalize(JSON.parse(content) as RawAgentJson);

    const tokensIn = json.usage?.prompt_tokens ?? 0;
    const tokensOut = json.usage?.completion_tokens ?? 0;

    return {
      provider: "openai",
      model,
      ...parsed,
      tokensIn,
      tokensOut,
      costUsd: Number(estimateCost(model, tokensIn, tokensOut).toFixed(4)),
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Deterministic mock (no API key) — keeps the full flow working offline.
// ---------------------------------------------------------------------------

function firstAllowedDir(allowGlob: string): string {
  const first = allowGlob.split(",")[0]?.trim() ?? "src/**";
  return first.replace(/\*+.*$/, "").replace(/\/$/, "") || "src";
}

function mockResult(input: CreateRunInput): AgentResult {
  const dir = firstAllowedDir(input.allowGlob);
  const verb = input.task.split(/\s+/)[0]?.toLowerCase() || "update";

  const before = `export async function handler(req, res) {\n  const body = req.body;\n  const result = await process(body);\n  return res.json(result);\n}`;
  const after = `import { z } from "zod";\n\nconst schema = z.object({ amount: z.number().positive() });\n\nexport async function handler(req, res) {\n  const body = schema.parse(req.body);\n  const result = await process(body);\n  return res.json(result);\n}`;
  const { additions, deletions } = countDiffLines(before, after);

  return {
    provider: "mock",
    model: "mock-agent",
    summary: `Mock plan for: ${input.task}. Set OPENAI_API_KEY to generate a real, task-specific plan.`,
    subGoals: [
      `Locate the code paths relevant to "${input.task}"`,
      `Apply ${input.persona} changes within ${dir}`,
      "Add or update validation and tests",
      "Re-run lint, type-check, and tests before review",
    ],
    plan: [
      {
        title: `Scope the change in ${dir}`,
        description: `Identify the files under ${dir} affected by the task and outline the edits.`,
        files: [`${dir}/index.ts`],
        rationale: "Establish a minimal, reviewable surface area.",
      },
      {
        title: `${verb[0].toUpperCase() + verb.slice(1)} the target modules`,
        description: input.task,
        files: [`${dir}/handler.ts`],
        rationale: "Core behavior change requested by the task.",
      },
    ],
    diffs: [
      {
        filePath: `${dir}/handler.ts`,
        language: "typescript",
        before,
        after,
        additions,
        deletions,
        riskScore: 22,
        aiCommentary:
          "Adds schema validation at the trust boundary. Low risk: behavior preserved for valid inputs.",
      },
    ],
    validations: [
      { name: "Lint", command: "eslint .", status: "pass", output: "✔ 0 problems" },
      {
        name: "Type check",
        command: "tsc --noEmit",
        status: "pass",
        output: "✔ no type errors",
      },
      {
        name: "Unit tests",
        command: "vitest run",
        status: input.requireTests ? "pass" : "skip",
        output: input.requireTests ? "✔ 12 passed" : "skipped (tests not required)",
      },
    ],
    riskScore: input.risk === "Aggressive" ? 48 : input.risk === "Balanced" ? 28 : 16,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
  };
}

export async function runAgent(input: CreateRunInput): Promise<AgentResult> {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) return mockResult(input);
  try {
    return await callOpenAI(input, apiKey);
  } catch (err) {
    console.error("[agent] OpenAI call failed, falling back to mock:", err);
    return mockResult(input);
  }
}

export async function decompose(task: string, persona: string): Promise<string[]> {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey || !task.trim()) {
    return [
      `Analyze the task: "${task}"`,
      "Identify affected files and modules",
      "Draft the edit plan",
      "Apply patches and validate",
    ];
  }

  const model = getEnv("OPENAI_MODEL") ?? DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a ${persona}. Break the user's coding task into 3-6 concrete, ordered sub-goals. Return JSON: { "subGoals": string[] }.`,
          },
          { role: "user", content: task },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`decompose failed ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as {
      subGoals?: unknown;
    };
    const goals = Array.isArray(parsed.subGoals)
      ? parsed.subGoals.map((g) => String(g)).filter(Boolean).slice(0, 6)
      : [];
    return goals.length ? goals : ["Analyze the task", "Plan edits", "Apply patches", "Validate"];
  } catch (err) {
    console.error("[agent] decompose failed:", err);
    return ["Analyze the task", "Plan edits", "Apply patches", "Validate"];
  } finally {
    clearTimeout(timeout);
  }
}
