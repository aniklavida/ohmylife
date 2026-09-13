// Archiving — the only removal that exists anywhere in this product.
//
// There is no `delete.ts`. An agent destroying a memory is unrecoverable and
// unforgivable (docs/SPEC.md §8), so the only reliable defence is to make
// deletion unrepresentable at the core, not merely disallowed at the MCP
// layer. Archiving sets `archived_at`; restoring clears it. Nothing is ever
// removed from disk by either operation.
//
// Requiring a `reason` and writing the tending record from it is the MCP
// server's job (docs/ROADMAP.md, step 2) — this function only guarantees
// that whatever calls it cannot lose the entry.
import { readEntry } from "./read";
import { type Entry, type EntryInput } from "./schema";
import { writeEntry, type WriteEntryResult } from "./write";

export function isArchived(entry: Pick<Entry, "archived_at">): boolean {
  return entry.archived_at !== undefined;
}

export function archiveEntry(lifeRoot: string, id: string): WriteEntryResult {
  const existing = readEntry(lifeRoot, id);
  if (!existing) {
    throw new Error(`Cannot archive "${id}": no entry with that id exists.`);
  }
  return writeEntry(lifeRoot, {
    ...(existing.entry as EntryInput),
    archived_at: new Date().toISOString(),
  });
}

export function restoreEntry(lifeRoot: string, id: string): WriteEntryResult {
  const existing = readEntry(lifeRoot, id);
  if (!existing) {
    throw new Error(`Cannot restore "${id}": no entry with that id exists.`);
  }
  const { archived_at: _archivedAt, ...rest } = existing.entry as EntryInput & {
    archived_at?: string;
  };
  return writeEntry(lifeRoot, rest as EntryInput);
}
