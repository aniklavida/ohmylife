// The life summary — a small set of true observations about a life,
// presented as prose rather than metrics (docs/SPEC.md §12). It is composed
// here, from the data itself, deliberately not written by whichever model
// the user happens to have connected: the most prominent surface in the
// product should not read differently depending on which agent someone
// brought, and a bad day from a model should not be able to make the front
// page read badly.
//
// There is no fixed number of observations. Each candidate below only
// contributes a line when the data genuinely supports it — a life with
// little to say gets a short summary, not one padded out to look complete,
// because a fixed slot count is exactly how a summary starts inventing.
import type { Area, Entry } from "../entry/schema";
import { resolveLinks } from "../index/links";
import { listIndexedEntries } from "../index/query";
import { toComparableDate } from "./whats-open";

const MAX_OBSERVATIONS = 4;
const DRIFT_THRESHOLD_DAYS = 120;

type Row = ReturnType<typeof listIndexedEntries>[number];

function field(entry: Entry, key: string): unknown {
  return (entry as unknown as Record<string, unknown>)[key];
}

function daysBetween(earlier: Date, later: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / (24 * 60 * 60 * 1000));
}

function formatLongDate(at: Date): string {
  return at.toLocaleDateString("en-US", { day: "numeric", month: "long" });
}

/**
 * The person a life has drifted furthest from — only named once the gap is
 * long enough to be a real observation rather than an ordinary busy season.
 */
function driftingPerson(rows: Row[], now: Date): string | undefined {
  let oldest: { title: string; at: Date } | undefined;
  for (const row of rows) {
    if (row.kind !== "person") continue;
    const raw = field(row.entry, "last_contact_at");
    if (typeof raw !== "string") continue;
    const at = toComparableDate(raw);
    if (!at) continue;
    if (!oldest || at.getTime() < oldest.at.getTime()) oldest = { title: row.title, at };
  }
  if (!oldest || daysBetween(oldest.at, now) < DRIFT_THRESHOLD_DAYS) return undefined;

  const monthsAgo = Math.floor(daysBetween(oldest.at, now) / 30);
  const span = monthsAgo >= 18 ? "in a long while" : `in ${monthsAgo} months`;
  return `You haven't properly caught up with ${oldest.title} ${span}.`;
}

/**
 * Something the life keeps returning to — an entry that at least two other
 * entries point at or that it points at, read straight off the link graph
 * rather than guessed at from text.
 */
function recurringThread(dbPath: string, rows: Row[]): string | undefined {
  let best: { title: string; others: string[] } | undefined;
  for (const row of rows) {
    const links = resolveLinks(dbPath, row.id);
    const others = [...new Set(links.map((link) => link.title))].filter((t) => t !== row.title);
    if (others.length < 2) continue;
    if (!best || others.length > best.others.length) best = { title: row.title, others };
  }
  if (!best) return undefined;

  const [first, second] = best.others;
  const list = second ? `${first} and ${second}` : first;
  return `${best.title} keeps coming back — it connects to ${list}.`;
}

/** The nearest thing on the calendar with a real deadline, whatever kind it is. */
function nearestDate(rows: Row[], now: Date): string | undefined {
  const DUE_FIELD: Record<string, string> = {
    appointment: "at",
    obligation: "next_due",
    document: "expires_at",
  };
  let nearest: { title: string; at: Date } | undefined;
  for (const row of rows) {
    const dueField = DUE_FIELD[row.kind];
    if (!dueField) continue;
    const raw = field(row.entry, dueField);
    if (typeof raw !== "string") continue;
    const at = toComparableDate(raw);
    if (!at || at.getTime() < now.getTime()) continue;
    if (!nearest || at.getTime() < nearest.at.getTime()) nearest = { title: row.title, at };
  }
  if (!nearest) return undefined;
  return `${nearest.title} is the one thing with a real deadline, on ${formatLongDate(nearest.at)}.`;
}

/**
 * Progress toward the largest saving goal, stated as a plain amount — never
 * a percentage complete, which docs/SPEC.md §12 forbids even here, the one
 * place a number is allowed to appear at all.
 */
function savingProgress(rows: Row[]): string | undefined {
  let best: { title: string; saved: number } | undefined;
  for (const row of rows) {
    if (row.kind !== "saving_goal") continue;
    const saved = field(row.entry, "saved");
    if (typeof saved !== "number" || saved <= 0) continue;
    if (!best || saved > best.saved) best = { title: row.title, saved };
  }
  if (!best) return undefined;
  return `${best.saved.toLocaleString("en-US")} has been set aside toward ${best.title.toLowerCase()} so far.`;
}

/**
 * The life summary: the few true things composed above, in order of how
 * personal they read, capped so the panel stays a handful of sentences
 * rather than a report. An empty array is a valid, honest result — a life
 * with nothing yet to observe gets no summary rather than an invented one.
 */
export function composeLifeSummary(dbPath: string, now: Date = new Date()): string[] {
  const rows = listIndexedEntries(dbPath).filter((row) => !row.entry.archived_at);
  const candidates = [
    driftingPerson(rows, now),
    recurringThread(dbPath, rows),
    nearestDate(rows, now),
    savingProgress(rows),
  ].filter((line): line is string => Boolean(line));
  return candidates.slice(0, MAX_OBSERVATIONS);
}

export interface AreaSummary {
  area: Area;
  sentence: string;
}

const AREA_CARD_ORDER: Area[] = [
  "memories",
  "people",
  "money",
  "body",
  "papers",
  "decisions",
  "someday",
];

function createdAt(row: Row): number {
  const raw = field(row.entry, "created_at");
  return typeof raw === "string" ? new Date(raw).getTime() : 0;
}

function memoriesSentence(rows: Row[]): string {
  if (rows.length === 0) return "Nothing kept here yet.";
  const latest = [...rows].sort((a, b) => createdAt(b) - createdAt(a))[0] as Row;
  return `The last one you kept: ${latest.title}.`;
}

function peopleSentence(rows: Row[], now: Date): string {
  if (rows.length === 0) return "No one filed here yet.";
  let oldest: Row | undefined;
  let oldestAt: Date | undefined;
  for (const row of rows) {
    const raw = field(row.entry, "last_contact_at");
    if (typeof raw !== "string") continue;
    const at = toComparableDate(raw);
    if (!at) continue;
    if (!oldestAt || at.getTime() < oldestAt.getTime()) {
      oldestAt = at;
      oldest = row;
    }
  }
  if (oldest && oldestAt && daysBetween(oldestAt, now) >= DRIFT_THRESHOLD_DAYS) {
    return `It's been a while since you properly caught up with ${oldest.title}.`;
  }
  const mostRecent = [...rows].sort((a, b) => createdAt(b) - createdAt(a))[0] as Row;
  return `You're in good touch here — ${mostRecent.title} most recently.`;
}

function moneySentence(rows: Row[], now: Date): string {
  const obligations = rows.filter((r) => r.kind === "obligation");
  let nearestObligation: { row: Row; at: Date } | undefined;
  for (const row of obligations) {
    const raw = field(row.entry, "next_due");
    if (typeof raw !== "string") continue;
    const at = toComparableDate(raw);
    if (!at || at.getTime() < now.getTime()) continue;
    if (!nearestObligation || at.getTime() < nearestObligation.at.getTime()) {
      nearestObligation = { row, at };
    }
  }
  if (nearestObligation) return `${nearestObligation.row.title} is coming due before long.`;

  const goals = rows.filter((r) => r.kind === "saving_goal");
  const progress = savingProgress(goals);
  if (progress) return progress;

  const accounts = rows.filter((r) => r.kind === "account");
  if (accounts.length > 0) {
    const account = accounts[0] as Row;
    const balance = field(account.entry, "balance");
    if (typeof balance === "number") {
      return `The last reading here: ${account.title} at ${balance.toLocaleString("en-US")}.`;
    }
  }
  return "Nothing filed here yet.";
}

function bodySentence(rows: Row[], now: Date): string {
  const appointments = rows.filter((r) => r.kind === "appointment");
  let nearest: { row: Row; at: Date } | undefined;
  for (const row of appointments) {
    const raw = field(row.entry, "at");
    if (typeof raw !== "string") continue;
    const at = toComparableDate(raw);
    if (!at || at.getTime() < now.getTime()) continue;
    if (!nearest || at.getTime() < nearest.at.getTime()) nearest = { row, at };
  }
  if (nearest) return `${nearest.row.title} is on the books for ${formatLongDate(nearest.at)}.`;

  const measurements = rows.filter((r) => r.kind === "measurement");
  if (measurements.length > 0) {
    const latest = [...measurements].sort((a, b) => createdAt(b) - createdAt(a))[0] as Row;
    return `The most recent note here: ${latest.title}.`;
  }
  return "Nothing filed here yet.";
}

function papersSentence(rows: Row[], now: Date): string {
  if (rows.length === 0) return "Nothing filed here yet.";
  let nearestExpiry: { row: Row; at: Date } | undefined;
  for (const row of rows) {
    const raw = field(row.entry, "expires_at");
    if (typeof raw !== "string") continue;
    const at = toComparableDate(raw);
    if (!at || at.getTime() < now.getTime()) continue;
    if (!nearestExpiry || at.getTime() < nearestExpiry.at.getTime()) nearestExpiry = { row, at };
  }
  if (nearestExpiry) return `${nearestExpiry.row.title} doesn't need attention for a while yet.`;
  const latest = [...rows].sort((a, b) => createdAt(b) - createdAt(a))[0] as Row;
  return `${latest.title} is filed away.`;
}

function decisionsSentence(rows: Row[]): string {
  if (rows.length === 0) return "Nothing decided here yet.";
  const latest = [...rows].sort((a, b) => createdAt(b) - createdAt(a))[0] as Row;
  return `The last thing decided here: ${latest.title}.`;
}

function somedaySentence(rows: Row[]): string {
  if (rows.length === 0) return "Nothing on the someday list yet.";
  const earliest = [...rows].sort((a, b) => createdAt(a) - createdAt(b))[0] as Row;
  return `${earliest.title} is still on the list, no rush.`;
}

/**
 * One human sentence per area — never a count, per docs/SPEC.md §6 ("Area
 * cards … a human sentence — never a count"). Each area reads its own kinds
 * of entry; the result is always a real sentence, including the honest
 * "nothing here yet" for an area with no entries at all.
 */
export function composeAreaCards(dbPath: string, now: Date = new Date()): AreaSummary[] {
  const rows = listIndexedEntries(dbPath).filter((row) => !row.entry.archived_at);
  const byArea = (area: Area) => rows.filter((row) => row.area === area);

  const sentenceFor: Record<Area, () => string> = {
    memories: () => memoriesSentence(byArea("memories")),
    people: () => peopleSentence(byArea("people"), now),
    money: () => moneySentence(byArea("money"), now),
    body: () => bodySentence(byArea("body"), now),
    papers: () => papersSentence(byArea("papers"), now),
    decisions: () => decisionsSentence(byArea("decisions")),
    someday: () => somedaySentence(byArea("someday")),
    tasks: () => "Nothing filed here yet.",
    projects: () => "Nothing filed here yet.",
    goals: () => "Nothing filed here yet.",
    habits: () => "Nothing filed here yet.",
    areas: () => "Nothing filed here yet.",
  };

  return AREA_CARD_ORDER.map((area) => ({ area, sentence: sentenceFor[area]() }));
}
