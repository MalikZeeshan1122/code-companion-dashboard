// Persistence for real agent runs.
//
// Backend is auto-selected at runtime:
//   - Cloudflare D1 (binding `DB`) when deployed to Workers — durable.
//   - An in-memory Map otherwise (local `vite dev`) — persists for the life of
//     the dev server process, which is enough to demo create -> list -> open.
//
// The store keeps the run serialized as JSON in a single column so the schema
// stays stable as the RealRun shape evolves.

import type { RealRun } from "@/lib/realRun";
import { getBinding } from "./env";

export interface RunStore {
  put(run: RealRun): Promise<void>;
  get(id: string): Promise<RealRun | undefined>;
  list(limit?: number): Promise<RealRun[]>;
  delete(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-memory backend (dev). Pinned to globalThis so HMR reloads don't wipe it.
// ---------------------------------------------------------------------------

function memMap(): Map<string, RealRun> {
  const g = globalThis as unknown as { __RUN_STORE?: Map<string, RealRun> };
  if (!g.__RUN_STORE) g.__RUN_STORE = new Map();
  return g.__RUN_STORE;
}

const memoryStore: RunStore = {
  async put(run) {
    memMap().set(run.id, run);
  },
  async get(id) {
    return memMap().get(id);
  },
  async list(limit = 100) {
    return Array.from(memMap().values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
  async delete(id) {
    memMap().delete(id);
  },
};

// ---------------------------------------------------------------------------
// Cloudflare D1 backend (production).
// ---------------------------------------------------------------------------

interface D1Result<T = unknown> {
  results?: T[];
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(col?: string): Promise<T | null>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<unknown>;
}

let schemaReady: Promise<void> | undefined;

function ensureSchema(db: D1Database): Promise<void> {
  if (!schemaReady) {
    schemaReady = db
      .exec(
        "CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL);",
      )
      .then(() => undefined)
      .catch((err) => {
        schemaReady = undefined;
        throw err;
      });
  }
  return schemaReady;
}

function d1Store(db: D1Database): RunStore {
  return {
    async put(run) {
      await ensureSchema(db);
      await db
        .prepare("INSERT OR REPLACE INTO runs (id, created_at, data) VALUES (?, ?, ?)")
        .bind(run.id, run.createdAt, JSON.stringify(run))
        .run();
    },
    async get(id) {
      await ensureSchema(db);
      const row = await db
        .prepare("SELECT data FROM runs WHERE id = ?")
        .bind(id)
        .first<string>("data");
      return row ? (JSON.parse(row) as RealRun) : undefined;
    },
    async list(limit = 100) {
      await ensureSchema(db);
      const { results } = await db
        .prepare("SELECT data FROM runs ORDER BY created_at DESC LIMIT ?")
        .bind(limit)
        .all<{ data: string }>();
      return (results ?? []).map((r) => JSON.parse(r.data) as RealRun);
    },
    async delete(id) {
      await ensureSchema(db);
      await db.prepare("DELETE FROM runs WHERE id = ?").bind(id).run();
    },
  };
}

export function getStore(): RunStore {
  const db = getBinding<D1Database>("DB");
  if (db && typeof db.prepare === "function") {
    return d1Store(db);
  }
  return memoryStore;
}
