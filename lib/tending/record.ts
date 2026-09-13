// The tending record — the visible account of what an agent did to a life,
// written as a by-product of the `reason` that every MCP write already
// carries (docs/SPEC.md §10). This file is the one place that appends to it;
// the MCP tool layer never writes to `tended/` directly, for the same reason
// it never touches any other file directly — see docs/STRUCTURE.md,
// "`lib/` is the only code that touches disk."
//
// One markdown file per day, append-only, human-readable on its own in any
// editor. Each line also carries a hidden HTML comment holding the same
// facts as JSON, so a future reader — the website's tending page, or an
// undo command — never has to re-parse prose to know what happened. The
// prose is the product; the comment is only ever a convenience for code.
import fs from "node:fs";
import path from "node:path";

/**
 * The three categories the tending panel groups lines into (docs/SPEC.md
 * §10). Every MCP write tool maps to exactly one of these — `leave_alone`
 * is the only tool that ever produces "left_alone".
 */
export const TENDING_BUCKETS = ["filed", "corrected", "left_alone"] as const;
export type TendingBucket = (typeof TENDING_BUCKETS)[number];

export interface TendingRecord {
  /** ISO 8601 timestamp. Set by `recordTending` if omitted. */
  at?: string;
  /** The MCP tool that produced this line, e.g. "create_entry". */
  tool: string;
  bucket: TendingBucket;
  /** The entry this line is about, if any — absent for e.g. `request_access`. */
  entryId?: string;
  /** One line of prose, safe to render as-is. Never contains a newline. */
  summary: string;
  /** The reason argument the caller supplied, verbatim. */
  reason: string;
}

export interface WrittenTendingRecord extends Required<Pick<TendingRecord, "at" | "tool" | "bucket" | "summary" | "reason">> {
  entryId?: string;
  relativePath: string;
}

function dateFragment(iso: string): string {
  return iso.slice(0, 10); // "2026-09-13T09:14:00.000Z" -> "2026-09-13"
}

function timeFragment(iso: string): string {
  return iso.slice(11, 16); // "…T09:14:00.000Z" -> "09:14"
}

function oneLine(value: string): string {
  return value.replace(/\s*\n\s*/g, " ").trim();
}

export const BUCKET_LABEL: Record<TendingBucket, string> = {
  filed: "Filed",
  corrected: "Corrected",
  left_alone: "Left alone",
};

/**
 * Appends one line to today's tending file, creating the day's file (and its
 * heading) the first time something is recorded on it. Never removes or
 * rewrites a previous line — the file is a log, not a view.
 */
export function recordTending(lifeRoot: string, record: TendingRecord): WrittenTendingRecord {
  const at = record.at ?? new Date().toISOString();
  const summary = oneLine(record.summary);
  const reason = oneLine(record.reason);
  const written: WrittenTendingRecord = {
    at,
    tool: record.tool,
    bucket: record.bucket,
    entryId: record.entryId,
    summary,
    reason,
    relativePath: `tended/${dateFragment(at)}.md`,
  };

  const filePath = path.join(lifeRoot, "tended", `${dateFragment(at)}.md`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const isNewFile = !fs.existsSync(filePath);
  const heading = isNewFile ? `# ${dateFragment(at)}\n\n` : "";

  const entryRef = record.entryId ? ` \`${record.entryId}\`` : "";
  const payload = JSON.stringify({
    at,
    tool: record.tool,
    bucket: record.bucket,
    entryId: record.entryId,
    summary,
    reason,
  });
  const line = `- **${timeFragment(at)}** — ${BUCKET_LABEL[record.bucket]}:${entryRef} ${summary} _(via \`${record.tool}\`)_\n  <!-- tending: ${payload} -->\n`;

  fs.appendFileSync(filePath, heading + line, "utf8");
  return written;
}

const TENDING_LINE_PATTERN = /<!-- tending: (.+) -->/g;

/** Parses every recorded line back out of one day's tending file. */
export function readTendingForDate(lifeRoot: string, date: string): WrittenTendingRecord[] {
  const filePath = path.join(lifeRoot, "tended", `${date}.md`);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const records: WrittenTendingRecord[] = [];
  for (const match of raw.matchAll(TENDING_LINE_PATTERN)) {
    const payload = match[1];
    if (!payload) continue;
    const parsed = JSON.parse(payload) as {
      at: string;
      tool: string;
      bucket: TendingBucket;
      entryId?: string;
      summary: string;
      reason: string;
    };
    records.push({
      ...parsed,
      relativePath: `tended/${date}.md`,
    });
  }
  return records;
}

/** Every tending record written on `date` — the same day used to write it. */
export function tendingFilePathFor(lifeRoot: string, date: string): string {
  return path.join(lifeRoot, "tended", `${date}.md`);
}

/**
 * The most recent tending lines across every day on file, newest first —
 * what the home page's tending panel reads (docs/SPEC.md §11). One file per
 * day means the panel would otherwise have to guess how many days back to
 * look; instead every day on disk is read and the result is trimmed to
 * `limit` after sorting, so the panel always shows the most recent activity
 * regardless of how it happens to be spread across files.
 */
export function readRecentTending(lifeRoot: string, limit = 8): WrittenTendingRecord[] {
  const tendedDir = path.join(lifeRoot, "tended");
  if (!fs.existsSync(tendedDir)) return [];

  const dates = fs
    .readdirSync(tendedDir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .map((name) => name.slice(0, "2026-09-13".length));

  const all = dates.flatMap((date) => readTendingForDate(lifeRoot, date));
  all.sort((a, b) => b.at.localeCompare(a.at));
  return all.slice(0, limit);
}
