// The index schema — Drizzle table definitions for the two ordinary tables,
// plus the raw SQL for the FTS5 virtual table Drizzle has no schema DSL for.
//
// This whole file describes derived state. Nothing here is a source of truth:
// `lib/index/build.ts` can drop every table this file defines and recreate
// them from the life directory alone. See docs/ARCHITECTURE.md §1.
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type Database from "better-sqlite3";

/** One row per entry file. `data` carries the full validated entry as JSON, so
 * the index never has to be a second, partial definition of the format. */
export const entries = sqliteTable("entries", {
  id: text("id").primaryKey(),
  area: text("area").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  occurredAt: text("occurred_at"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
  source: text("source").notNull(),
  archivedAt: text("archived_at"),
  relativePath: text("relative_path").notNull(),
  data: text("data").notNull(),
});

/** One row per declared link, in the single direction the file recorded it. */
export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  type: text("type").notNull(),
});

/**
 * Creates every index table, including the FTS5 virtual table that Drizzle's
 * schema builder has no representation for. Called on a fresh database file
 * only — `lib/index/build.ts` deletes any existing file first, so this never
 * has to handle a partially-built index.
 */
export function createIndexSchema(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE entries (
      id            TEXT PRIMARY KEY,
      area          TEXT NOT NULL,
      kind          TEXT NOT NULL,
      title         TEXT NOT NULL,
      occurred_at   TEXT,
      created_at    TEXT,
      updated_at    TEXT,
      source        TEXT NOT NULL,
      archived_at   TEXT,
      relative_path TEXT NOT NULL,
      data          TEXT NOT NULL
    );
    CREATE INDEX entries_area_idx ON entries(area);
    CREATE INDEX entries_kind_idx ON entries(kind);
    CREATE INDEX entries_archived_idx ON entries(archived_at);

    CREATE TABLE links (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT NOT NULL,
      to_id   TEXT NOT NULL,
      type    TEXT NOT NULL
    );
    CREATE INDEX links_from_idx ON links(from_id);
    CREATE INDEX links_to_idx ON links(to_id);

    CREATE VIRTUAL TABLE entries_fts USING fts5(
      id UNINDEXED,
      title,
      body
    );
  `);
}
