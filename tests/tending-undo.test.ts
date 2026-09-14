// Reversing a tending line (docs/SPEC.md §11, "every line is reversible from
// the line itself") — the one place this product ever restores a previous
// state on purpose, rather than only ever moving forward.
import { afterEach, describe, expect, it } from "vitest";
import { readEntry } from "../lib/entry/read";
import { isArchived } from "../lib/entry/archive";
import { writeEntry } from "../lib/entry/write";
import { recordTending, readTendingForDate } from "../lib/tending/record";
import { undoTendingRecord } from "../lib/tending/undo";
import { cleanupDir, makeTempDir } from "./helpers";

describe("undoTendingRecord", () => {
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length > 0) cleanupDir(dirs.pop() as string);
  });

  it("undoing a filed line archives the entry it created, and is reversible the normal way", () => {
    const lifeRoot = makeTempDir("undo-filed");
    dirs.push(lifeRoot);

    writeEntry(lifeRoot, {
      id: "learn-to-sail",
      title: "Learn to sail",
      area: "someday",
      kind: "someday",
      source: "agent:claude",
    });
    const written = recordTending(lifeRoot, {
      tool: "create_entry",
      bucket: "filed",
      entryId: "learn-to-sail",
      summary: 'Filed "Learn to sail".',
      reason: "Mentioned in chat as a someday thing.",
    });

    const result = undoTendingRecord(lifeRoot, written.relativePath, written.at);
    expect(result.ok).toBe(true);

    const after = readEntry(lifeRoot, "learn-to-sail");
    expect(after).toBeTruthy();
    expect(isArchived(after!.entry)).toBe(true);
  });

  it("undoing a corrected line restores the exact previous value, including clearing a field that had none before", () => {
    const lifeRoot = makeTempDir("undo-corrected");
    dirs.push(lifeRoot);

    writeEntry(lifeRoot, {
      id: "passport",
      title: "Passport",
      area: "papers",
      kind: "document",
      doc_kind: "passport",
      expires_at: "2029-05",
      source: "user",
    });

    const written = recordTending(lifeRoot, {
      tool: "update_entry",
      bucket: "corrected",
      entryId: "passport",
      summary: 'Corrected "Passport".',
      reason: "Scan shows 2028, not 2029.",
      // `physical_location` had no previous value at all — `null` records
      // that, distinctly from simply omitting the key.
      revert: { expires_at: "2029-05", physical_location: null },
    });

    writeEntry(lifeRoot, {
      id: "passport",
      title: "Passport",
      area: "papers",
      kind: "document",
      doc_kind: "passport",
      expires_at: "2028-05",
      physical_location: "Top drawer",
      source: "user",
    });

    const result = undoTendingRecord(lifeRoot, written.relativePath, written.at);
    expect(result.ok).toBe(true);

    const after = readEntry(lifeRoot, "passport") as { entry: { expires_at?: string; physical_location?: string } } | undefined;
    expect(after?.entry.expires_at).toBe("2029-05");
    expect(after?.entry.physical_location).toBeUndefined();
  });

  it("a correction recorded before undo support existed cannot be reversed automatically, and says so", () => {
    const lifeRoot = makeTempDir("undo-no-revert");
    dirs.push(lifeRoot);

    writeEntry(lifeRoot, {
      id: "passport",
      title: "Passport",
      area: "papers",
      kind: "document",
      doc_kind: "passport",
      expires_at: "2028-05",
      source: "user",
    });
    const written = recordTending(lifeRoot, {
      tool: "update_entry",
      bucket: "corrected",
      entryId: "passport",
      summary: 'Corrected "Passport".',
      reason: "Scan shows 2028, not 2029.",
      // No `revert` — the shape every line had before this feature existed.
    });

    const result = undoTendingRecord(lifeRoot, written.relativePath, written.at);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/before undo support existed/);
  });

  it("a left-alone line has nothing to undo, and says so rather than silently doing nothing", () => {
    const lifeRoot = makeTempDir("undo-left-alone");
    dirs.push(lifeRoot);

    writeEntry(lifeRoot, {
      id: "dentist-checkup",
      title: "Dentist check-up",
      area: "body",
      kind: "appointment",
      with: "Dr. Wahid",
      at: "2026-09-20T11:00",
      source: "user",
    });
    const written = recordTending(lifeRoot, {
      tool: "leave_alone",
      bucket: "left_alone",
      entryId: "dentist-checkup",
      summary: "Left the dentist check-up alone.",
      reason: "Already moved twice; that looked deliberate.",
    });

    const result = undoTendingRecord(lifeRoot, written.relativePath, written.at);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/nothing to undo/i);
  });

  it("undoing the same line twice reports the second attempt rather than archiving or reverting again", () => {
    const lifeRoot = makeTempDir("undo-twice");
    dirs.push(lifeRoot);

    writeEntry(lifeRoot, {
      id: "learn-to-sail",
      title: "Learn to sail",
      area: "someday",
      kind: "someday",
      source: "agent:claude",
    });
    const written = recordTending(lifeRoot, {
      tool: "create_entry",
      bucket: "filed",
      entryId: "learn-to-sail",
      summary: 'Filed "Learn to sail".',
      reason: "Mentioned in chat.",
    });

    expect(undoTendingRecord(lifeRoot, written.relativePath, written.at).ok).toBe(true);
    const second = undoTendingRecord(lifeRoot, written.relativePath, written.at);
    expect(second.ok).toBe(false);
    expect(second.message).toMatch(/already been undone/i);
  });

  it("marks the line undone in a way readTendingForDate can see, without rewriting the log line itself", () => {
    const lifeRoot = makeTempDir("undo-visible");
    dirs.push(lifeRoot);

    writeEntry(lifeRoot, {
      id: "learn-to-sail",
      title: "Learn to sail",
      area: "someday",
      kind: "someday",
      source: "agent:claude",
    });
    const written = recordTending(lifeRoot, {
      tool: "create_entry",
      bucket: "filed",
      entryId: "learn-to-sail",
      summary: 'Filed "Learn to sail".',
      reason: "Mentioned in chat.",
    });

    const date = written.relativePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1] as string;
    const before = readTendingForDate(lifeRoot, date);
    expect(before[0]?.undoneAt).toBeUndefined();

    undoTendingRecord(lifeRoot, written.relativePath, written.at);

    const after = readTendingForDate(lifeRoot, date);
    expect(after[0]?.undoneAt).toBeTruthy();
    // The line's own text is untouched — still legible as the original
    // account of what happened, not rewritten to say it was later undone.
    expect(after[0]?.summary).toBe('Filed "Learn to sail".');
  });

  it("returns a plain error for a time that never had a tending line", () => {
    const lifeRoot = makeTempDir("undo-missing");
    dirs.push(lifeRoot);
    const result = undoTendingRecord(lifeRoot, "tended/2026-09-13.md", "2026-09-13T09:00:00.000Z");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/no tending line/i);
  });
});
