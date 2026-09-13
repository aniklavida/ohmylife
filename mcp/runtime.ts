// Shared plumbing for the MCP tool layer — never touches disk itself beyond
// what `lib/index/build.ts` already does. Every tool file imports from here
// instead of resolving paths or rebuilding the index its own way, so the
// thirteen tool files stay one file each and agree on where a life lives.
import { readEntry } from "../lib/entry/read";
import type { Area } from "../lib/entry/schema";

// Path resolution lives in lib/index/runtime.ts, not here, so the website
// (app/page.tsx) can read a life through lib/ without depending on the MCP
// layer. Re-exported so this file's twelve existing importers are untouched.
export { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../lib/index/runtime";

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
