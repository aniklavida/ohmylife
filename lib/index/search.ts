// Full-text search over the index — FTS5, not embeddings, at v1: no model
// dependency, no drift between what is stored and what is searchable, and it
// works fully offline. See docs/SPEC.md §7.
import Database from "better-sqlite3";

export interface SearchHit {
  id: string;
  area: string;
  kind: string;
  title: string;
  snippet: string;
}

interface SearchRow {
  id: string;
  area: string;
  kind: string;
  title: string;
  snippet: string;
}

export interface SearchOptions {
  limit?: number;
  includeArchived?: boolean;
}

/**
 * Searches entry titles and bodies. `query` is passed to SQLite's FTS5 MATCH
 * as-is, so FTS5 query syntax (quoted phrases, `AND`/`OR`, prefix `*`) works.
 */
export function searchLife(dbPath: string, query: string, options: SearchOptions = {}): SearchHit[] {
  const { limit = 20, includeArchived = false } = options;
  const sqlite = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const archivedClause = includeArchived ? "" : "AND e.archived_at IS NULL";
    const rows = sqlite
      .prepare(
        `
          SELECT e.id AS id, e.area AS area, e.kind AS kind, e.title AS title,
                 snippet(entries_fts, 2, '[', ']', '…', 10) AS snippet
          FROM entries_fts
          JOIN entries e ON e.id = entries_fts.id
          WHERE entries_fts MATCH ? ${archivedClause}
          ORDER BY bm25(entries_fts)
          LIMIT ?
        `,
      )
      .all(query, limit) as SearchRow[];
    return rows;
  } finally {
    sqlite.close();
  }
}
