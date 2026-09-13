// "A link from a memory to a person resolves one hop in both directions"
// (the Notion card's own acceptance line). Only the memory file declares the
// link; the person's file says nothing back. The index computes the reverse
// edge — see lib/index/links.ts.
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { rebuildIndex } from "../lib/index/build";
import { resolveLinks } from "../lib/index/links";
import { writeEntry } from "../lib/entry/write";
import { readEntry } from "../lib/entry/read";
import { cleanupDir, makeTempDir } from "./helpers";

let root: string;
let lifeRoot: string;
let dbPath: string;

beforeEach(() => {
  root = makeTempDir("links");
  lifeRoot = path.join(root, "life");
  dbPath = path.join(root, "index", "index.db");

  writeEntry(lifeRoot, {
    id: "rumi",
    area: "people",
    kind: "person",
    title: "Rumi",
    source: "user",
  });
  writeEntry(lifeRoot, {
    id: "coffee-with-rumi",
    area: "memories",
    kind: "memory",
    title: "Coffee with Rumi",
    occurred_at: "2024-11",
    source: "user",
    links: [{ type: "about", target: "rumi" }],
  });

  rebuildIndex(lifeRoot, dbPath);
});

afterEach(() => {
  cleanupDir(root);
});

describe("resolveLinks", () => {
  it("shows the outgoing link from the memory that declared it", () => {
    const fromMemory = resolveLinks(dbPath, "coffee-with-rumi");
    expect(fromMemory).toEqual([
      expect.objectContaining({ id: "rumi", type: "about", direction: "outgoing" }),
    ]);
  });

  it("shows the same link as incoming from the person's side, though the person's file never mentions it", () => {
    const rumiFile = readEntry(lifeRoot, "rumi");
    expect(rumiFile?.entry.links).toEqual([]);

    const fromPerson = resolveLinks(dbPath, "rumi");
    expect(fromPerson).toEqual([
      expect.objectContaining({
        id: "coffee-with-rumi",
        type: "about",
        direction: "incoming",
      }),
    ]);
  });

  it("returns nothing for an entry with no links at all", () => {
    writeEntry(lifeRoot, {
      id: "unlinked",
      area: "someday",
      kind: "someday",
      title: "Nothing points here",
      source: "user",
    });
    rebuildIndex(lifeRoot, dbPath);
    expect(resolveLinks(dbPath, "unlinked")).toEqual([]);
  });
});
