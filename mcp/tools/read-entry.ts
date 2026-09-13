// `read_entry` — one entry in full, with its links resolved one hop in both
// directions (a memory's own file only ever declares the outgoing edge; the
// incoming side is computed by the index — lib/index/links.ts). See
// docs/SPEC.md §8.
import { z } from "zod";
import { readEntry } from "../../lib/entry/read";
import { resolveLinks } from "../../lib/index/links";
import { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../runtime";

export const name = "read_entry";

export const config = {
  title: "Read entry",
  description:
    "Reads one entry by id in full, including its links resolved one hop " +
    "in both directions (entries that link to it, not only the ones it " +
    "links to).",
  inputSchema: {
    id: z.string().min(1),
  },
};

export async function handler(args: { id: string }) {
  const lifeRoot = resolveLifeRoot();
  const found = readEntry(lifeRoot, args.id);
  if (!found) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `No entry with id "${args.id}" exists.` }],
    };
  }

  const dbPath = ensureFreshIndex(lifeRoot, resolveDbPath());
  const links = resolveLinks(dbPath, args.id);

  const body = {
    entry: found.entry,
    relative_path: found.relativePath,
    links,
  };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }] };
}
