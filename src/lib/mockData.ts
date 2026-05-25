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
}

export interface FileNode {
  name: string;
  path: string;
  type: "dir" | "file";
  children?: FileNode[];
  relevance?: number; // 0-1 for context retrieval highlight
}

export interface DiffHunk {
  filePath: string;
  language: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
  status: "pending" | "approved" | "rejected";
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

export const STATUS_LABEL: Record<RunStatus, string> = {
  planning: "Planning",
  running: "Patching",
  needs_review: "Needs Review",
  merged: "Merged",
  failed: "Failed",
};

export const mockRuns: AgentRun[] = [
  {
    id: "run_8af23",
    repo: "acme/payments-api",
    branch: "main",
    task: "Add input validation to all API routes using Zod",
    status: "needs_review",
    createdAt: "2026-05-25T14:32:00Z",
    author: "agent-v2",
    filesChanged: 7,
    additions: 184,
    deletions: 23,
  },
  {
    id: "run_92ke1",
    repo: "acme/dashboard-web",
    branch: "feat/auth-refactor",
    task: "Migrate auth middleware from JWT cookies to Bearer tokens",
    status: "running",
    createdAt: "2026-05-25T14:18:00Z",
    author: "agent-v2",
    filesChanged: 12,
    additions: 0,
    deletions: 0,
  },
  {
    id: "run_5tr88",
    repo: "acme/cli-tools",
    branch: "main",
    task: "Add --json output flag to all subcommands",
    status: "planning",
    createdAt: "2026-05-25T14:05:00Z",
    author: "user@acme.dev",
    filesChanged: 0,
    additions: 0,
    deletions: 0,
  },
  {
    id: "run_2bn10",
    repo: "acme/billing-svc",
    branch: "main",
    task: "Replace deprecated Stripe API v2 calls with v3 equivalents",
    status: "merged",
    createdAt: "2026-05-24T22:11:00Z",
    author: "agent-v2",
    filesChanged: 4,
    additions: 67,
    deletions: 58,
  },
  {
    id: "run_71xqq",
    repo: "acme/data-pipeline",
    branch: "main",
    task: "Convert sync DB calls in workers to async with connection pool",
    status: "failed",
    createdAt: "2026-05-24T18:44:00Z",
    author: "agent-v2",
    filesChanged: 3,
    additions: 41,
    deletions: 38,
  },
  {
    id: "run_44klp",
    repo: "acme/marketing-site",
    branch: "main",
    task: "Extract hardcoded copy into i18n translation files",
    status: "merged",
    createdAt: "2026-05-23T11:02:00Z",
    author: "user@acme.dev",
    filesChanged: 22,
    additions: 412,
    deletions: 198,
  },
];

export const mockFileTree: FileNode = {
  name: "payments-api",
  path: "/",
  type: "dir",
  children: [
    {
      name: "src",
      path: "/src",
      type: "dir",
      children: [
        {
          name: "routes",
          path: "/src/routes",
          type: "dir",
          children: [
            { name: "payments.ts", path: "/src/routes/payments.ts", type: "file", relevance: 0.95 },
            { name: "refunds.ts", path: "/src/routes/refunds.ts", type: "file", relevance: 0.92 },
            { name: "webhooks.ts", path: "/src/routes/webhooks.ts", type: "file", relevance: 0.88 },
            { name: "customers.ts", path: "/src/routes/customers.ts", type: "file", relevance: 0.85 },
            { name: "health.ts", path: "/src/routes/health.ts", type: "file", relevance: 0.1 },
          ],
        },
        {
          name: "lib",
          path: "/src/lib",
          type: "dir",
          children: [
            { name: "db.ts", path: "/src/lib/db.ts", type: "file", relevance: 0.2 },
            { name: "stripe.ts", path: "/src/lib/stripe.ts", type: "file", relevance: 0.3 },
            { name: "validation.ts", path: "/src/lib/validation.ts", type: "file", relevance: 0.78 },
          ],
        },
        { name: "server.ts", path: "/src/server.ts", type: "file", relevance: 0.4 },
        { name: "types.ts", path: "/src/types.ts", type: "file", relevance: 0.5 },
      ],
    },
    {
      name: "tests",
      path: "/tests",
      type: "dir",
      children: [
        { name: "payments.test.ts", path: "/tests/payments.test.ts", type: "file", relevance: 0.6 },
        { name: "refunds.test.ts", path: "/tests/refunds.test.ts", type: "file", relevance: 0.55 },
      ],
    },
    { name: "package.json", path: "/package.json", type: "file", relevance: 0.3 },
    { name: "tsconfig.json", path: "/tsconfig.json", type: "file" },
    { name: "README.md", path: "/README.md", type: "file" },
  ],
};

export const mockPlan: PlanStep[] = [
  {
    title: "Introduce a shared Zod schema module",
    description:
      "Create src/lib/validation.ts exporting reusable schemas (Money, CustomerId, PaymentIntent) used across routes.",
    files: ["src/lib/validation.ts"],
  },
  {
    title: "Wrap route handlers with a validate() helper",
    description:
      "Add a small validate(schema) middleware that parses req.body/params and returns 400 with structured errors.",
    files: ["src/lib/validation.ts", "src/server.ts"],
  },
  {
    title: "Apply schemas to all 4 payment routes",
    description:
      "POST /payments, POST /refunds, POST /webhooks, GET /customers/:id — replace ad-hoc checks with schema parsing.",
    files: [
      "src/routes/payments.ts",
      "src/routes/refunds.ts",
      "src/routes/webhooks.ts",
      "src/routes/customers.ts",
    ],
  },
  {
    title: "Update tests to cover validation errors",
    description:
      "Add 400-response cases for each route, ensuring error shape stays consistent.",
    files: ["tests/payments.test.ts", "tests/refunds.test.ts"],
  },
];

export const mockDiffs: DiffHunk[] = [
  {
    filePath: "src/lib/validation.ts",
    language: "ts",
    status: "pending",
    additions: 28,
    deletions: 0,
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
    filePath: "src/routes/payments.ts",
    language: "ts",
    status: "pending",
    additions: 9,
    deletions: 12,
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
    filePath: "src/routes/refunds.ts",
    language: "ts",
    status: "pending",
    additions: 7,
    deletions: 8,
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
    filePath: "tests/payments.test.ts",
    language: "ts",
    status: "pending",
    additions: 14,
    deletions: 3,
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
  {
    name: "TypeScript",
    command: "tsc --noEmit",
    status: "pass",
    duration: "4.2s",
    output: "Found 0 errors.",
  },
  {
    name: "ESLint",
    command: "eslint src/ --max-warnings 0",
    status: "pass",
    duration: "1.8s",
    output: "✔ No problems found across 24 files.",
  },
  {
    name: "Unit tests",
    command: "vitest run",
    status: "pass",
    duration: "6.7s",
    output: "Test Files  8 passed (8)\nTests       42 passed (42)",
  },
  {
    name: "Integration tests",
    command: "vitest run --config integration.ts",
    status: "fail",
    duration: "12.4s",
    output:
      "FAIL tests/webhooks.test.ts > replays old signatures\n  AssertionError: expected 200 to be 401\n  → likely unrelated to this change, see issue #482",
  },
  {
    name: "Bundle size",
    command: "size-limit",
    status: "pass",
    duration: "2.1s",
    output: "dist/index.js  142 KB  (under 200 KB budget)",
  },
];

export function statusColor(status: RunStatus) {
  switch (status) {
    case "planning":
      return "status-planning";
    case "running":
      return "status-running";
    case "needs_review":
      return "status-review";
    case "merged":
      return "status-merged";
    case "failed":
      return "status-failed";
  }
}
