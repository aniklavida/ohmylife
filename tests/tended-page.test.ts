// app/tended/page.tsx — the full tending record, readable as a day, a
// week, or the history of one entry (docs/SPEC.md §11). Called directly as
// the async function it is, the same convention tests/place.test.ts and
// tests/quiet-state.test.ts already use for a server component.
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import TendedPage from "../app/tended/page";
import { EXAMPLE_LIFE_ROOT } from "./helpers";

describe("the full tending record page", () => {
  const originalLifeRoot = process.env.OHMYLIFE_LIFE;

  afterEach(() => {
    if (originalLifeRoot === undefined) delete process.env.OHMYLIFE_LIFE;
    else process.env.OHMYLIFE_LIFE = originalLifeRoot;
  });

  it("reads as a day by default, grouping the worked example's tending history under its own dates", async () => {
    process.env.OHMYLIFE_LIFE = EXAMPLE_LIFE_ROOT;
    const element = await TendedPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("While you were away");
    expect(html).toContain("September 1");
    expect(html).toContain("September 12");
    expect(html).toContain("By week");
  });

  it("reads as a week when asked, grouping every day in that week under one heading", async () => {
    process.env.OHMYLIFE_LIFE = EXAMPLE_LIFE_ROOT;
    const dayView = renderToStaticMarkup(
      await TendedPage({ searchParams: Promise.resolve({}) }),
    );
    const weekView = renderToStaticMarkup(
      await TendedPage({ searchParams: Promise.resolve({ view: "week" }) }),
    );

    expect(weekView).toContain("Week of");
    // Grouping by week collapses four distinct days onto fewer headings
    // than grouping by day does — the same underlying records, read a
    // second way, not a different record.
    const headingCount = (html: string) => (html.match(/<h2/g) ?? []).length;
    expect(headingCount(weekView)).toBeLessThan(headingCount(dayView));
  });

  it("reads as the history of one entry when filtered, and nothing about any other entry", async () => {
    process.env.OHMYLIFE_LIFE = EXAMPLE_LIFE_ROOT;
    const element = await TendedPage({ searchParams: Promise.resolve({ entry: "dentist-checkup" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("this one entry");
    expect(html).toContain("dentist");
    expect(html).not.toContain("Wednesday night");
    expect(html).toContain("Back to the full record");
  });
});
