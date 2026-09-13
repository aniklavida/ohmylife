// Writing an entry to disk — markdown with YAML front matter, one file per
// entry, validated against the one schema in `schema.ts` before anything
// touches disk. See docs/SPEC.md §7 and docs/ARCHITECTURE.md §1.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { entryAbsolutePath } from "./paths";
import { readEntry } from "./read";
import { type Entry, type EntryInput, entrySchema } from "./schema";

function stripUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      (output as Record<string, unknown>)[key] = value;
    }
  }
  return output;
}

export interface WriteEntryResult {
  entry: Entry;
  filePath: string;
  relativePath: string;
  /** Set when writing this entry moved it (area, kind or occurred_at changed
   * its directory) and the file at the old location was removed. */
  replacedPath?: string;
}

/**
 * Validates and writes one entry. `source` must already be present in
 * `input` — the schema refuses to validate without it, so a write with no
 * provenance never reaches disk.
 *
 * `created_at` is preserved from an existing file with the same id if one
 * exists, and is set to now otherwise. `updated_at` is always set to now.
 */
export function writeEntry(lifeRoot: string, input: EntryInput): WriteEntryResult {
  const now = new Date().toISOString();
  const existing = readEntry(lifeRoot, input.id);

  const withTimestamps = {
    ...input,
    created_at: input.created_at ?? existing?.entry.created_at ?? now,
    updated_at: now,
  };

  const entry = entrySchema.parse(withTimestamps);

  const relativePath = path
    .relative(lifeRoot, entryAbsolutePath(lifeRoot, entry))
    .split(path.sep)
    .join("/");
  const filePath = entryAbsolutePath(lifeRoot, entry);

  const { body, ...frontMatter } = entry as Entry & { body?: string };
  const fileContents = matter.stringify(body ?? "", stripUndefined(frontMatter));

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, fileContents, "utf8");

  let replacedPath: string | undefined;
  if (existing && existing.filePath !== filePath) {
    fs.rmSync(existing.filePath, { force: true });
    replacedPath = existing.relativePath;
  }

  return { entry, filePath, relativePath, replacedPath };
}
