// Typed edges between entries.
//
// The edge itself — `{ type, target }` — lives in the file that declares it
// (schema.ts). Only that one direction is ever written to disk: a memory
// names the person in it, not the other way around. Resolving both
// directions of the graph is the rebuildable index's job (lib/index/links.ts),
// because a computed reverse edge is exactly the kind of derived state that
// must never be written back to a file — see docs/ARCHITECTURE.md §1.
import type { Entry, EntryLink } from "./schema";

export function outgoingLinks(entry: Pick<Entry, "links">): EntryLink[] {
  return entry.links;
}

export function linksTo(entry: Pick<Entry, "links">, targetId: string): boolean {
  return entry.links.some((link) => link.target === targetId);
}
