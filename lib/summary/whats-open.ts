// What genuinely needs a person right now — the shared computation behind
// the MCP `whats_open` tool (mcp/tools/whats-open.ts) and the website's home
// route (app/page.tsx), so the two front doors onto the life core
// (docs/ARCHITECTURE.md) never disagree about what counts as open. "Nothing"
// is a first-class answer here (docs/SPEC.md §8), and an overdue item is
// never marked differently from an upcoming one — there is no visual
// escalation over time (docs/SPEC.md §13) — both start in this one place,
// not only in whichever surface happens to render them.
import { listIndexedEntries } from "../index/query";
import type { Entry } from "../entry/schema";

const LEAD_DAYS: Record<string, number> = {
  task: 3,
  appointment: 7,
  obligation: 7,
  document: 60,
};

const DUE_FIELD: Record<string, string> = {
  task: "due",
  appointment: "at",
  obligation: "next_due",
  document: "expires_at",
};

export interface OpenItem {
  id: string;
  area: string;
  kind: string;
  title: string;
  due_field: string;
  due_value: string;
  status: "overdue" | "upcoming";
}

/**
 * Turns one of this schema's date-or-fuzzy-phrase strings into a
 * comparison point. Full precision is used as given; anything less precise
 * than a day resolves to the end of the least precise unit given (a
 * year-month becomes that month's last moment, a bare year becomes December
 * 31st), which is the conservative reading for "when does this become due."
 */
export function toComparableDate(value: string): Date | undefined {
  const isoDateTime = value.match(/^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}(:\d{2})?)?/);
  if (isoDateTime) {
    if (isoDateTime[4]) return new Date(value);
    return new Date(`${isoDateTime[1]}-${isoDateTime[2]}-${isoDateTime[3]}T23:59:59`);
  }
  const yearMonth = value.match(/^(\d{4})-(\d{2})$/);
  if (yearMonth) {
    const [, y, m] = yearMonth;
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    return new Date(`${y}-${m}-${String(lastDay).padStart(2, "0")}T23:59:59`);
  }
  const trailingYear = value.match(/(\d{4})$/);
  if (trailingYear) return new Date(`${trailingYear[1]}-12-31T23:59:59`);
  return undefined;
}

/**
 * What genuinely needs a person right now, as of `now`. `someday` never
 * appears: the kind has no due-like field to read at all
 * (lib/entry/schema.ts), so it is excluded by construction, not by a filter
 * someone could forget to add here.
 */
export function computeOpenItems(dbPath: string, now: Date = new Date()): OpenItem[] {
  const items: OpenItem[] = [];

  for (const row of listIndexedEntries(dbPath)) {
    if (row.entry.archived_at) continue;
    const dueField = DUE_FIELD[row.kind];
    const leadDays = LEAD_DAYS[row.kind];
    if (!dueField || leadDays === undefined) continue;
    if (row.kind === "task" && (row.entry as Entry & { state?: string }).state === "done") continue;

    const raw = (row.entry as Record<string, unknown>)[dueField];
    if (typeof raw !== "string") continue;
    const due = toComparableDate(raw);
    if (!due) continue;

    const horizon = new Date(now.getTime() + leadDays * 24 * 60 * 60 * 1000);
    if (due.getTime() > horizon.getTime()) continue;

    items.push({
      id: row.id,
      area: row.area,
      kind: row.kind,
      title: row.title,
      due_field: dueField,
      due_value: raw,
      status: due.getTime() < now.getTime() ? "overdue" : "upcoming",
    });
  }

  items.sort((a, b) => a.due_value.localeCompare(b.due_value));
  return items;
}
