// The quiet state, rendered and read as a screen rather than trusted by
// inspection — docs/ROADMAP.md step 4: "the quiet state is reviewed and
// approved as a designed screen." No JSX here (this file stays `.test.ts`,
// matching vitest.config.ts's existing `include`), so components are built
// with `React.createElement` directly.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuietState } from "../components/quiet/quiet-state";
import { OpenToday } from "../components/today/open-today";
import type { OpenItem } from "../lib/summary/whats-open";

describe("the quiet state", () => {
  const html = renderToStaticMarkup(createElement(QuietState));

  it("says, in plain prose, that nothing needs you today", () => {
    expect(html).toContain("Nothing needs you today.");
  });

  it("is not an empty state: it renders a headline, a margin note and closing prose, not a blank panel", () => {
    expect(html).toContain("quiet-state__margin-note");
    expect(html.length).toBeGreaterThan(400);
  });

  it("describes the hero image for a screen reader, rather than leaving a bare empty alt", () => {
    // The scene itself is `aria-hidden`, so this sentence is the only thing
    // a screen reader gets for the hero — it has to describe the picture.
    expect(html).toMatch(/A drawn scene of a quiet room at dusk/);
  });

  it("says nothing to the reader about how the project is built or planned", () => {
    // This screen once shipped its own to-do list inside the hero's `alt`,
    // where a screen reader read it aloud. Anything describing the state of
    // the work — rather than the product — is a defect on a user-facing
    // surface, so the rendered output is checked for it directly.
    // Deliberately not a bare /decision/: `Decisions` is one of the life
    // areas this product stores (docs/SPEC.md §5) and will legitimately be
    // rendered as a label. Only process language is matched.
    for (const screen of [html, renderToStaticMarkup(createElement(OpenToday, { items: [] }))]) {
      expect(screen).not.toMatch(/\b(pending|blocker|placeholder|TODO|unreleased|not yet built)\b/i);
      expect(screen).not.toMatch(/\b[A-Za-z_-]+\.md\b/);
    }
  });

  it('never mentions a count of items — quiet is not "0 things"', () => {
    // Strip the placeholder scene's own SVG first: its coordinates and
    // gradient offsets are decorative markup, not the guilt-mechanic count
    // this test actually guards against.
    const withoutArt = html.replace(/<svg[\s\S]*?<\/svg>/, "");
    expect(withoutArt).not.toMatch(/\b0\b/);
    expect(withoutArt).not.toMatch(/\bzero\b/i);
  });
});

describe("a day when something is open", () => {
  const items: OpenItem[] = [
    {
      id: "renew-gym-membership",
      area: "tasks",
      kind: "task",
      title: "Renew the gym membership",
      due_field: "due",
      due_value: "2026-09-10",
      status: "overdue",
    },
    {
      id: "dentist-checkup",
      area: "body",
      kind: "appointment",
      title: "Dentist check-up",
      due_field: "at",
      due_value: "2026-09-15T09:00",
      status: "upcoming",
    },
  ];
  const html = renderToStaticMarkup(createElement(OpenToday, { items }));

  it("lists every open item by title", () => {
    expect(html).toContain("Renew the gym membership");
    expect(html).toContain("Dentist check-up");
  });

  it("never states a count of how many things are open", () => {
    expect(html).not.toMatch(/\b2\s+things?\b/i);
    expect(html).not.toMatch(/\bthings?\s+(could use|need)\s+you\b/i);
  });

  it("renders the overdue and the upcoming item with the same markup shape — no escalation between them", () => {
    const itemBlocks = html.match(/<li class="open-today__item">.*?<\/li>/gs) ?? [];
    expect(itemBlocks).toHaveLength(2);
    const shapesWithoutTitle = itemBlocks.map((block) =>
      block.replace(/Renew the gym membership|Dentist check-up/, "").replace(/Task|Body/, ""),
    );
    // Same tag structure and class list for both, differing only in the
    // area label and title text already stripped above, and the due date —
    // i.e. nothing about the overdue one is styled differently from the
    // upcoming one.
    const structureOf = (block: string) => block.replace(/>[^<]*</g, "><");
    const [first, second] = shapesWithoutTitle;
    expect(structureOf(first ?? "")).toEqual(structureOf(second ?? ""));
  });
});
