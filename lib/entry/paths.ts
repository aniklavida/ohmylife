// Where an entry lives on disk. This is the one place that decides it, so the
// writer, the reader and the index all agree — see docs/STRUCTURE.md.
import path from "node:path";
import type { Area, Entry, Kind } from "./schema";

const AREA_DIR: Record<Area, string> = {
  memories: "memories",
  people: "people",
  money: "money",
  body: "body",
  papers: "papers",
  decisions: "decisions",
  someday: "someday",
  tasks: "tasks",
  projects: "projects",
  goals: "goals",
  habits: "habits",
  areas: "areas",
};

// Money and Body each hold more than one kind, so those two areas group by
// kind on disk — matching the layout shown in docs/STRUCTURE.md and
// docs/ARCHITECTURE.md (`money/accounts/…`, `papers/passport.md`, …).
const KIND_SUBDIR: Partial<Record<Kind, string>> = {
  account: "accounts",
  obligation: "obligations",
  saving_goal: "goals",
  appointment: "appointments",
  measurement: "measurements",
};

/** The leading year for a memory's folder, or "undated" if none can be read. */
export function yearFragment(occurredAt: string | undefined): string {
  if (!occurredAt) return "undated";
  const match = occurredAt.match(/\d{4}/);
  return match ? match[0] : "undated";
}

/** Directory an entry belongs in, relative to the life root. POSIX-separated. */
export function entryDir(entry: Pick<Entry, "area" | "kind"> & { occurred_at?: string }): string {
  const base = AREA_DIR[entry.area];
  if (entry.kind === "memory") {
    return `${base}/${yearFragment(entry.occurred_at)}`;
  }
  const subdir = KIND_SUBDIR[entry.kind];
  return subdir ? `${base}/${subdir}` : base;
}

/** Path to an entry's markdown file, relative to the life root. POSIX-separated. */
export function entryRelativePath(
  entry: Pick<Entry, "id" | "area" | "kind"> & { occurred_at?: string },
): string {
  return `${entryDir(entry)}/${entry.id}.md`;
}

/** Absolute path to an entry's markdown file under the given life root. */
export function entryAbsolutePath(lifeRoot: string, entry: Parameters<typeof entryRelativePath>[0]): string {
  return path.join(lifeRoot, ...entryRelativePath(entry).split("/"));
}
