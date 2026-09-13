// "The whole life is a directory a user can commit to their own git
// repository without any export step" (the Notion card's own acceptance
// line). That is only true if the life directory never contains anything
// but the entries themselves — no database, no build artifact, nothing that
// would need to be excluded before a `git add .` was safe.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rebuildIndex } from "../lib/index/build";
import { writeEntry } from "../lib/entry/write";
import { cleanupDir, EXAMPLE_LIFE_ROOT, makeTempDir } from "./helpers";

function listAllFiles(root: string): string[] {
  const results: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) break;
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        stack.push(full);
      } else if (dirent.isFile()) {
        results.push(path.relative(root, full).split(path.sep).join("/"));
      }
    }
  }
  return results.sort();
}

describe("a life directory is git-friendly", () => {
  it("the shipped worked example contains only markdown", () => {
    const files = listAllFiles(EXAMPLE_LIFE_ROOT);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(file.endsWith(".md")).toBe(true);
    }
  });

  it("writing entries and rebuilding the index never adds anything under the life root", () => {
    const root = makeTempDir("git-friendly");
    try {
      const lifeRoot = path.join(root, "a-life");
      const dbPath = path.join(root, "index", "index.db");

      writeEntry(lifeRoot, {
        id: "a-memory",
        area: "memories",
        kind: "memory",
        title: "Checked for stray files",
        occurred_at: "2023",
        source: "user",
      });
      writeEntry(lifeRoot, {
        id: "a-person",
        area: "people",
        kind: "person",
        title: "Also checked",
        source: "user",
      });
      rebuildIndex(lifeRoot, dbPath);

      const files = listAllFiles(lifeRoot);
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        expect(file.endsWith(".md")).toBe(true);
      }
    } finally {
      cleanupDir(root);
    }
  });
});
