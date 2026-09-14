// Grouping the tending record into a day view or a week view — the two of
// the three readings docs/SPEC.md §11 asks for that are not "the history of
// one entry" (that one is a plain filter, applied before grouping; see
// app/tended/page.tsx). Pulled out of the page itself so the grouping logic
// can be tested without rendering React.
import type { WrittenTendingRecord } from "./record";

export interface TendingGroup {
  /** Sorts newest-first; a day's own date, or a week's Monday. */
  key: string;
  label: string;
  records: WrittenTendingRecord[];
}

function dateOf(record: WrittenTendingRecord): string {
  return record.relativePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? record.at.slice(0, 10);
}

export function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** The Monday (`YYYY-MM-DD`) of the ISO week `date` falls in. */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const isoDay = (d.getUTCDay() + 6) % 7; // Monday = 0 … Sunday = 6
  d.setUTCDate(d.getUTCDate() - isoDay);
  return d.toISOString().slice(0, 10);
}

export function weekLabel(monday: string): string {
  const start = new Date(`${monday}T00:00:00Z`);
  return `Week of ${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
}

/** Newest-first records into newest-first groups, one per calendar day. */
export function groupTendingByDay(records: WrittenTendingRecord[]): TendingGroup[] {
  const byDate = new Map<string, WrittenTendingRecord[]>();
  for (const record of records) {
    const date = dateOf(record);
    const list = byDate.get(date);
    if (list) list.push(record);
    else byDate.set(date, [record]);
  }
  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, list]) => ({ key: date, label: dayLabel(date), records: list }));
}

/** The same records, grouped into the Monday-starting week each falls in. */
export function groupTendingByWeek(records: WrittenTendingRecord[]): TendingGroup[] {
  const byWeek = new Map<string, WrittenTendingRecord[]>();
  for (const record of records) {
    const monday = mondayOf(dateOf(record));
    const list = byWeek.get(monday);
    if (list) list.push(record);
    else byWeek.set(monday, [record]);
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monday, list]) => ({ key: monday, label: weekLabel(monday), records: list }));
}
