// Where a life and its index live on disk — resolved once, here, so the MCP
// server (mcp/runtime.ts re-exports these), the CLI
// (scripts/rebuild-index.ts) and the website (app/page.tsx) never disagree
// about a life's location. Moved out of mcp/runtime.ts so the website can
// read real data through lib/ — the only code allowed to touch disk
// (docs/STRUCTURE.md) — rather than depending on the MCP layer, which
// docs/ARCHITECTURE.md draws as a separate front door onto the same core.
import path from "node:path";
import { rebuildIndex } from "./build";

// The `turbopackIgnore` comments tell Turbopack this is a genuinely dynamic,
// user-configured path (an env var, defaulting to a path outside the
// project the bundler could trace anyway) rather than something it should
// try to statically resolve and bundle every file reachable from — see
// Next's own suggested fix for the "dynamic filesystem access" build
// warning this otherwise produces now that a server component
// (app/page.tsx) calls it, not only the MCP server.
export function resolveLifeRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.OHMYLIFE_LIFE ?? "./life");
}

export function resolveDbPath(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.OHMYLIFE_DB ?? "./.ohmylife/index.db");
}

/**
 * Rebuilds the index from the files and returns its path. Called at the
 * start of every read — MCP tool or website page — rather than trusted from
 * a previous call. A personal life is small enough that a full rebuild per
 * call is cheap, and it is the only way a caller can be sure it is not
 * answering from a database that predates a file someone edited by hand.
 * See docs/SPEC.md §8 — the index is disposable, so treating it as
 * disposable on every call is the honest default until this needs to be
 * faster.
 */
export function ensureFreshIndex(lifeRoot: string, dbPath: string): string {
  rebuildIndex(lifeRoot, dbPath);
  return dbPath;
}
