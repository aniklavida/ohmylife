// Writing and reading an entry back — and the human-readability promise this
// whole format exists for (docs/SPEC.md §7, "Done when" on the Notion card:
// "A person can read their own life in a text editor with the app switched
// off"). That is checked here without going through gray-matter or the
// schema at all — plain `fs.readFileSync`, the same as a text editor would do.
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { archiveEntry, isArchived, restoreEntry } from "../lib/entry/archive";
import { entryRelativePath } from "../lib/entry/paths";
import { readEntry } from "../lib/entry/read";
import { writeEntry } from "../lib/entry/write";
import { cleanupDir, makeTempDir } from "./helpers";

let lifeRoot: string;

beforeEach(() => {
  lifeRoot = makeTempDir("read-write");
});

afterEach(() => {
  cleanupDir(lifeRoot);
});

describe("writeEntry / readEntry", () => {
  it("round-trips an entry, filling in timestamps", () => {
    const written = writeEntry(lifeRoot, {
      id: "nani-house",
      area: "memories",
      kind: "memory",
      title: "The smell of my grandmother's kitchen",
      body: "We spent the whole afternoon on the veranda.",
      occurred_at: "summer 2019",
      source: "user",
    });

    expect(written.relativePath).toBe(entryRelativePath({
      id: "nani-house",
      area: "memories",
      kind: "memory",
      occurred_at: "summer 2019",
    }));
    expect(written.entry.created_at).toBeTruthy();
    expect(written.entry.updated_at).toBeTruthy();

    const read = readEntry(lifeRoot, "nani-house");
    expect(read).toBeDefined();
    expect(read?.entry.title).toBe("The smell of my grandmother's kitchen");
    expect(read?.entry.body).toBe("We spent the whole afternoon on the veranda.");
    if (read?.entry.kind === "memory") {
      expect(read.entry.occurred_at).toBe("summer 2019");
    }
  });

  it("preserves created_at and refreshes updated_at across a second write", async () => {
    const first = writeEntry(lifeRoot, {
      id: "phone-bill",
      area: "money",
      kind: "obligation",
      title: "Phone bill",
      amount: 799,
      cadence: "monthly",
      counterparty: "Grameenphone",
      source: "user",
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    const second = writeEntry(lifeRoot, {
      id: "phone-bill",
      area: "money",
      kind: "obligation",
      title: "Phone bill",
      amount: 849,
      cadence: "monthly",
      counterparty: "Grameenphone",
      source: "user",
    });

    expect(second.entry.created_at).toBe(first.entry.created_at);
    expect(second.entry.updated_at).not.toBe(first.entry.updated_at);
    if (second.entry.kind === "obligation") {
      expect(second.entry.amount).toBe(849);
    }
  });

  it("moves a memory to a new year folder when occurred_at is corrected, without leaving the old file behind", () => {
    writeEntry(lifeRoot, {
      id: "wrong-year",
      area: "memories",
      kind: "memory",
      title: "Filed under the wrong year at first",
      occurred_at: "2020",
      source: "user",
    });
    const oldPath = path.join(lifeRoot, "memories", "2020", "wrong-year.md");
    expect(fs.existsSync(oldPath)).toBe(true);

    const corrected = writeEntry(lifeRoot, {
      id: "wrong-year",
      area: "memories",
      kind: "memory",
      title: "Filed under the wrong year at first",
      occurred_at: "2021",
      source: "user",
    });

    expect(fs.existsSync(oldPath)).toBe(false);
    expect(corrected.replacedPath).toBe("memories/2020/wrong-year.md");
    expect(fs.existsSync(path.join(lifeRoot, "memories", "2021", "wrong-year.md"))).toBe(true);
  });

  it("is plain, human-readable markdown — readable with the app switched off", () => {
    const written = writeEntry(lifeRoot, {
      id: "readable-check",
      area: "decisions",
      kind: "decision",
      title: "A decision worth reading later",
      chose: "Do the simple thing",
      because: "It was the simple thing, and it worked.",
      source: "user",
    });

    // Read with nothing but the filesystem — no gray-matter, no zod.
    const raw = fs.readFileSync(written.filePath, "utf8");

    expect(() => Buffer.from(raw, "utf8").toString("utf8")).not.toThrow();
    expect(raw.startsWith("---\n")).toBe(true);
    const closingFenceIndex = raw.indexOf("\n---\n", 4);
    expect(closingFenceIndex).toBeGreaterThan(0);

    const frontMatter = raw.slice(4, closingFenceIndex);
    const body = raw.slice(closingFenceIndex + 5);

    // No JSON object literals — just YAML block style (`key: value`, `- item`
    // lists) and prose. An empty list like `links: []` is normal YAML, not JSON.
    expect(frontMatter).not.toMatch(/[{}]/);
    expect(frontMatter).toContain("title: A decision worth reading later");
    expect(body.trim()).toBe("");
    // Every byte is printable UTF-8 text (or a newline/tab) — nothing that
    // would look like garbage in a plain text editor.
    for (const char of raw) {
      const code = char.codePointAt(0) ?? 0;
      const isPrintable = code >= 0x20 || char === "\n" || char === "\t";
      expect(isPrintable).toBe(true);
    }
  });
});

describe("archive / restore — the only removal", () => {
  it("archives without deleting the file, and restore reverses it", () => {
    writeEntry(lifeRoot, {
      id: "old-idea",
      area: "someday",
      kind: "someday",
      title: "An idea I no longer want",
      note: "Skip this one.",
      source: "user",
    });

    const archived = archiveEntry(lifeRoot, "old-idea");
    expect(isArchived(archived.entry)).toBe(true);
    expect(fs.existsSync(path.join(lifeRoot, "someday", "old-idea.md"))).toBe(true);

    const restored = restoreEntry(lifeRoot, "old-idea");
    expect(isArchived(restored.entry)).toBe(false);
  });
});
