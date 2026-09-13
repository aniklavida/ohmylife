// Resolving the link graph — the reason the index exists at all rather than
// entries simply being read one at a time.
//
// A file only ever declares its own outgoing links (lib/entry/links.ts): a
// memory names the person in it, and the person's file says nothing back.
// The reverse edge is never written to disk — it is computed here, from the
// `links` table built in `lib/index/build.ts` — so a link "resolves one hop
// in both directions" (docs/ROADMAP.md) without ever risking two files
// disagreeing about the same relationship.
import Database from "better-sqlite3";

export type LinkDirection = "outgoing" | "incoming";

export interface ResolvedLink {
  id: string;
  area: string;
  kind: string;
  title: string;
  type: string;
  direction: LinkDirection;
}

interface LinkRow {
  id: string;
  area: string;
  kind: string;
  title: string;
  type: string;
}

/** Every entry linked to or from `id`, one hop, in both directions. */
export function resolveLinks(dbPath: string, id: string): ResolvedLink[] {
  const sqlite = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const outgoing = sqlite
      .prepare(
        `
          SELECT e.id AS id, e.area AS area, e.kind AS kind, e.title AS title, l.type AS type
          FROM links l
          JOIN entries e ON e.id = l.to_id
          WHERE l.from_id = ?
        `,
      )
      .all(id) as LinkRow[];

    const incoming = sqlite
      .prepare(
        `
          SELECT e.id AS id, e.area AS area, e.kind AS kind, e.title AS title, l.type AS type
          FROM links l
          JOIN entries e ON e.id = l.from_id
          WHERE l.to_id = ?
        `,
      )
      .all(id) as LinkRow[];

    return [
      ...outgoing.map((row) => ({ ...row, direction: "outgoing" as const })),
      ...incoming.map((row) => ({ ...row, direction: "incoming" as const })),
    ];
  } finally {
    sqlite.close();
  }
}
