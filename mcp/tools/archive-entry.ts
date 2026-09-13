// `archive_entry` — the only removal this product has. There is no delete
// tool anywhere in the MCP surface, on purpose (docs/SPEC.md §8): an
// agent destroying a memory is unrecoverable and unforgivable, so the only
// reliable defence is to make deletion unrepresentable here, not merely
// disallowed. `archiveEntry` (lib/entry/archive.ts) only ever sets a
// timestamp — nothing is removed from disk, and restoring it is a single
// field clear away.
import { z } from "zod";
import { archiveEntry } from "../../lib/entry/archive";
import { recordTending } from "../../lib/tending/record";
import { resolveLifeRoot } from "../runtime";

export const name = "archive_entry";

export const config = {
  title: "Archive entry",
  description:
    "Archives an entry, reversibly — sets archived_at, never removes the " +
    "file. There is no delete tool. Requires a reason.",
  inputSchema: {
    id: z.string().min(1),
    reason: z.string().min(1),
  },
};

export async function handler(args: { id: string; reason: string }) {
  const lifeRoot = resolveLifeRoot();
  let written: ReturnType<typeof archiveEntry>;
  try {
    written = archiveEntry(lifeRoot, args.id);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
    };
  }

  recordTending(lifeRoot, {
    tool: name,
    bucket: "corrected",
    entryId: written.entry.id,
    summary: `Archived "${written.entry.title}".`,
    reason: args.reason,
  });

  const body = { entry: written.entry, relative_path: written.relativePath };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }] };
}
