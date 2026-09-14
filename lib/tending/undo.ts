// Reversing one tending line — the human action behind
// `app/api/tending/undo/` (docs/STRUCTURE.md), and the only place in this
// product an entry's previous state is restored on purpose. This is not an
// agent tool: it is triggered by a person reading their own tending record
// and clicking undo on one line (docs/ARCHITECTURE.md §4's short list of
// human actions), so it carries no `reason` argument the way an MCP write
// does — the record already says why the agent acted, and undoing needs no
// justification beyond "a person decided this line was wrong."
//
// What "undo" means depends on the bucket a line belongs to:
//   - "filed"       → archive the entry `create_entry` filed. There is still
//                      no delete path anywhere in this product; archiving is
//                      exactly as reversible undoing a filing should be.
//   - "corrected"   → restore the exact previous field values captured on
//                      the line itself (`revert`, written by
//                      mcp/tools/update-entry.ts). A line written before
//                      this existed has no `revert` and is reported as
//                      unable to be undone automatically, rather than
//                      guessed at.
//   - "left_alone"  → nothing was ever changed, so there is nothing to
//                      restore. Reported as such rather than silently
//                      doing nothing.
import { archiveEntry } from "../entry/archive";
import { readEntry } from "../entry/read";
import type { EntryInput } from "../entry/schema";
import { writeEntry } from "../entry/write";
import { markTendingUndone, readTendingForDate } from "./record";

export interface UndoResult {
  ok: boolean;
  message: string;
}

function dateFromRelativePath(relativePath: string): string | undefined {
  return relativePath.match(/(\d{4}-\d{2}-\d{2})\.md$/)?.[1];
}

/**
 * Reverses the tending line identified by `relativePath` (e.g.
 * "tended/2026-09-12.md") and `at` (the line's own timestamp, unique within
 * that file). Idempotent against a repeat click: undoing an already-undone
 * line reports that plainly instead of archiving or reverting twice.
 */
export function undoTendingRecord(lifeRoot: string, relativePath: string, at: string): UndoResult {
  const date = dateFromRelativePath(relativePath);
  if (!date) {
    return { ok: false, message: "That is not a recognised tending record." };
  }

  const record = readTendingForDate(lifeRoot, date).find((line) => line.at === at);
  if (!record) {
    return { ok: false, message: "No tending line was found at that time." };
  }
  if (record.undoneAt) {
    return { ok: false, message: "This line has already been undone." };
  }

  if (record.bucket === "left_alone") {
    return { ok: false, message: "Nothing was changed here — there is nothing to undo." };
  }

  if (!record.entryId) {
    return { ok: false, message: "This line has no entry to undo." };
  }

  if (record.bucket === "filed") {
    try {
      archiveEntry(lifeRoot, record.entryId);
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
    markTendingUndone(lifeRoot, relativePath, at);
    return { ok: true, message: `"${record.entryId}" has been archived.` };
  }

  // bucket === "corrected"
  if (!record.revert) {
    return {
      ok: false,
      message:
        "This correction was recorded before undo support existed, so it cannot be reversed automatically.",
    };
  }

  const existing = readEntry(lifeRoot, record.entryId);
  if (!existing) {
    return { ok: false, message: `No entry with id "${record.entryId}" exists anymore.` };
  }

  const restored: Record<string, unknown> = { ...existing.entry };
  for (const [key, value] of Object.entries(record.revert)) {
    if (value === null) delete restored[key];
    else restored[key] = value;
  }

  writeEntry(lifeRoot, restored as EntryInput);
  markTendingUndone(lifeRoot, relativePath, at);
  return { ok: true, message: `The previous value has been restored on "${record.entryId}".` };
}
