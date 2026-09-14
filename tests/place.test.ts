// "The place" — the life summary, the area cards and the tending panel
// (docs/ROADMAP.md step 5). The composers are tested against the worked
// example with a fixed clock, so the exact sentences are checked rather
// than only their shape; the presentational components are rendered and
// read as screens, the same convention tests/quiet-state.test.ts already
// established for this design system.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AreaCardGrid } from "../components/areas/area-card";
import { almanacDateline, LifeSummary } from "../components/summary/life-summary";
import { TendingPanel } from "../components/tending/tending-panel";
import { rebuildIndex } from "../lib/index/build";
import {
  composeAreaCards,
  composeLifeSummary,
  composeObservations,
  type Observation,
  sentenceForArea,
} from "../lib/summary/compose";
import type { WrittenTendingRecord } from "../lib/tending/record";
import { cleanupDir, EXAMPLE_LIFE_ROOT, makeTempDir } from "./helpers";

// The worked example's dates only produce these exact observations as of a
// known "now" — a moving `new Date()` would make this test's own passing
// depend on the day it happens to run.
const NOW = new Date("2026-09-14T10:00:00Z");

describe("the life summary, composed from the worked example", () => {
  const root = makeTempDir("place-summary");
  const dbPath = `${root}/index.db`;
  rebuildIndex(EXAMPLE_LIFE_ROOT, dbPath);
  const lines = composeLifeSummary(dbPath, NOW);

  it("never fills a fixed number of slots — it returns exactly as many true observations as the data supports", () => {
    // Four candidates exist in lib/summary/compose.ts; this life's data only
    // makes three of them true (no entry has two or more links resolving to
    // it, so the "keeps coming back" candidate does not fire). A test that
    // only checked "some lines came back" could not tell a real composer
    // from one that always pads to a fixed count.
    expect(lines).toHaveLength(3);
  });

  it("observations are true sentences grounded in the example's own data, not invented", () => {
    expect(lines).toContain("You haven't properly caught up with Nani in a long while.");
    expect(lines).toContain("Dentist check-up is the one thing with a real deadline, on September 20.");
    expect(lines).toContain("420,000 has been set aside toward down payment on a flat so far.");
  });

  it("contains no score, grade, ranking or percentage — the numbers that do appear are inside sentences", () => {
    for (const line of lines) {
      expect(line).not.toMatch(/%|\bpercent\b|\bout of \d+\b|\bscore\b|\bgrade\b|\brank(ing)?\b/i);
    }
  });

  cleanupDir(root);
});

describe("area cards, one human sentence per area", () => {
  const root = makeTempDir("place-areas");
  const dbPath = `${root}/index.db`;
  rebuildIndex(EXAMPLE_LIFE_ROOT, dbPath);
  const cards = composeAreaCards(dbPath, NOW);

  it("returns the seven areas that make this a life rather than a task list, each with a real sentence", () => {
    expect(cards.map((c) => c.area)).toEqual([
      "memories",
      "people",
      "money",
      "body",
      "papers",
      "decisions",
      "someday",
    ]);
    for (const card of cards) {
      expect(card.sentence.length).toBeGreaterThan(0);
    }
  });

  it("no area sentence states a count of its entries", () => {
    for (const card of cards) {
      expect(card.sentence).not.toMatch(/\b\d+\s+(memories|people|entries|items|things)\b/i);
    }
  });

  cleanupDir(root);
});

describe("an area sentence works for every one of the twelve areas, not only the home page's seven", () => {
  // Tasks, Projects, Goals, Habits and Areas get no card on the home page
  // (that grid is docs/ROADMAP.md step 5's reviewed design, at exactly the
  // seven areas above), but `/areas/[area]` still needs a real sentence for
  // each of them — this is what makes every area readable through the same
  // area-agnostic code, with no per-area special casing left unbuilt.
  const root = makeTempDir("place-remaining-areas");
  const dbPath = `${root}/index.db`;
  rebuildIndex(EXAMPLE_LIFE_ROOT, dbPath);
  const tasksLine = sentenceForArea(dbPath, "tasks", NOW);
  const projectsLine = sentenceForArea(dbPath, "projects", NOW);
  const goalsLine = sentenceForArea(dbPath, "goals", NOW);
  const habitsLine = sentenceForArea(dbPath, "habits", NOW);
  const areasLine = sentenceForArea(dbPath, "areas", NOW);
  const cards = composeAreaCards(dbPath, NOW);
  cleanupDir(root);

  it("names the nearest open task by its due date", () => {
    expect(tasksLine).toBe("Photograph the first ten recipe pages is due September 25.");
  });

  it("names the active project", () => {
    expect(projectsLine).toBe("Digitise Ammu's handwritten recipes is under way.");
  });

  it("names the goal by its target date", () => {
    expect(goalsLine).toBe("Cook through Ammu's recipe notebook is aimed at June 30.");
  });

  it("names the habit by when it was last kept, never by a streak or a count", () => {
    expect(habitsLine).toBe("Morning walk was kept most recently on September 14.");
    expect(habitsLine).not.toMatch(/\bstreak\b|\b\d+\s+days?\b/i);
  });

  it("names the most recently kept area of responsibility, with its description", () => {
    expect(areasLine).toBe("Home — Wherever this ends up being, and the ordinary upkeep of it.");
  });

  it("still returns the same seven-card home grid, unaffected by the other five areas existing", () => {
    expect(cards.map((c) => c.area)).toEqual([
      "memories",
      "people",
      "money",
      "body",
      "papers",
      "decisions",
      "someday",
    ]);
  });
});

describe("the AreaCard component", () => {
  const html = renderToStaticMarkup(
    createElement(AreaCardGrid, {
      cards: [
        { area: "memories", sentence: "The last one you kept: A quiet afternoon." },
        { area: "people", sentence: "You're in good touch here." },
      ],
    }),
  );

  it("renders the area's title and its sentence, never a count", () => {
    expect(html).toContain("Memories");
    expect(html).toContain("The last one you kept: A quiet afternoon.");
    expect(html).not.toMatch(/\b\d+\s+(memories|people|entries|items)\b/i);
  });

  it("links each card to its own area route", () => {
    expect(html).toContain('href="/areas/memories"');
    expect(html).toContain('href="/areas/people"');
  });
});

describe("the life summary's observations know what they are about", () => {
  const root = makeTempDir("place-observations");
  const dbPath = `${root}/index.db`;
  rebuildIndex(EXAMPLE_LIFE_ROOT, dbPath);
  const observations = composeObservations(dbPath, NOW);
  const lines = composeLifeSummary(dbPath, NOW);
  cleanupDir(root);

  it("tags each true observation with its subject, in the same order as the sentences", () => {
    expect(observations.map((o) => o.theme)).toEqual(["people", "date", "savings"]);
    expect(observations.map((o) => o.sentence)).toEqual(lines);
  });
});

describe("the life summary, set as an almanac spread", () => {
  const today = new Date("2026-09-14T10:00:00Z");
  const observations: Observation[] = [
    { theme: "people", sentence: "You haven't properly caught up with Nani in a long while." },
    { theme: "date", sentence: "Dentist check-up is the one thing with a real deadline, on September 20." },
    { theme: "savings", sentence: "420,000 has been set aside toward down payment on a flat so far." },
  ];
  const html = renderToStaticMarkup(createElement(LifeSummary, { observations, today }));
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

  it("renders every observation it is given, each under its own heading", () => {
    expect(text).toContain("You haven't properly caught up with Nani in a long while.");
    expect(text).toContain("Of people");
    expect(text).toContain("Of the calendar");
    expect(text).toContain("Of savings");
  });

  it("sets the first observation large and the rest beside it", () => {
    expect(html).toMatch(/class="almanac__lead">You haven/);
    expect(html.match(/class="almanac__note /g)).toHaveLength(2);
  });

  it("keeps every figure inside its sentence — the sentence reads whole once the markup is gone", () => {
    expect(text).toContain("420,000 has been set aside toward down payment on a flat so far.");
    expect(text).toContain("on September 20.");
    expect(html).toContain('<span class="almanac__figure">420,000</span> has been set aside');
  });

  it("heads the page with the day in words, so no figure stands on its own", () => {
    expect(almanacDateline(today)).toBe("Monday, the fourteenth of September");
    const outsideSentences = text.replace(/[^.]*\d[^.]*\./g, "");
    expect(outsideSentences).not.toMatch(/\d/);
  });

  it("carries no score, grade, ranking, percentage or better-or-worse comparison", () => {
    expect(text).not.toMatch(
      /%|\bpercent\b|\bout of\b|\bscore\b|\bgrade\b|\brank(ing)?\b|\bbetter\b|\bworse\b|\bthan last\b/i,
    );
  });

  it("lays out a single true observation as a whole spread, rather than padding it", () => {
    const single = renderToStaticMarkup(
      createElement(LifeSummary, { observations: [observations[2] as Observation], today }),
    );
    expect(single).toContain("almanac__spread--single");
    expect(single).not.toContain("almanac__note");
  });

  it("renders nothing at all when there is nothing true to say yet", () => {
    expect(renderToStaticMarkup(createElement(LifeSummary, { observations: [], today }))).toBe("");
  });
});

describe("the TendingPanel component", () => {
  const records: WrittenTendingRecord[] = [
    {
      at: "2026-09-11T06:16:00Z",
      tool: "create_entry",
      bucket: "filed",
      entryId: "sleep-2026-09-10",
      summary: "Logged Wednesday night's sleep from the health app's export.",
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
  ];
  const html = renderToStaticMarkup(createElement(TendingPanel, { records }));

  it("shows what was filed and what was deliberately left alone", () => {
    expect(html).toContain("Filed");
    expect(html).toContain("Left alone");
    expect(html).toContain("Logged Wednesday night");
    expect(html).toContain("sleep from the health app");
    expect(html).toContain("Noticed the dentist check-up has already moved twice. Left it booked.");
  });

  it("always ends on the same reassurance, whether or not there is anything above it", () => {
    expect(html).toContain("All caught up for now.");
    const empty = renderToStaticMarkup(createElement(TendingPanel, { records: [] }));
    expect(empty).toContain("All caught up for now.");
  });

  it("offers no undo control — this panel only shows what happened", () => {
    expect(html).not.toMatch(/<button/i);
    expect(html).not.toMatch(/\bundo\b/i);
  });
});
