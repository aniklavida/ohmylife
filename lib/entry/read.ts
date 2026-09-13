// Reading entries back off disk. This file, `write.ts` and the website (once
// it exists) all validate against the one schema in `schema.ts` — see
// docs/STRUCTURE.md, "One schema definition, three consumers."
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { type Entry, entrySchema } from "./schema";

export interface ZodIssueLike {
  path: (string | number)[];
  message: string;
}

export interface ParsedEntryFile {
  entry: Entry;
  /** Absolute path on this machine. */
  filePath: string;
  /** POSIX path relative to the life root — stable across machines. */
  relativePath: string;
}

export class EntryValidationError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly issues: ZodIssueLike[],
  ) {
    super(
      `Invalid entry at ${filePath}: ${issues
        .map((issue) => `${issue.path.join(".") || "(root)"} — ${issue.message}`)
        .join("; ")}`,
    );
    this.name = "EntryValidationError";
  }
}

/**
 * Recursively lists every markdown file under `rootDir` that is an entry,
 * sorted for stable output.
 *
 * `tended/` is skipped entirely: it holds the tending record and its
 * proposal/access-request drafts (lib/tending/record.ts, proposals.ts,
 * access-requests.ts), which are markdown but never entries — they carry no
 * front matter this schema recognises, because they are a log, not an
 * envelope. Walking into it would hand each of those files to the entry
 * parser only to have it fail, which is a validation error for a file that
 * was never wrong — it was never an entry to begin with.
 */
export function walkMarkdownFiles(rootDir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(rootDir)) return results;
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    // biome-ignore lint: stack is non-empty, checked by the while condition
    const dir = stack.pop()!;
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (dirent.name.startsWith(".")) continue;
      const full = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        if (dirent.name === "tended" && dir === rootDir) continue;
        stack.push(full);
      } else if (dirent.isFile() && dirent.name.endsWith(".md")) {
        results.push(full);
      }
    }
  }
  return results.sort();
}

/** Parses and validates one entry file. Throws `EntryValidationError` on a bad file. */
export function parseEntryFile(lifeRoot: string, absoluteFilePath: string): ParsedEntryFile {
  const raw = fs.readFileSync(absoluteFilePath, "utf8");
  const parsed = matter(raw);
  const body = parsed.content.replace(/\n+$/, "");
  const candidate = { ...parsed.data, body: body === "" ? undefined : body };
  const result = entrySchema.safeParse(candidate);
  if (!result.success) {
    throw new EntryValidationError(absoluteFilePath, result.error.issues as ZodIssueLike[]);
  }
  return {
    entry: result.data,
    filePath: absoluteFilePath,
    relativePath: path.relative(lifeRoot, absoluteFilePath).split(path.sep).join("/"),
  };
}

export interface ListEntriesResult {
  entries: ParsedEntryFile[];
  errors: { filePath: string; error: EntryValidationError }[];
}

/**
 * Reads every entry in a life. Used by the rebuildable index (lib/index/build.ts)
 * and by anything that needs the whole life rather than one entry.
 *
 * A bad file does not abort the walk — it is collected in `errors` so one
 * damaged entry cannot take the rest of a life down with it.
 */
export function listAllEntries(lifeRoot: string): ListEntriesResult {
  const entries: ParsedEntryFile[] = [];
  const errors: ListEntriesResult["errors"] = [];
  for (const filePath of walkMarkdownFiles(lifeRoot)) {
    try {
      entries.push(parseEntryFile(lifeRoot, filePath));
    } catch (error) {
      if (error instanceof EntryValidationError) {
        errors.push({ filePath, error });
      } else {
        throw error;
      }
    }
  }
  return { entries, errors };
}

/**
 * Finds one entry by id. `id` is unique across the whole life (schema.ts),
 * and the file name is always the id (paths.ts), so a filename match is
 * sufficient — the file is still fully parsed and validated before it is
 * returned.
 */
export function readEntry(lifeRoot: string, id: string): ParsedEntryFile | undefined {
  for (const filePath of walkMarkdownFiles(lifeRoot)) {
    if (path.basename(filePath, ".md") === id) {
      return parseEntryFile(lifeRoot, filePath);
    }
  }
  return undefined;
}
