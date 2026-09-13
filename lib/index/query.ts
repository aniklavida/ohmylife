// Small read helpers over the index, used by tests and (later) the MCP
// `list_area` / `whats_open` tools. Nothing here is authoritative — every
// value returned was written into the index from a file in `lib/index/build.ts`
// and can be reproduced by rebuilding.
import Database from "better-sqlite3";
import type { Entry } from "../entry/schema";

export interface IndexedEntryRow {
  id: string;
  area: string;
  kind: string;
  title: string;
  relativePath: string;
  entry: Entry;
}

interface RawRow {
  id: string;
  area: string;
  kind: string;
  title: string;
  relative_path: string;
  data: string;
}

/** Every entry currently in the index, ordered by id for stable comparison. */
export function listIndexedEntries(dbPath: string): IndexedEntryRow[] {
  const sqlite = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const rows = sqlite
      .prepare("SELECT id, area, kind, title, relative_path, data FROM entries ORDER BY id")
      .all() as RawRow[];
    return rows.map((row) => ({
      id: row.id,
      area: row.area,
      kind: row.kind,
      title: row.title,
      relativePath: row.relative_path,
      entry: JSON.parse(row.data) as Entry,
    }));
  } finally {
    sqlite.close();
  }
}

export function countLinks(dbPath: string): number {
  const sqlite = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const row = sqlite.prepare("SELECT COUNT(*) AS count FROM links").get() as { count: number };
    return row.count;
  } finally {
    sqlite.close();
  }
}
