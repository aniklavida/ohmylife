// `whats_open` — what genuinely needs a person right now. "Nothing" is a
// first-class answer here, not an empty array a model feels obliged to
// explain away (docs/SPEC.md §9, §15). `someday` cannot appear: the kind
// structurally has no due-like field (lib/entry/schema.ts), so it is
// excluded by construction, not by a filter someone could forget.
//
// What counts as "open" [a decision this card had to make; SPEC.md leaves
// the exact window unspecified]: a task, appointment, obligation or document
// with a due-like date that has passed, or is within a lead time appropriate
// to how much notice that kind of thing needs — a few days for a task or a
// bill, a week for an appointment, two months for a document about to
// expire. Overdue items are included but never marked differently from
// upcoming ones — there is no visual escalation over time (docs/SPEC.md
// §15), and that starts here, not only in the website.
import { listIndexedEntries } from "../../lib/index/query";
import type { Entry } from "../../lib/entry/schema";
import { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../runtime";

export const name = "whats_open";

export const config = {
  title: "What's open",
  description:
    "What genuinely needs a person right now: tasks, appointments, " +
    "obligations and documents with a due-like date that has passed or is " +
    "coming up soon. Returns an explicit \"nothing needs you\" message " +
    "when there is nothing, which is a normal, expected result — not an " +
    "error and not an empty state to explain away.",
  inputSchema: {},
};

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

/**
 * Turns one of this schema's date-or-fuzzy-phrase strings into a
 * comparison point. Full precision is used as given; anything less precise
 * than a day resolves to the end of the least precise unit given (a
 * year-month becomes that month's last moment, a bare year becomes December
 * 31st), which is the conservative reading for "when does this become due."
 */
function toComparableDate(value: string): Date | undefined {
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

export interface OpenItem {
  id: string;
  area: string;
  kind: string;
  title: string;
  due_field: string;
  due_value: string;
  status: "overdue" | "upcoming";
}

export async function handler() {
  const lifeRoot = resolveLifeRoot();
  const dbPath = ensureFreshIndex(lifeRoot, resolveDbPath());
  const now = new Date();

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

  const body =
    items.length === 0
      ? { open: [], message: "Nothing needs you today." }
      : {
          open: items,
          message: `${items.length} thing${items.length === 1 ? "" : "s"} could use you.`,
        };

  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }] };
}
