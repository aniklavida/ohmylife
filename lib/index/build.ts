// Building the index from the files — the operation the product's central
// promise rests on. `rebuildIndex` always starts from an empty database: it
// never trusts, patches or reads whatever index was there before, because an
// index that must be believed rather than rebuilt is a second source of
// truth. See docs/SPEC.md §7 and the test in tests/rebuild.test.ts.
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { listAllEntries } from "../entry/read";
import type { Entry } from "../entry/schema";
import { createIndexSchema } from "./schema";

export interface RebuildError {
  filePath: string;
  message: string;
}

export interface RebuildResult {
  dbPath: string;
  entryCount: number;
  linkCount: number;
  errors: RebuildError[];
}

function removeIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
  }
}

/**
 * Deletes any existing index at `dbPath` (and its WAL/SHM siblings) and
 * rebuilds it from scratch by reading every file under `lifeRoot`.
 *
 * The files are the only input. Nothing about the previous index — if any —
 * is read or carried forward, which is what makes "delete the index and
 * rebuild it" a meaningful test rather than an incremental refresh.
 */
export function rebuildIndex(lifeRoot: string, dbPath: string): RebuildResult {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  for (const suffix of ["", "-wal", "-shm"]) {
    removeIfExists(`${dbPath}${suffix}`);
  }

  const sqlite = new Database(dbPath);
  try {
    sqlite.pragma("journal_mode = WAL");
    createIndexSchema(sqlite);

    const { entries: parsed, errors } = listAllEntries(lifeRoot);

    const insertEntry = sqlite.prepare(`
      INSERT INTO entries
        (id, area, kind, title, occurred_at, created_at, updated_at, source, archived_at, relative_path, data)
      VALUES
        (@id, @area, @kind, @title, @occurred_at, @created_at, @updated_at, @source, @archived_at, @relative_path, @data)
    `);
    const insertLink = sqlite.prepare(`
      INSERT INTO links (from_id, to_id, type) VALUES (?, ?, ?)
    `);
    const insertFts = sqlite.prepare(`
      INSERT INTO entries_fts (id, title, body) VALUES (?, ?, ?)
    `);

    let linkCount = 0;

    const run = sqlite.transaction(() => {
      for (const { entry, relativePath } of parsed) {
        const e = entry as Entry;
        insertEntry.run({
          id: e.id,
          area: e.area,
          kind: e.kind,
          title: e.title,
          occurred_at: ((e as Record<string, unknown>).occurred_at as string | undefined) ?? null,
          created_at: e.created_at ?? null,
          updated_at: e.updated_at ?? null,
          source: e.source,
          archived_at: e.archived_at ?? null,
          relative_path: relativePath,
          data: JSON.stringify(e),
        });
        insertFts.run(e.id, e.title, e.body ?? "");
      }
      // Links are inserted in a second pass so a link's target does not have
      // to already exist in the table when the link itself is written.
      for (const { entry } of parsed) {
        for (const link of entry.links) {
          insertLink.run(entry.id, link.target, link.type);
          linkCount += 1;
        }
      }
    });
    run();

    return {
      dbPath,
      entryCount: parsed.length,
      linkCount,
      errors: errors.map(({ filePath, error }) => ({ filePath, message: error.message })),
    };
  } finally {
    sqlite.close();
  }
}
