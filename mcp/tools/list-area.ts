// `list_area` — browse one area with a filter and an order. See docs/SPEC.md
// §8.
import { z } from "zod";
import { AREAS, KINDS } from "../../lib/entry/schema";
import { listIndexedEntries } from "../../lib/index/query";
import { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../runtime";

export const name = "list_area";

const ORDER_FIELDS = ["title", "created_at", "updated_at", "occurred_at"] as const;

export const config = {
  title: "List area",
  description:
    "Lists entries in one area, optionally filtered to one kind, sorted " +
    "and paginated. Archived entries are excluded unless include_archived " +
    "is set.",
  inputSchema: {
    area: z.enum(AREAS),
    kind: z.enum(KINDS).optional(),
    order_by: z.enum(ORDER_FIELDS).default("title").optional(),
    order: z.enum(["asc", "desc"]).default("asc").optional(),
    include_archived: z.boolean().default(false).optional(),
    limit: z.number().int().min(1).max(500).default(100).optional(),
  },
};

export async function handler(args: {
  area: (typeof AREAS)[number];
  kind?: (typeof KINDS)[number];
  order_by?: (typeof ORDER_FIELDS)[number];
  order?: "asc" | "desc";
  include_archived?: boolean;
  limit?: number;
}) {
  const lifeRoot = resolveLifeRoot();
  const dbPath = ensureFreshIndex(lifeRoot, resolveDbPath());

  const orderBy = args.order_by ?? "title";
  const order = args.order ?? "asc";
  const includeArchived = args.include_archived ?? false;
  const limit = args.limit ?? 100;

  const rows = listIndexedEntries(dbPath)
    .filter((row) => row.area === args.area)
    .filter((row) => !args.kind || row.kind === args.kind)
    .filter((row) => includeArchived || row.entry.archived_at === undefined)
    .sort((a, b) => {
      const av = String((a.entry as Record<string, unknown>)[orderBy] ?? "");
      const bv = String((b.entry as Record<string, unknown>)[orderBy] ?? "");
      const cmp = av.localeCompare(bv);
      return order === "asc" ? cmp : -cmp;
    })
    .slice(0, limit);

  const body = {
    area: args.area,
    count: rows.length,
    entries: rows.map((row) => row.entry),
  };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }] };
}
