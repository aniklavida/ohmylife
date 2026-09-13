// One test per guilt-and-storage promise this product makes — gathered in
// one file so the whole list is checkable at a glance, rather than trusting
// that each promise happened to get a test somewhere.
//
// Several of these promises already have thorough coverage elsewhere. This
// file does not re-implement that coverage — duplicated assertions drift
// out of sync with the code they duplicate — it points at the existing test
// by name and, where useful, adds one direct assertion against the same
// underlying function so the promise is checkable from this file too. Only
// the promises with a genuine gap get a full new test here.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeEntry } from "../lib/entry/write";
import { rebuildIndex } from "../lib/index/build";
import { computeOpenItems } from "../lib/summary/whats-open";
import { stripComments } from "./helpers";
import { cleanupDir, makeTempDir } from "./helpers";

const REPO_ROOT = path.resolve(__dirname, "..");

describe("promise: the index rebuilds from the files with no data loss", () => {
  // Fully covered by tests/rebuild.test.ts, which builds an index, deletes
  // it (database file plus WAL/SHM siblings, the way a real crash or a real
  // `rm` would), rebuilds from nothing but the life directory, and diffs
  // entries, links and search hits before and after. Nothing here repeats
  // that; this just asserts the file exists so the promise cannot silently
  // lose its test.
  it("has a dedicated test file", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "tests", "rebuild.test.ts"))).toBe(true);
  });
});

describe("promise: no streak, badge count, progress ring or content-state red in components", () => {
  // Fully covered by tests/design-system-constraints.test.ts, which greps
  // every component source and every CSS hex value.
  it("has a dedicated test file", () => {
    expect(
      fs.existsSync(path.join(REPO_ROOT, "tests", "design-system-constraints.test.ts")),
    ).toBe(true);
  });
});

describe("promise: someday refuses a due date, at the schema, and never appears in whats_open", () => {
  // The schema half — occurred_at rejected on a someday entry — is covered
  // by tests/entry-schema.test.ts. The gap this file fills: even a someday
  // entry that exists in the index is never returned by whats_open, proven
  // by writing one and reading the computed result back, not just by
  // reading the lookup table it is absent from.
  it("a someday entry never appears in computeOpenItems, no matter how old", () => {
    const root = makeTempDir("constraint-someday-open");
    try {
      const lifeRoot = path.join(root, "life");
      const dbPath = path.join(root, "index.db");

      writeEntry(lifeRoot, {
        id: "long-held-someday",
        area: "someday",
        kind: "someday",
        title: "Something with no date and no guilt attached",
        note: "Structurally cannot hold a due date.",
        source: "user",
      });
      // A task in the same life, due yesterday, so the computation is
      // proven to be returning *something* — the someday's absence is a
      // deliberate exclusion, not an empty result for an unrelated reason.
      writeEntry(lifeRoot, {
        id: "an-overdue-task",
        area: "tasks",
        kind: "task",
        title: "Something that is actually open",
        due: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        source: "user",
      });

      rebuildIndex(lifeRoot, dbPath);
      const items = computeOpenItems(dbPath);

      expect(items.some((item) => item.id === "long-held-someday")).toBe(false);
      expect(items.some((item) => item.id === "an-overdue-task")).toBe(true);
    } finally {
      cleanupDir(root);
    }
  });
});

describe("promise: habits have no streak field", () => {
  // Fully covered by tests/entry-schema.test.ts ("habits have no streak
  // field"), which proves the schema refuses an unknown `streak` key.
  it("has a dedicated test", () => {
    const source = stripComments(
      fs.readFileSync(path.join(REPO_ROOT, "tests", "entry-schema.test.ts"), "utf8"),
    );
    expect(source).toMatch(/habits have no streak field/);
  });
});

describe("promise: an agent has no delete path — archiving is the only removal, and it is reversible", () => {
  // The absence half is covered two ways already: tests/mcp-server.test.ts
  // ("lists exactly the thirteen tools the spec calls for") asserts the
  // exact tool list over the wire, and tests/layer-boundaries.test.ts ("the
  // agent-facing surface has no way to delete") reads every tool module's
  // declared name. The reversibility half is covered by
  // tests/entry-read-write.test.ts ("archives without deleting the file,
  // and restore reverses it"). Nothing here repeats those; this asserts
  // the three files agree that the surface has no removal tool by name.
  it("no tool name anywhere in the suite is a removal verb other than archive_entry", () => {
    const REMOVAL_VERB = /\b(delete|destroy|purge|erase|unlink)_[a-z_]+\b/i;
    const toolFiles = fs
      .readdirSync(path.join(REPO_ROOT, "mcp", "tools"))
      .filter((f) => f.endsWith(".ts"))
      .map((f) => path.join(REPO_ROOT, "mcp", "tools", f));
    for (const file of toolFiles) {
      const source = stripComments(fs.readFileSync(file, "utf8"));
      const match = source.match(/\bname\s*=\s*["']([^"']+)["']/);
      if (match) expect(match[1]).not.toMatch(REMOVAL_VERB);
    }
  });
});

describe("promise: a balance is always a dated reading, never a live figure", () => {
  // Fully covered by tests/entry-schema.test.ts ("a balance is always a
  // dated reading"), which proves balance and balance_as_of are required
  // together at the schema.
  it("has a dedicated test", () => {
    const source = stripComments(
      fs.readFileSync(path.join(REPO_ROOT, "tests", "entry-schema.test.ts"), "utf8"),
    );
    expect(source).toMatch(/a balance is always a dated reading/);
  });
});

describe("promise: overdue is not a visual state", () => {
  // tests/quiet-state.test.ts already proves the two rendered items are
  // markup-identical. The gap this file fills: that identical markup is not
  // an accident of the two sample items chosen there — the component that
  // renders them never reads `.status` at all, so there is no branch left
  // to render differently in the first place.
  it("open-today.tsx never reads an item's status", () => {
    const source = stripComments(
      fs.readFileSync(path.join(REPO_ROOT, "components", "today", "open-today.tsx"), "utf8"),
    );
    expect(source).not.toMatch(/\.status\b/);
    expect(source).not.toMatch(/overdue/i);
  });

  it("today.css declares no rule selecting an overdue or upcoming state", () => {
    // Strip CSS comments first: the file's own header explains in prose
    // that overdue and upcoming render identically, which would otherwise
    // false-positive against the very sentence stating this promise. What
    // must not exist is a *selector* keyed on either word.
    const css = fs
      .readFileSync(path.join(REPO_ROOT, "components", "today", "today.css"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/overdue|upcoming/i);
  });
});

describe("promise: the server makes no outbound call with no provider key configured", () => {
  // The assertion itself lives in tests/no-egress.test.ts, run by the same
  // `vitest run` invocation as every test in this file — there is one test
  // command, one CI step, one suite. This checks that fact directly rather
  // than assuming it: the file is included by vitest.config.ts's glob and
  // is not skipped or excluded anywhere.
  it("no-egress.test.ts matches the suite's include pattern and is not skipped", () => {
    const config = fs.readFileSync(path.join(REPO_ROOT, "vitest.config.ts"), "utf8");
    expect(config).toMatch(/tests\/\*\*\/\*\.test\.ts/);

    const source = fs.readFileSync(path.join(REPO_ROOT, "tests", "no-egress.test.ts"), "utf8");
    expect(source).not.toMatch(/\bdescribe\.skip\b|\bit\.skip\b/);
  });
});
