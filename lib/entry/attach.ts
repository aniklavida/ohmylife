// Attaching an original file beside its entry — never rewritten, never
// re-encoded (docs/SPEC.md §7.1, "attachments"). This is the one place that
// copies attachment bytes, so the MCP tool layer (mcp/tools/attach-file.ts)
// never has to touch the filesystem itself — see docs/STRUCTURE.md,
// "`lib/` is the only code that touches disk."
import fs from "node:fs";
import path from "node:path";
import { entryAbsolutePath } from "./paths";
import { readEntry } from "./read";
import type { EntryInput } from "./schema";
import { writeEntry, type WriteEntryResult } from "./write";

export interface AttachFileInput {
  /** The name the file should have beside the entry. Sanitised to a bare
   * filename — no directory traversal, regardless of what is passed in. */
  filename: string;
  /** An absolute path this process can read the bytes from. */
  sourcePath?: string;
  /** Base64-encoded bytes, used instead of `sourcePath` when the caller has
   * no filesystem path to hand — e.g. a remote agent. */
  bytesBase64?: string;
}

function sanitiseFilename(name: string): string {
  const base = path.basename(name).trim();
  if (base === "" || base === "." || base === "..") {
    throw new Error(`"${name}" is not a usable filename.`);
  }
  return base;
}

/**
 * Copies a file's bytes beside an existing entry's markdown file and adds
 * it to that entry's `attachments` list. Refuses to overwrite a
 * differently-sourced file already at the destination name silently — a
 * second attachment with the same name gets a numbered suffix instead, so
 * an agent can never lose a person's file by naming collision.
 */
export function attachFile(lifeRoot: string, id: string, input: AttachFileInput): WriteEntryResult {
  const existing = readEntry(lifeRoot, id);
  if (!existing) {
    throw new Error(`Cannot attach a file to "${id}": no entry with that id exists.`);
  }
  if (!input.sourcePath && !input.bytesBase64) {
    throw new Error("attachFile requires either sourcePath or bytesBase64.");
  }

  const dir = path.dirname(entryAbsolutePath(lifeRoot, existing.entry));
  fs.mkdirSync(dir, { recursive: true });

  const requested = sanitiseFilename(input.filename);
  const ext = path.extname(requested);
  const stem = requested.slice(0, requested.length - ext.length);
  let destName = requested;
  let n = 2;
  while (fs.existsSync(path.join(dir, destName))) {
    destName = `${stem}-${n}${ext}`;
    n += 1;
  }
  const destPath = path.join(dir, destName);

  if (input.sourcePath) {
    fs.copyFileSync(input.sourcePath, destPath);
  } else {
    fs.writeFileSync(destPath, Buffer.from(input.bytesBase64 as string, "base64"));
  }

  const attachments = [...existing.entry.attachments, destName];
  return writeEntry(lifeRoot, { ...(existing.entry as EntryInput), attachments });
}
