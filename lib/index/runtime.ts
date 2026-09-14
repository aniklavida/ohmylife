// Where a life and its index live on disk — resolved once, here, so the MCP
// server (mcp/runtime.ts re-exports these), the CLI
// (scripts/rebuild-index.ts) and the website (app/page.tsx) never disagree
// about a life's location. Moved out of mcp/runtime.ts so the website can
// read real data through lib/ — the only code allowed to touch disk
// (docs/STRUCTURE.md) — rather than depending on the MCP layer, which
// docs/ARCHITECTURE.md draws as a separate front door onto the same core.
import fs from "node:fs";
import path from "node:path";
import { rebuildIndex } from "./build";

// Renamed from OhMyLife to WeAllHateLife on 15 Sep 2026 (CHANGELOG.md). Nobody
// had released data under the old names yet, but the fallback below exists so
// that anyone who already ran `dev:sample` or set an env var before the
// rename lands on their own machine keeps working, with a one-time notice
// telling them to move on.
const warnedLegacyEnv = new Set<string>();

function warnLegacyEnv(oldName: string, newName: string): void {
  if (warnedLegacyEnv.has(oldName)) return;
  warnedLegacyEnv.add(oldName);
  console.warn(
    `[weallhatelife] ${oldName} is deprecated and will stop being read in a future release. Use ${newName} instead.`,
  );
}

/** Reads `currentName`, falling back to `legacyName` with a one-time deprecation notice. */
function readEnvWithLegacyFallback(currentName: string, legacyName: string): string | undefined {
  const current = process.env[currentName];
  if (current !== undefined) return current;
  const legacy = process.env[legacyName];
  if (legacy !== undefined) {
    warnLegacyEnv(legacyName, currentName);
    return legacy;
  }
  return undefined;
}

let warnedLegacyStateFolder = false;

function warnLegacyStateFolder(oldPath: string, newPath: string): void {
  if (warnedLegacyStateFolder) return;
  warnedLegacyStateFolder = true;
  console.warn(
    `[weallhatelife] Found ${oldPath} from before the WeAllHateLife rename. Reading it for now, but it will stop being read in a future release — remove it, or set WEALLHATELIFE_DB, to move to ${newPath}.`,
  );
}

// The `turbopackIgnore` comments tell Turbopack this is a genuinely dynamic,
// user-configured path (an env var, defaulting to a path outside the
// project the bundler could trace anyway) rather than something it should
// try to statically resolve and bundle every file reachable from — see
// Next's own suggested fix for the "dynamic filesystem access" build
// warning this otherwise produces now that a server component
// (app/page.tsx) calls it, not only the MCP server.
export function resolveLifeRoot(): string {
  const value = readEnvWithLegacyFallback("WEALLHATELIFE_LIFE", "OHMYLIFE_LIFE") ?? "./life";
  return path.resolve(/* turbopackIgnore: true */ value);
}

export function resolveDbPath(): string {
  const fromEnv = readEnvWithLegacyFallback("WEALLHATELIFE_DB", "OHMYLIFE_DB");
  if (fromEnv !== undefined) {
    return path.resolve(/* turbopackIgnore: true */ fromEnv);
  }

  const defaultPath = "./.weallhatelife/index.db";
  const legacyDefaultDir = "./.ohmylife";
  // No env var either way — if a pre-rename state folder exists on disk and
  // the new one does not, keep reading the old one rather than silently
  // starting a second, empty index next to it.
  if (!fs.existsSync("./.weallhatelife") && fs.existsSync(legacyDefaultDir)) {
    const legacyDefaultPath = "./.ohmylife/index.db";
    warnLegacyStateFolder(legacyDefaultDir, "./.weallhatelife");
    return path.resolve(/* turbopackIgnore: true */ legacyDefaultPath);
  }

  return path.resolve(/* turbopackIgnore: true */ defaultPath);
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
