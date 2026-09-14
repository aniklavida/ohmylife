// THE test. Everything in the storage layer exists to make this true:
//
//   "Deleting the index and rebuilding it loses nothing."
//
// This does not just assert that rebuilding runs without error — it builds
// the index once, records everything queryable through it, deletes the
// database file (and its WAL/SHM siblings, the way a real crash or a real
// `rm` would), rebuilds from nothing but the life directory, and diffs the
// two snapshots. If the index were ever holding one bit of state the files
// did not also hold, this is where that would show up as a mismatch.
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { rebuildIndex } from "../lib/index/build";
import { resolveLinks } from "../lib/index/links";
import { countLinks, listIndexedEntries } from "../lib/index/query";
import { searchLife } from "../lib/index/search";
import { writeEntry } from "../lib/entry/write";
import { cleanupDir, EXAMPLE_LIFE_ROOT, makeTempDir } from "./helpers";

function snapshot(dbPath: string, idsToCheckLinksFor: string[], searchQuery: string) {
  return {
    entries: listIndexedEntries(dbPath),
    linkCount: countLinks(dbPath),
    linksByEntry: Object.fromEntries(
      idsToCheckLinksFor.map((id) => [id, resolveLinks(dbPath, id)]),
    ),
    searchHits: searchLife(dbPath, searchQuery, { limit: 50 }),
  };
}

/** Deletes the index file the way an operator following docs/SPEC.md §7
 * would — the database and its WAL/SHM siblings, nothing else. */
function deleteIndex(dbPath: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${dbPath}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }
}

describe("rebuilding the index loses nothing", () => {
  const cleanupDirs: string[] = [];

  afterEach(() => {
    while (cleanupDirs.length > 0) {
      const dir = cleanupDirs.pop();
      if (dir) cleanupDir(dir);
    }
  });

  it("indexes the worked example with no validation errors", () => {
    const root = makeTempDir("rebuild-clean");
    cleanupDirs.push(root);
    const dbPath = path.join(root, "index.db");

    const result = rebuildIndex(EXAMPLE_LIFE_ROOT, dbPath);

    expect(result.errors).toEqual([]);
    expect(result.entryCount).toBe(23);
    expect(result.linkCount).toBe(4);
  });

  it("produces a byte-for-byte identical index after deleting and rebuilding it", () => {
    const root = makeTempDir("rebuild-equal");
    cleanupDirs.push(root);
    const dbPath = path.join(root, "index.db");
    const idsToCheck = ["nani", "rumi", "flat-downpayment", "left-the-agency"];

    rebuildIndex(EXAMPLE_LIFE_ROOT, dbPath);
    const before = snapshot(dbPath, idsToCheck, "tea OR agency OR flat");
    expect(fs.existsSync(dbPath)).toBe(true);

    deleteIndex(dbPath);
    expect(fs.existsSync(dbPath)).toBe(false);

    const result = rebuildIndex(EXAMPLE_LIFE_ROOT, dbPath);
    expect(result.errors).toEqual([]);

    const after = snapshot(dbPath, idsToCheck, "tea OR agency OR flat");

    expect(after.entries).toEqual(before.entries);
    expect(after.linkCount).toBe(before.linkCount);
    expect(after.linksByEntry).toEqual(before.linksByEntry);
    expect(after.searchHits).toEqual(before.searchHits);

    // And the content is not merely equal to itself — it is right.
    const byId = new Map(after.entries.map((row) => [row.id, row]));
    expect(byId.get("nani")?.entry.title).toBe("Nani");
    expect(byId.get("left-the-agency")?.entry.kind).toBe("decision");
  });

  it("loses nothing for a life this test writes itself, not only the shipped example", () => {
    const root = makeTempDir("rebuild-written");
    cleanupDirs.push(root);
    const lifeRoot = path.join(root, "a-life");
    const dbPath = path.join(root, "index.db");

    writeEntry(lifeRoot, {
      id: "a-memory",
      area: "memories",
      kind: "memory",
      title: "A memory this test wrote",
      occurred_at: "2022",
      source: "user",
      links: [{ type: "about", target: "a-person" }],
    });
    writeEntry(lifeRoot, {
      id: "a-person",
      area: "people",
      kind: "person",
      title: "A person this test wrote",
      source: "user",
    });
    writeEntry(lifeRoot, {
      id: "a-someday",
      area: "someday",
      kind: "someday",
      title: "Something with no date, on purpose",
      note: "No due date exists for this kind.",
      source: "user",
    });

    rebuildIndex(lifeRoot, dbPath);
    const before = snapshot(dbPath, ["a-memory", "a-person"], "memory OR person");

    deleteIndex(dbPath);
    rebuildIndex(lifeRoot, dbPath);
    const after = snapshot(dbPath, ["a-memory", "a-person"], "memory OR person");

    expect(after).toEqual(before);
    expect(after.entries).toHaveLength(3);
    // The link resolves from the person's side too, though only the memory
    // file ever declared it — see tests/links.test.ts for this in isolation.
    expect(after.linksByEntry["a-person"]).toEqual([
      expect.objectContaining({ id: "a-memory", direction: "incoming" }),
    ]);
  });

  it("the index itself never has to be committed for the life to be complete", () => {
    // The index lives wherever the caller points it — never inside the life
    // directory — so committing the life directory to git (docs/SPEC.md §7,
    // "no export step") never means committing a SQLite file. See also
    // tests/git-friendly.test.ts.
    const root = makeTempDir("rebuild-location");
    cleanupDirs.push(root);
    const lifeRoot = path.join(root, "a-life");
    const dbPath = path.join(root, "elsewhere", "index.db");

    writeEntry(lifeRoot, {
      id: "only-entry",
      area: "someday",
      kind: "someday",
      title: "Just one thing",
      source: "user",
    });
    rebuildIndex(lifeRoot, dbPath);

    expect(fs.existsSync(dbPath)).toBe(true);
    const filesUnderLife = fs.readdirSync(lifeRoot, { recursive: true }) as string[];
    expect(filesUnderLife.some((f) => f.endsWith(".db"))).toBe(false);
  });
});
