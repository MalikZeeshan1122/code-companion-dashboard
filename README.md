# Codex Ops — Coding Agent Dashboard

> Plan, preview, and review repo-level coding agent runs.

Codex Ops is a dashboard for orchestrating, monitoring, and reviewing AI coding-agent
runs across GitHub repositories. It models the full operator workflow of a multi-agent
(LangGraph-style) pipeline — from cloning and indexing a repo, through planning and
patching, to validation, human diff review, and opening a pull request.

> **Two layers in one app:**
>
> 1. **Live agent (real).** Creating a task on **`/new`** calls a real backend
>    (TanStack Start server functions) that uses **OpenAI** to plan the change and
>    propose per-file patches. The run is **persisted** (Cloudflare D1 in production,
>    in-memory in local dev) and replayed on a live, animated pipeline at
>    **`/live/$runId`**, ending with a simulated "open PR" action. Without an
>    `OPENAI_API_KEY`, a deterministic mock agent keeps the whole flow working.
> 2. **Showcase UI (mock).** The dashboard, analytics, prompt studio, architecture
>    view, and the sample runs under `/runs/...` are still driven by rich static data
>    in [`src/lib/mockData.ts`](src/lib/mockData.ts) for demo breadth.

## The Agent Pipeline

The UI models a 7-stage pipeline:

1. **Clone & index** the target repository
2. **Retrieve context** (RAG)
3. **Plan** the edits
4. **Write patches** with a planner ↔ critic loop
5. **Validate** (lint, tests, types — in a sandboxed/Docker environment)
6. **Review** diffs (human-in-the-loop)
7. **Commit, push, and open a PR**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5.8 |
| Full-stack / SSR | [TanStack Start](https://tanstack.com/start) |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack React Query |
| Build | Vite 7 |
| Deployment | Cloudflare Workers (Wrangler) |
| Package manager | [Bun](https://bun.sh) |
| Styling | Tailwind CSS 4 (VS Code–like dark theme) |
| UI components | shadcn/ui (new-york) on Radix UI |
| Icons | Lucide React |
| Forms / validation | react-hook-form + zod |
| Charts | Recharts |
| Lint / format | ESLint 9 + Prettier |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (the committed lockfile is `bun.lock`), or Node 20+/npm — both work.

### Install

```bash
bun install      # or: npm install
```

### Develop

```bash
bun run dev      # or: npm run dev
```

The app runs on the Vite dev server (it prints the local URL on start).

### Configuration (OpenAI + persistence)

The live agent reads an OpenAI key **server-side only**. Copy `.env.example` to
`.env` and set your key:

```bash
# .env  (gitignored)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # optional
```

`vite.config.ts` loads `.env` into `process.env` for local dev, so the key never
reaches the client bundle. **No key?** The agent automatically falls back to a
deterministic mock so every screen still works.

In production on Cloudflare Workers, set the key as a secret and (optionally) enable
the D1 database for durable run storage:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler d1 create codex-ops        # then paste the id into wrangler.jsonc
npx wrangler d1 migrations apply codex-ops --remote
```

### Build & Preview

```bash
bun run build      # production build
bun run preview    # preview the production build
bun run build:dev  # build in development mode
```

### Lint & Format

```bash
bun run lint       # eslint .
bun run format     # prettier --write .
```

## Project Structure

```
code-companion-dashboard/
├── src/
│   ├── routes/                 # File-based TanStack Router pages
│   │   ├── index.tsx           # /            Command Center dashboard
│   │   ├── new.tsx             # /new         Create a new agent task
│   │   ├── history.tsx         # /history     Run history table
│   │   ├── analytics.tsx       # /analytics   Success rate, tokens, hot files
│   │   ├── agents.tsx          # /agents      Pipeline architecture diagram
│   │   ├── prompts.tsx         # /prompts     Prompt Studio per node
│   │   ├── settings.tsx        # /settings    Profiles, policies, webhooks, budget
│   │   ├── live.$runId.tsx     # /live/:id    REAL run: animated pipeline + AI plan
│   │   ├── runs.$runId.tsx     # /runs/:id    Sample run detail (mock data)
│   │   ├── runs.$runId.review.tsx  # /runs/:id/review  Per-file diff review (mock)
│   │   └── runs.$runId.push.tsx    # /runs/:id/push    Commit → push → PR (mock)
│   ├── components/             # App components
│   │   └── ui/                 # shadcn/ui primitives
│   ├── hooks/                  # Custom hooks (e.g. use-mobile)
│   ├── server/                 # SERVER-ONLY (import-protected; never client)
│   │   ├── agent.ts            # OpenAI agent (plan + patches) with mock fallback
│   │   ├── store.ts            # Run persistence: D1 (prod) / in-memory (dev)
│   │   └── env.ts              # Portable env/binding access
│   ├── lib/
│   │   ├── agentRuns.ts        # Server FUNCTIONS (createRun, getRun, list, openPr)
│   │   ├── realRun.ts          # Shared RealRun types + helpers
│   │   ├── mockData.ts         # Demo data for the showcase UI
│   │   ├── utils.ts            # cn() helper
│   │   ├── error-capture.ts    # SSR error capture
│   │   └── error-page.ts       # Branded 500 page
│   ├── router.tsx              # Router factory + QueryClient
│   ├── routeTree.gen.ts        # Auto-generated route tree (do not edit)
│   ├── start.ts                # TanStack Start instance + error middleware
│   ├── server.ts               # Cloudflare Worker entry (stashes env, SSR)
│   └── styles.css              # Tailwind + theme tokens
├── migrations/                 # Cloudflare D1 schema
│   └── 0001_init.sql
├── .env.example                # OPENAI_API_KEY / OPENAI_MODEL template
├── components.json             # shadcn/ui config
├── eslint.config.js
├── vite.config.ts              # + loads .env into process.env for dev
├── wrangler.jsonc              # Cloudflare Workers config (+ D1 / secrets notes)
├── tsconfig.json
└── package.json
```

## How the live agent works

```
/new  ──POST createRunFn──►  runAgent() ──► OpenAI (structured JSON plan + patches)
                                   │                       │ (mock fallback if no key)
                                   ▼                       ▼
                            assemble RealRun ──► store.put() ──► D1 / in-memory
                                   │
        navigate /live/$runId  ◄───┘
                                   │
   loader getRunFn() ──► animated pipeline (clone→index→context→plan→patch→validate→review)
                                   │
        review patches ──► openPrFn() ──► status: merged + PR url (persisted)
```

Key design choices:

- **Server functions, not loose API routes.** `createServerFn` keeps calls type-safe
  end-to-end and runs identically in dev (Node) and prod (Workers).
- **Import safety.** Server-only code lives in `src/server/**` (blocked from the client
  by TanStack Start import protection). The server *functions* in `src/lib/agentRuns.ts`
  are client-importable and load `src/server/**` lazily inside handlers.
- **Robust persistence.** `getStore()` uses Cloudflare D1 when the `DB` binding exists,
  otherwise an in-memory map — so it works everywhere without setup.
- **Graceful degradation.** Missing/invalid API key → deterministic mock agent, so the
  product is always demoable.

## Features

The **New Task → Live run → PR** flow is backed by the real agent + persistence; the
remaining screens are a mock-data showcase.

- **New Task (`/new`)** — _real:_ submits to the OpenAI-backed agent (with live
  sub-goal decomposition), persists the run, and routes to the live view.
- **Live Run (`/live/:runId`)** — _real:_ animated 7-stage pipeline that streams the
  agent's log lines, then reveals the AI summary, plan (with rationale), per-file diffs,
  validation results, and an "Approve & open PR" action — all from persisted data.
- **Command Center (`/`)** — active run stats, system health (Docker pool, Redis queue,
  workers, budget), resource sparklines, global event stream, and intelligence alerts.
- **Run Detail (`/runs/:runId`)** — sample run inspector: trace, indexing, RAG context,
  edit plan + critic loop, patch diffs, validation results, and before/after impact.
- **Review (`/runs/:runId/review`)** — per-file approve/reject with unified/split diffs
  and comments.
- **Commit & Push (`/runs/:runId/push`)** — simulated git pipeline: commit → push → PR.
- **History (`/history`)** — _real:_ your persisted agent runs (with model + cost) at the
  top, plus the sample runs below.
- **Analytics (`/analytics`)** — success rate, average duration, spend, tokens by task
  type, and a hot-file heatmap.
- **Architecture (`/agents`)** — LangGraph state-graph diagram with per-node config.
- **Prompt Studio (`/prompts`)** — edit prompts per pipeline node with versions and win
  rates.
- **Settings (`/settings`)** — profiles, policies, agent prompts, webhooks, and budget.
- **Global UX** — dark-first theme, ⌘K command palette, notification bell, responsive
  sidebar.

## Deployment

The app is configured for **Cloudflare Workers**. The Worker entry is
[`src/server.ts`](src/server.ts) and the configuration lives in
[`wrangler.jsonc`](wrangler.jsonc). Build with `bun run build`, then deploy with Wrangler:

```bash
bunx wrangler deploy
```

## Roadmap

Done: real OpenAI agent, persisted runs (D1/in-memory), and a live animated run view.
Natural next steps:

- **Real GitHub integration** — OAuth, actual repo clone/index, and PR creation via the
  GitHub API (replace the simulated `openPrFn`).
- **True token streaming** — stream the OpenAI response (SSE/Durable Object) so patches
  appear as they generate, instead of the client-side animated reveal.
- **RAG over real code** — embeddings + vector search (e.g. pgvector / Vectorize) feeding
  the planner, instead of synthesized context.
- **Sandboxed validation** — actually run lint/test/typecheck in a container and report
  real results.
- **Port the mock screens** (analytics, command center) onto persisted run data.
- **Automated tests** (none currently exist).

## Contributor

**Muhammad Zeeshan** — [LinkedIn](https://www.linkedin.com/in/muhammadzeeshan007/)

## License

Private / unlicensed.
