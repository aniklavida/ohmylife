// The full tending record's list — distinct from the home page's read-only
// TendingPanel (tests/place.test.ts already asserts that one offers no undo
// control at all). Here, a line offers Undo unless it is a "left_alone"
// line (nothing to reverse) or already undone.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TendingRecordList } from "../components/tending/tending-record-list";
import type { WrittenTendingRecord } from "../lib/tending/record";

const records: WrittenTendingRecord[] = [
  {
    at: "2026-09-11T06:16:00Z",
    tool: "create_entry",
    bucket: "filed",
    entryId: "sleep-2026-09-10",
    summary: "Logged Wednesday night's sleep.",
    reason: "The health app's nightly sync included a new reading.",
    relativePath: "tended/2026-09-11.md",
  },
  {
    at: "2026-09-12T08:00:00Z",
    tool: "leave_alone",
    bucket: "left_alone",
    entryId: "dentist-checkup",
    summary: "Noticed the dentist check-up has already moved twice. Left it booked.",
    reason: "Two prior reschedules looked deliberate.",
    relativePath: "tended/2026-09-12.md",
  },
  {
    at: "2026-09-05T09:00:00Z",
    tool: "update_entry",
    bucket: "corrected",
    entryId: "passport",
    summary: 'Corrected "Passport".',
    reason: "Scan shows 2028, not 2029.",
    relativePath: "tended/2026-09-05.md",
    undoneAt: "2026-09-06T10:00:00Z",
  },
];

describe("the TendingRecordList component", () => {
  const html = renderToStaticMarkup(createElement(TendingRecordList, { records }));

  it("shows an undo control for a filed line that has not been undone", () => {
    expect(html).toContain("Logged Wednesday night");
    expect(html).toContain("Undo");
  });

  it("offers no undo control for a left-alone line — nothing was changed", () => {
    expect(html).toContain("Noticed the dentist check-up");
    // "Undo" appears once, for the filed line, and never as part of the
    // left-alone line's own markup.
    const leftAloneIndex = html.indexOf("Noticed the dentist check-up");
    const nextUndo = html.indexOf(">Undo<", leftAloneIndex);
    expect(nextUndo).toBe(-1);
  });

  it("shows 'Undone' rather than a working control for a line already reversed", () => {
    expect(html).toContain("Corrected");
    expect(html).toContain("Undone");
  });
});
