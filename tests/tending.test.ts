// The tending record — legible on its own, and parseable back out, since the
// MCP write tools (tests/mcp-server.test.ts) rely on both properties.
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readTendingForDate, recordTending } from "../lib/tending/record";
import { cleanupDir, makeTempDir } from "./helpers";

describe("recordTending", () => {
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length > 0) cleanupDir(dirs.pop() as string);
  });

  it("writes a human-readable line and an appended, parseable comment", () => {
    const lifeRoot = makeTempDir("tending");
    dirs.push(lifeRoot);

    const written = recordTending(lifeRoot, {
      at: "2026-09-13T09:14:00.000Z",
      tool: "create_entry",
      bucket: "filed",
      entryId: "dentist-checkup",
      summary: "Added the dentist check-up from your message.",
      reason: "You mentioned booking this appointment in chat.",
    });

    const filePath = path.join(lifeRoot, "tended", "2026-09-13.md");
    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, "utf8");

    // Legible without any tool — plain text, no JSON required to read it.
    expect(raw).toContain("# 2026-09-13");
    expect(raw).toContain("Filed:");
    expect(raw).toContain("`dentist-checkup`");
    expect(raw).toContain("Added the dentist check-up from your message.");
    expect(raw).toContain("via `create_entry`");

    expect(written.relativePath).toBe("tended/2026-09-13.md");
  });

  it("appends rather than overwrites, and both lines parse back out", () => {
    const lifeRoot = makeTempDir("tending-append");
    dirs.push(lifeRoot);

    recordTending(lifeRoot, {
      at: "2026-09-13T09:14:00.000Z",
      tool: "create_entry",
      bucket: "filed",
      entryId: "a",
      summary: "Filed a.",
      reason: "First reason.",
    });
    recordTending(lifeRoot, {
      at: "2026-09-13T15:02:00.000Z",
      tool: "leave_alone",
      bucket: "left_alone",
      entryId: "b",
      summary: "Left b alone — it looked deliberate.",
      reason: "Rescheduled three times already; that reads as a choice.",
    });

    const records = readTendingForDate(lifeRoot, "2026-09-13");
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ tool: "create_entry", bucket: "filed", entryId: "a" });
    expect(records[1]).toMatchObject({ tool: "leave_alone", bucket: "left_alone", entryId: "b" });
    expect(records[1]?.reason).toContain("reads as a choice");
  });

  it("never contains a raw newline inside a summary or reason, even if the caller passed one", () => {
    const lifeRoot = makeTempDir("tending-oneline");
    dirs.push(lifeRoot);

    recordTending(lifeRoot, {
      at: "2026-09-13T09:14:00.000Z",
      tool: "update_entry",
      bucket: "corrected",
      entryId: "passport",
      summary: "Expiry corrected\nfrom the scan.",
      reason: "Passport expiry said 2029;\nthe scan says 2028.",
    });

    const [record] = readTendingForDate(lifeRoot, "2026-09-13");
    expect(record?.summary).not.toContain("\n");
    expect(record?.reason).not.toContain("\n");
  });
});
