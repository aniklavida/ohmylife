// Shared plumbing for the MCP tool layer — never touches disk itself beyond
// what `lib/index/build.ts` already does. Every tool file imports from here
// instead of resolving paths or rebuilding the index its own way, so the
// thirteen tool files stay one file each and agree on where a life lives.
import path from "node:path";
import { readEntry } from "../lib/entry/read";
import { rebuildIndex } from "../lib/index/build";
import type { Area } from "../lib/entry/schema";

/** Life root and index path, resolved the same way `scripts/rebuild-index.ts`
 * resolves them, so the server and the CLI never disagree. */
export function resolveLifeRoot(): string {
  return path.resolve(process.env.OHMYLIFE_LIFE ?? "./life");
}

export function resolveDbPath(): string {
  return path.resolve(process.env.OHMYLIFE_DB ?? "./.ohmylife/index.db");
}

/**
 * Rebuilds the index from the files and returns its path. Called at the
 * start of every tool — read or write — rather than trusted from a previous
 * call. A personal life is small enough that a full rebuild per call is
 * cheap, and it is the only way a read tool can be sure it is not answering
 * from a database that predates a file someone edited by hand. See
 * docs/SPEC.md §8 — the index is disposable, so treating it as disposable
 * on every call is the honest default until this needs to be faster.
 */
export function ensureFreshIndex(lifeRoot: string, dbPath: string): string {
  rebuildIndex(lifeRoot, dbPath);
  return dbPath;
}

/** Turns a title into an id in the shape `lib/entry/schema.ts` requires:
 * lowercase, hyphen-separated, no leading/trailing hyphen. */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics left by NFKD
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : "entry";
}

/** The given id if free, otherwise the first `<id>-2`, `<id>-3`, … that is. */
export function uniqueId(lifeRoot: string, candidate: string): string {
  if (!readEntry(lifeRoot, candidate)) return candidate;
  let n = 2;
  while (readEntry(lifeRoot, `${candidate}-${n}`)) n += 1;
  return `${candidate}-${n}`;
}

export class ToolInputError extends Error {}

/** A plain, non-empty area check shared by every tool that takes one. */
export function assertKnownArea(area: string, AREAS: readonly Area[]): asserts area is Area {
  if (!(AREAS as readonly string[]).includes(area)) {
    throw new ToolInputError(`Unknown area "${area}". Known areas: ${AREAS.join(", ")}.`);
  }
}
