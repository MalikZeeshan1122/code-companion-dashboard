// Portable access to environment variables / bindings across runtimes.
//
// In production on Cloudflare Workers, `src/server.ts` stashes the Worker `env`
// object on `globalThis.__CF_ENV` at the start of every request, so secrets and
// bindings (e.g. DB, OPENAI_API_KEY) are reachable from server functions.
//
// In local `vite dev` (Node), the Cloudflare plugin is build-only, so there is
// no Worker env — we fall back to `process.env` (populated from `.env` / shell).

type EnvBag = Record<string, unknown>;

function cfEnv(): EnvBag | undefined {
  return (globalThis as unknown as { __CF_ENV?: EnvBag }).__CF_ENV;
}

export function getEnv(key: string): string | undefined {
  const fromCf = cfEnv()?.[key];
  if (typeof fromCf === "string" && fromCf.length > 0) return fromCf;

  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

/** Returns a non-string binding (e.g. a D1 database) from the Worker env. */
export function getBinding<T = unknown>(key: string): T | undefined {
  const value = cfEnv()?.[key];
  return value as T | undefined;
}
