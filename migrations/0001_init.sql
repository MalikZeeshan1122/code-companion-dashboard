-- Codex Ops — initial schema for persisted agent runs.
-- The full RealRun object is stored as JSON in `data` for forward compatibility.

CREATE TABLE IF NOT EXISTS runs (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  data       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs (created_at DESC);
