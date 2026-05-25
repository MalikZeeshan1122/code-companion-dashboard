export type RunStatus = "planning" | "running" | "needs_review" | "merged" | "failed";

export interface AgentRun {
  id: string;
  repo: string;
  branch: string;
  task: string;
  status: RunStatus;
  createdAt: string;
  author: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  persona: AgentPersona;
  riskScore: number; // 0-100
  durationSec: number;
}

export type AgentPersona = "Refactor Bot" | "Feature Scaffolder" | "Security Auditor" | "Doc Writer";

export interface FileNode {
  name: string;
  path: string;
  type: "dir" | "file";
  children?: FileNode[];
  relevance?: number;
  changeType?: "read" | "modified" | "added" | "deleted";
}

export interface DiffHunk {
  filePath: string;
  language: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
  status: "pending" | "approved" | "rejected";
  riskScore: number;
  aiCommentary: string;
}

export interface ValidationCheck {
  name: string;
  command: string;
  status: "pass" | "fail" | "skip";
  duration: string;
  output: string;
}

export interface PlanStep {
  title: string;
  description: string;
  files: string[];
}

export type NodeKey = "clone" | "ast" | "context" | "plan" | "patch" | "validate" | "review";

export interface TraceEntry {
  node: NodeKey;
  label: string;
  status: "done" | "running" | "todo" | "fail";
  duration?: string;
  tokensIn?: number;
  tokensOut?: number;
  lines: string[];
  reasoning?: string;
}

export const STATUS_LABEL: Record<RunStatus, string> = {
  planning: "Planning",
  running: "Patching",
  needs_review: "Needs Review",
  merged: "Merged",
  failed: "Failed",
};

export const ARCH_NODES: { key: NodeKey; label: string; desc: string }[] = [
  { key: "clone", label: "Repo Cloner + Indexer", desc: "Shallow clone, language detection, file census." },
  { key: "ast", label: "AST Parser + Embedder", desc: "Tree-sitter parse, function-level pgvector embeddings." },
  { key: "context", label: "Context Retriever (RAG)", desc: "Top-k semantic retrieval for the task description." },
  { key: "plan", label: "Edit Planner Agent", desc: "Claude Sonnet 4 plans multi-file edits as structured steps." },
  { key: "patch", label: "Patch Writer Agent", desc: "Streams per-file patches with self-critique loop." },
  { key: "validate", label: "Validator (lint+test+types)", desc: "Runs in isolated Docker sandbox with resource caps." },
  { key: "review", label: "Diff Formatter + Reviewer", desc: "Risk scoring, AI commentary, human-in-the-loop gate." },
];

export const mockRuns: AgentRun[] = [
  {
    id: "run_8af23",
    repo: "acme/payments-api",
    branch: "main",
    task: "Add input validation to all API routes using Zod",
    status: "needs_review",
    createdAt: "2026-05-25T14:32:00Z",
    author: "agent-v2",
    filesChanged: 7, additions: 184, deletions: 23,
    tokensIn: 48230, tokensOut: 9120, costUsd: 0.71,
    persona: "Refactor Bot", riskScore: 22, durationSec: 184,
  },
  {
    id: "run_92ke1",
    repo: "acme/dashboard-web",
    branch: "feat/auth-refactor",
    task: "Migrate auth middleware from JWT cookies to Bearer tokens",
    status: "running",
    createdAt: "2026-05-25T14:18:00Z",
    author: "agent-v2",
    filesChanged: 12, additions: 0, deletions: 0,
    tokensIn: 31204, tokensOut: 4012, costUsd: 0.42,
    persona: "Refactor Bot", riskScore: 48, durationSec: 92,
  },
  {
    id: "run_5tr88",
    repo: "acme/cli-tools",
    branch: "main",
    task: "Add --json output flag to all subcommands",
    status: "planning",
    createdAt: "2026-05-25T14:05:00Z",
    author: "user@acme.dev",
    filesChanged: 0, additions: 0, deletions: 0,
    tokensIn: 8100, tokensOut: 1240, costUsd: 0.11,
    persona: "Feature Scaffolder", riskScore: 18, durationSec: 14,
  },
  {
    id: "run_2bn10",
    repo: "acme/billing-svc",
    branch: "main",
    task: "Replace deprecated Stripe API v2 calls with v3 equivalents",
    status: "merged",
    createdAt: "2026-05-24T22:11:00Z",
    author: "agent-v2",
    filesChanged: 4, additions: 67, deletions: 58,
    tokensIn: 22310, tokensOut: 5402, costUsd: 0.38,
    persona: "Refactor Bot", riskScore: 31, durationSec: 152,
  },
  {
    id: "run_71xqq",
    repo: "acme/data-pipeline",
    branch: "main",
    task: "Convert sync DB calls in workers to async with connection pool",
    status: "failed",
    createdAt: "2026-05-24T18:44:00Z",
    author: "agent-v2",
    filesChanged: 3, additions: 41, deletions: 38,
    tokensIn: 18900, tokensOut: 6210, costUsd: 0.33,
    persona: "Refactor Bot", riskScore: 67, durationSec: 240,
  },
  {
    id: "run_44klp",
    repo: "acme/marketing-site",
    branch: "main",
    task: "Extract hardcoded copy into i18n translation files",
    status: "merged",
    createdAt: "2026-05-23T11:02:00Z",
    author: "user@acme.dev",
    filesChanged: 22, additions: 412, deletions: 198,
    tokensIn: 78400, tokensOut: 18230, costUsd: 1.42,
    persona: "Feature Scaffolder", riskScore: 12, durationSec: 412,
  },
  {
    id: "run_31aaq",
    repo: "acme/auth-service",
    branch: "main",
    task: "Audit rate limiting on /login and /reset endpoints",
    status: "merged",
    createdAt: "2026-05-22T09:14:00Z",
    author: "agent-v2",
    filesChanged: 5, additions: 88, deletions: 12,
    tokensIn: 29110, tokensOut: 7102, costUsd: 0.49,
    persona: "Security Auditor", riskScore: 28, durationSec: 178,
  },
  {
    id: "run_19hjk",
    repo: "acme/docs",
    branch: "main",
    task: "Generate TSDoc for all exported functions in @acme/sdk",
    status: "merged",
    createdAt: "2026-05-21T16:32:00Z",
    author: "user@acme.dev",
    filesChanged: 31, additions: 612, deletions: 4,
    tokensIn: 91200, tokensOut: 24400, costUsd: 1.81,
    persona: "Doc Writer", riskScore: 4, durationSec: 388,
  },
  {
    id: "run_88aab",
    repo: "acme/payments-api",
    branch: "main",
    task: "Add OpenTelemetry spans around outbound HTTP calls",
    status: "merged",
    createdAt: "2026-05-20T13:08:00Z",
    author: "agent-v2",
    filesChanged: 9, additions: 156, deletions: 22,
    tokensIn: 41200, tokensOut: 10220, costUsd: 0.72,
    persona: "Feature Scaffolder", riskScore: 34, durationSec: 221,
  },
  {
    id: "run_55pqr",
    repo: "acme/billing-svc",
    branch: "main",
    task: "Remove dead feature flags older than 90 days",
    status: "failed",
    createdAt: "2026-05-19T10:01:00Z",
    author: "agent-v2",
    filesChanged: 14, additions: 0, deletions: 280,
    tokensIn: 33100, tokensOut: 4810, costUsd: 0.41,
    persona: "Refactor Bot", riskScore: 71, durationSec: 156,
  },
];

export const mockFileTree: FileNode = {
  name: "payments-api", path: "/", type: "dir",
  children: [
    {
      name: "src", path: "/src", type: "dir",
      children: [
        {
          name: "routes", path: "/src/routes", type: "dir",
          children: [
            { name: "payments.ts", path: "/src/routes/payments.ts", type: "file", relevance: 0.95, changeType: "modified" },
            { name: "refunds.ts", path: "/src/routes/refunds.ts", type: "file", relevance: 0.92, changeType: "modified" },
            { name: "webhooks.ts", path: "/src/routes/webhooks.ts", type: "file", relevance: 0.88, changeType: "modified" },
            { name: "customers.ts", path: "/src/routes/customers.ts", type: "file", relevance: 0.85, changeType: "modified" },
            { name: "health.ts", path: "/src/routes/health.ts", type: "file", relevance: 0.1 },
          ],
        },
        {
          name: "lib", path: "/src/lib", type: "dir",
          children: [
            { name: "db.ts", path: "/src/lib/db.ts", type: "file", relevance: 0.2, changeType: "read" },
            { name: "stripe.ts", path: "/src/lib/stripe.ts", type: "file", relevance: 0.3, changeType: "read" },
            { name: "validation.ts", path: "/src/lib/validation.ts", type: "file", relevance: 0.78, changeType: "added" },
          ],
        },
        { name: "server.ts", path: "/src/server.ts", type: "file", relevance: 0.4, changeType: "read" },
        { name: "types.ts", path: "/src/types.ts", type: "file", relevance: 0.5, changeType: "read" },
      ],
    },
    {
      name: "tests", path: "/tests", type: "dir",
      children: [
        { name: "payments.test.ts", path: "/tests/payments.test.ts", type: "file", relevance: 0.6, changeType: "modified" },
        { name: "refunds.test.ts", path: "/tests/refunds.test.ts", type: "file", relevance: 0.55, changeType: "modified" },
      ],
    },
    { name: "package.json", path: "/package.json", type: "file", relevance: 0.3 },
    { name: "tsconfig.json", path: "/tsconfig.json", type: "file" },
    { name: "README.md", path: "/README.md", type: "file" },
  ],
};

export const mockPlan: PlanStep[] = [
  { title: "Introduce a shared Zod schema module", description: "Create src/lib/validation.ts exporting reusable schemas (Money, CustomerId, PaymentIntent) used across routes.", files: ["src/lib/validation.ts"] },
  { title: "Wrap route handlers with a validate() helper", description: "Add a small validate(schema) middleware that parses req.body/params and returns 400 with structured errors.", files: ["src/lib/validation.ts", "src/server.ts"] },
  { title: "Apply schemas to all 4 payment routes", description: "POST /payments, POST /refunds, POST /webhooks, GET /customers/:id — replace ad-hoc checks with schema parsing.", files: ["src/routes/payments.ts", "src/routes/refunds.ts", "src/routes/webhooks.ts", "src/routes/customers.ts"] },
  { title: "Update tests to cover validation errors", description: "Add 400-response cases for each route, ensuring error shape stays consistent.", files: ["tests/payments.test.ts", "tests/refunds.test.ts"] },
];

export const mockDiffs: DiffHunk[] = [
  {
    filePath: "src/lib/validation.ts", language: "ts", status: "pending",
    additions: 28, deletions: 0, riskScore: 8,
    aiCommentary: "New module — pure declarations, no runtime side effects. Schemas mirror the existing TypeScript types, so the blast radius is low.",
    before: ``,
    after: `import { z } from "zod";

export const Money = z.object({
  amount: z.number().int().positive(),
  currency: z.enum(["usd", "eur", "gbp"]),
});

export const CustomerId = z.string().regex(/^cus_[a-zA-Z0-9]{14}$/);

export const PaymentIntentInput = z.object({
  customerId: CustomerId,
  amount: Money,
  description: z.string().min(1).max(500),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const RefundInput = z.object({
  paymentId: z.string().regex(/^pi_[a-zA-Z0-9]{14}$/),
  amount: Money.optional(),
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]),
});

export function validate<T>(schema: z.ZodType<T>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "ValidationError", issues: result.error.issues });
    }
    req.validated = result.data;
    next();
  };
}`,
  },
  {
    filePath: "src/routes/payments.ts", language: "ts", status: "pending",
    additions: 9, deletions: 12, riskScore: 28,
    aiCommentary: "Replaces ad-hoc string/number checks with Zod parsing. Note the request shape now nests amount under {amount, currency} — clients sending the old flat amount will receive a 400.",
    before: `import { Router } from "express";
import { stripe } from "../lib/stripe";

const router = Router();

router.post("/payments", async (req, res) => {
  const { customerId, amount, description } = req.body;
  if (!customerId || typeof customerId !== "string") {
    return res.status(400).json({ error: "bad customerId" });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "bad amount" });
  }
  const intent = await stripe.paymentIntents.create({
    customer: customerId,
    amount,
    currency: "usd",
    description,
  });
  res.json(intent);
});

export default router;`,
    after: `import { Router } from "express";
import { stripe } from "../lib/stripe";
import { PaymentIntentInput, validate } from "../lib/validation";

const router = Router();

router.post("/payments", validate(PaymentIntentInput), async (req, res) => {
  const { customerId, amount, description, metadata } = req.validated;
  const intent = await stripe.paymentIntents.create({
    customer: customerId,
    amount: amount.amount,
    currency: amount.currency,
    description,
    metadata,
  });
  res.json(intent);
});

export default router;`,
  },
  {
    filePath: "src/routes/refunds.ts", language: "ts", status: "pending",
    additions: 7, deletions: 8, riskScore: 18,
    aiCommentary: "Adds a strict reason enum matching Stripe's documented values. Removes the implicit string passthrough that previously let unsupported reasons leak through.",
    before: `import { Router } from "express";
import { stripe } from "../lib/stripe";

const router = Router();

router.post("/refunds", async (req, res) => {
  const { paymentId, reason } = req.body;
  if (!paymentId) return res.status(400).json({ error: "missing paymentId" });
  const refund = await stripe.refunds.create({ payment_intent: paymentId, reason });
  res.json(refund);
});

export default router;`,
    after: `import { Router } from "express";
import { stripe } from "../lib/stripe";
import { RefundInput, validate } from "../lib/validation";

const router = Router();

router.post("/refunds", validate(RefundInput), async (req, res) => {
  const { paymentId, amount, reason } = req.validated;
  const refund = await stripe.refunds.create({
    payment_intent: paymentId,
    amount: amount?.amount,
    reason,
  });
  res.json(refund);
});

export default router;`,
  },
  {
    filePath: "tests/payments.test.ts", language: "ts", status: "pending",
    additions: 14, deletions: 3, riskScore: 6,
    aiCommentary: "Covers both the happy path and a 400 validation failure. Existing snapshot for the 200 case still matches.",
    before: `import { describe, it, expect } from "vitest";
import { app } from "../src/server";
import request from "supertest";

describe("POST /payments", () => {
  it("creates a payment", async () => {
    const res = await request(app).post("/payments").send({
      customerId: "cus_12345",
      amount: 1000,
    });
    expect(res.status).toBe(200);
  });
});`,
    after: `import { describe, it, expect } from "vitest";
import { app } from "../src/server";
import request from "supertest";

describe("POST /payments", () => {
  it("creates a payment with valid input", async () => {
    const res = await request(app).post("/payments").send({
      customerId: "cus_aB12cD34eF56gH",
      amount: { amount: 1000, currency: "usd" },
      description: "Test charge",
    });
    expect(res.status).toBe(200);
  });

  it("returns 400 when customerId is malformed", async () => {
    const res = await request(app).post("/payments").send({
      customerId: "not-an-id",
      amount: { amount: 1000, currency: "usd" },
      description: "x",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });
});`,
  },
];

export const mockValidations: ValidationCheck[] = [
  { name: "TypeScript", command: "tsc --noEmit", status: "pass", duration: "4.2s", output: "Found 0 errors." },
  { name: "ESLint", command: "eslint src/ --max-warnings 0", status: "pass", duration: "1.8s", output: "✔ No problems found across 24 files." },
  { name: "Unit tests", command: "vitest run", status: "pass", duration: "6.7s", output: "Test Files  8 passed (8)\nTests       42 passed (42)" },
  { name: "Integration tests", command: "vitest run --config integration.ts", status: "fail", duration: "12.4s",
    output: "FAIL tests/webhooks.test.ts > replays old signatures\n  AssertionError: expected 200 to be 401\n  → likely unrelated to this change, see issue #482" },
  { name: "Bundle size", command: "size-limit", status: "pass", duration: "2.1s", output: "dist/index.js  142 KB  (under 200 KB budget)" },
];

export const mockTrace: TraceEntry[] = [
  {
    node: "clone", label: "Repository Indexing", status: "done", duration: "2.3s",
    tokensIn: 0, tokensOut: 0,
    lines: [
      "git clone --depth=1 git@github.com:acme/payments-api.git",
      "→ Cloned 847 files, 124k LOC",
      "→ Detected stack: TypeScript, Express, Prisma, Vitest",
      "→ Indexed in 2.3s",
    ],
    reasoning: "Shallow clone is sufficient; we do not need git history for this task.",
  },
  {
    node: "ast", label: "AST Parsing + Embedding", status: "done", duration: "4.1s",
    tokensIn: 0, tokensOut: 0,
    lines: [
      "tree-sitter parse: 312 source files",
      "→ Extracted 1,204 functions, 89 classes, 412 type declarations",
      "→ Embedded into pgvector (text-embedding-3-small)",
    ],
    reasoning: "Function-level chunks give us tighter retrieval than file-level chunks for refactor tasks.",
  },
  {
    node: "context", label: "Context Retrieval", status: "done", duration: "0.8s",
    tokensIn: 1240, tokensOut: 0,
    lines: [
      "Top-14 retrieval by cosine similarity:",
      "  routes/payments.ts            0.94",
      "  routes/refunds.ts             0.92",
      "  routes/webhooks.ts            0.88",
      "  routes/customers.ts           0.85",
      "  lib/validation.ts             0.78",
      "  + 9 more under threshold 0.4",
    ],
    reasoning: "Query rewritten to: 'request body validation middleware for express handlers'.",
  },
  {
    node: "plan", label: "Edit Planning", status: "done", duration: "1.2s",
    tokensIn: 8420, tokensOut: 1812,
    lines: [
      "Plan produced 4 steps, 7 files to modify, 1 file to create",
      "Estimated diff: +312 / -47 lines",
      "Self-critique pass: 1 step reorganized for atomicity",
    ],
    reasoning: "Splitting schema creation from handler wiring keeps each commit reviewable independently.",
  },
  {
    node: "patch", label: "Patch Generation", status: "running", duration: "12.4s",
    tokensIn: 28100, tokensOut: 4910,
    lines: [
      "✓ src/lib/validation.ts        +28 -0",
      "✓ src/routes/payments.ts       +9  -12",
      "✓ src/routes/refunds.ts        +7  -8",
      "⟳ src/routes/webhooks.ts       writing…",
      "  src/routes/customers.ts      queued",
      "  tests/*.test.ts              queued",
    ],
    reasoning: "Streaming per-file. Each patch is dry-applied to verify it parses before moving on.",
  },
  { node: "validate", label: "Validation", status: "todo", lines: [] },
  { node: "review", label: "Diff Formatter + Reviewer", status: "todo", lines: [] },
];

export const mockActivity: { ts: string; node: NodeKey; runId: string; msg: string }[] = [
  { ts: "14:32:18", node: "patch", runId: "run_8af23", msg: "Wrote patch src/routes/payments.ts (+9 -12)" },
  { ts: "14:32:14", node: "patch", runId: "run_8af23", msg: "Wrote patch src/lib/validation.ts (+28 -0)" },
  { ts: "14:32:09", node: "plan", runId: "run_8af23", msg: "Plan accepted: 4 steps, 7 files" },
  { ts: "14:31:54", node: "context", runId: "run_8af23", msg: "Retrieved 14 modules, top score 0.94" },
  { ts: "14:31:46", node: "ast", runId: "run_8af23", msg: "Embedded 1,204 functions into pgvector" },
  { ts: "14:31:42", node: "clone", runId: "run_8af23", msg: "Cloned acme/payments-api · 847 files" },
  { ts: "14:18:02", node: "patch", runId: "run_92ke1", msg: "Started patch generation (12 files queued)" },
  { ts: "14:05:11", node: "plan", runId: "run_5tr88", msg: "Planning sub-goals for --json flag rollout" },
];

export const mockSystemHealth = {
  dockerPool: { active: 3, idle: 5, max: 8 },
  redisQueueDepth: 12,
  workers: { active: 4, capacity: 5 },
  apiLatencyMs: 184,
  tokensTodayIn: 412_300,
  tokensTodayOut: 84_120,
  dailyBudgetUsd: 50,
  spentTodayUsd: 14.82,
};

export const mockLintProfiles = [
  { name: "Strict TS", command: "eslint . --max-warnings 0 && tsc --noEmit --strict", files: 142, lastUsed: "2026-05-25" },
  { name: "Python (Ruff)", command: "ruff check . && mypy --strict src/", files: 89, lastUsed: "2026-05-23" },
];

export const mockApprovalPolicy = {
  name: "Default",
  minReviewers: 1,
  autoMergeRiskBelow: 25,
  requirePassingTests: true,
  blockedPaths: ["infra/", ".github/workflows/"],
};

export const mockSubGoals = [
  "Identify all Express route handlers without request validation",
  "Choose Zod as the schema library (matches existing tsconfig.strict)",
  "Create a shared validate() middleware in src/lib/validation.ts",
  "Apply schemas incrementally per route, preserving response shape",
  "Add 400-response test cases for each affected route",
];

export const mockMetrics = {
  before: { testPassRate: 94.2, typeErrors: 12, lintWarnings: 34, bundleKb: 284 },
  after:  { testPassRate: 97.8, typeErrors: 0,  lintWarnings: 11, bundleKb: 281 },
};

// Analytics
export const mockSuccessRate = [
  { day: "Mon", success: 8, failed: 1 },
  { day: "Tue", success: 11, failed: 0 },
  { day: "Wed", success: 9, failed: 2 },
  { day: "Thu", success: 14, failed: 1 },
  { day: "Fri", success: 12, failed: 1 },
  { day: "Sat", success: 4, failed: 0 },
  { day: "Sun", success: 7, failed: 2 },
];

export const mockHotFiles = [
  { file: "src/routes/payments.ts", touches: 18 },
  { file: "src/lib/validation.ts", touches: 14 },
  { file: "src/server.ts", touches: 11 },
  { file: "src/routes/webhooks.ts", touches: 9 },
  { file: "src/routes/customers.ts", touches: 8 },
  { file: "tests/payments.test.ts", touches: 7 },
  { file: "src/lib/db.ts", touches: 6 },
  { file: "src/middleware/auth.ts", touches: 5 },
];

export const mockTokensByType = [
  { type: "Refactor", tokens: 142_300 },
  { type: "Feature", tokens: 98_400 },
  { type: "Security", tokens: 64_100 },
  { type: "Docs", tokens: 41_800 },
];

export function statusColor(status: RunStatus) {
  switch (status) {
    case "planning": return "status-planning";
    case "running": return "status-running";
    case "needs_review": return "status-review";
    case "merged": return "status-merged";
    case "failed": return "status-failed";
  }
}
