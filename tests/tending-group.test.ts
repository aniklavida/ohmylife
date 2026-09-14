// The two group-by readings of the tending record besides "one entry's
// history" (docs/SPEC.md §11, "readable three ways: as a day, as a week,
// and as the history of one entry" — the third is a plain filter, tested
// alongside the page in tests/tended-page.test.tsx).
import { describe, expect, it } from "vitest";
import { groupTendingByDay, groupTendingByWeek } from "../lib/tending/group";
import type { WrittenTendingRecord } from "../lib/tending/record";

function record(overrides: Partial<WrittenTendingRecord> & { at: string }): WrittenTendingRecord {
  const date = overrides.at.slice(0, 10);
  return {
    tool: "create_entry",
    bucket: "filed",
    summary: "Filed something.",
    reason: "Because.",
    relativePath: `tended/${date}.md`,
    ...overrides,
  };
}

describe("groupTendingByDay", () => {
  it("puts records from the same day in one group, newest day first", () => {
    const records = [
      record({ at: "2026-09-12T08:00:00Z", entryId: "a" }),
      record({ at: "2026-09-13T09:00:00Z", entryId: "b" }),
      record({ at: "2026-09-13T18:00:00Z", entryId: "c" }),
    ];
    const groups = groupTendingByDay(records);
    expect(groups.map((g) => g.key)).toEqual(["2026-09-13", "2026-09-12"]);
    expect(groups[0]?.records.map((r) => r.entryId)).toEqual(["b", "c"]);
    expect(groups[0]?.label).toContain("September 13");
  });
});

describe("groupTendingByWeek", () => {
  it("puts a Sunday and the Monday right after it into different weeks", () => {
    // 2026-09-13 is a Sunday; 2026-09-14 is the following Monday.
    const records = [
      record({ at: "2026-09-13T09:00:00Z", entryId: "sunday" }),
      record({ at: "2026-09-14T09:00:00Z", entryId: "monday" }),
    ];
    const groups = groupTendingByWeek(records);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.key).toBe("2026-09-14");
    expect(groups[0]?.records.map((r) => r.entryId)).toEqual(["monday"]);
    expect(groups[1]?.key).toBe("2026-09-07");
    expect(groups[1]?.records.map((r) => r.entryId)).toEqual(["sunday"]);
  });

  it("groups every day in the same Monday-to-Sunday span together", () => {
    const records = [
      record({ at: "2026-09-07T09:00:00Z", entryId: "mon" }),
      record({ at: "2026-09-10T09:00:00Z", entryId: "thu" }),
      record({ at: "2026-09-13T09:00:00Z", entryId: "sun" }),
    ];
    const groups = groupTendingByWeek(records);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("2026-09-07");
    expect(groups[0]?.label).toContain("September 7");
    expect(groups[0]?.records.map((r) => r.entryId)).toEqual(["mon", "thu", "sun"]);
  });
});
