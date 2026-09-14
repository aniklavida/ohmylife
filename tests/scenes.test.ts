// The drawn scenes — one per area, each its own picture of what that area
// holds, standing in the image slot until a theme supplies a photograph
// (docs/SPEC.md §14). Rendered and read as markup, the same convention
// tests/quiet-state.test.ts established.
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AreaCardGrid } from "../components/areas/area-card";
import { Plate } from "../components/primitives/plate";
import {
  SCENE_DESCRIPTION,
  SCENE_NAMES,
  Scene,
  sceneForArea,
} from "../components/scenes/scenes";
import { AREAS } from "../lib/entry/schema";

const REPO_ROOT = path.resolve(__dirname, "..");
const HOME_AREAS = ["memories", "people", "money", "body", "papers", "decisions", "someday"];

describe("each area has a scene of its own", () => {
  it("the seven home areas each get a different drawing", () => {
    const scenes = HOME_AREAS.map(sceneForArea);
    expect(new Set(scenes).size).toBe(HOME_AREAS.length);
  });

  it("every area resolves to a real scene, so no area page falls back to nothing", () => {
    for (const area of AREAS) {
      expect(SCENE_NAMES).toContain(sceneForArea(area));
    }
  });

  it("no two scenes draw the same markup", () => {
    const drawings = SCENE_NAMES.map((name) => renderToStaticMarkup(createElement(Scene, { name })));
    const withoutIds = drawings.map((svg) => svg.replace(/oml-scene-[a-z]+/g, ""));
    expect(new Set(withoutIds).size).toBe(SCENE_NAMES.length);
  });
});

describe("a scene is themed, local and silent to assistive technology", () => {
  for (const name of SCENE_NAMES) {
    const svg = renderToStaticMarkup(createElement(Scene, { name }));

    it(`${name}: hides the drawing itself from a screen reader`, () => {
      expect(svg).toContain('aria-hidden="true"');
    });

    it(`${name}: takes every colour from the theme's tokens, none written into the drawing`, () => {
      expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b(?!-)/);
      expect(svg).not.toMatch(/\b(fill|stroke|stop-color)="(?!url\(|none)/);
    });

    it(`${name}: references nothing outside itself`, () => {
      const addresses = [...svg.matchAll(/\b(?:https?:)?\/\/[^\s"'<>]+/g)].map((m) => m[0]);
      expect(addresses.filter((a) => a !== "http://www.w3.org/2000/svg")).toEqual([]);
    });
  }

  it("every class a scene uses is styled in scenes.css", () => {
    const css = fs.readFileSync(path.join(REPO_ROOT, "components", "scenes", "scenes.css"), "utf8");
    const used = new Set<string>();
    for (const name of SCENE_NAMES) {
      const svg = renderToStaticMarkup(createElement(Scene, { name }));
      for (const match of svg.matchAll(/class="([^"]+)"/g)) {
        for (const cls of (match[1] as string).split(/\s+/)) {
          if (cls.startsWith("sc-")) used.add(cls);
        }
      }
    }
    const missing = [...used].filter((cls) => !css.includes(`.${cls}`));
    expect(missing).toEqual([]);
  });
});

describe("the description is of the picture, in plain words", () => {
  it("every scene has a description that says what is drawn", () => {
    for (const name of SCENE_NAMES) {
      expect(SCENE_DESCRIPTION[name]).toMatch(/^A drawn scene (of|from) /);
    }
  });

  it("no description talks about the state of the project instead of the picture", () => {
    for (const name of SCENE_NAMES) {
      expect(SCENE_DESCRIPTION[name]).not.toMatch(
        /\b(placeholder|until|pending|stand(s|ing)? in|chosen|licen[cs]e|TODO)\b/i,
      );
    }
  });

  it("each area on the home page carries its own scene's description", () => {
    const html = renderToStaticMarkup(
      createElement(AreaCardGrid, {
        cards: [
          { area: "money", sentence: "A true sentence about money." },
          { area: "people", sentence: "A true sentence about people." },
        ],
      }),
    );
    expect(html).toContain(SCENE_DESCRIPTION.money);
    expect(html).toContain(SCENE_DESCRIPTION.people);
    expect(html).toContain("scene--money");
    expect(html).toContain("scene--people");
  });
});

describe("the image slot stays swappable", () => {
  it("given a photograph, the plate shows it and draws no scene", () => {
    const html = renderToStaticMarkup(
      createElement(Plate, {
        scene: "memories",
        image: { src: "/themes/example/memories.jpg", alt: "An album on a table." },
      }),
    );
    expect(html).toContain('src="/themes/example/memories.jpg"');
    expect(html).toContain('alt="An album on a table."');
    expect(html).not.toContain("<svg");
  });

  it("an area given a photograph shows it in place of its drawing, with the photograph's own description", () => {
    const html = renderToStaticMarkup(
      createElement(AreaCardGrid, {
        cards: [
          {
            area: "people",
            sentence: "A true sentence about people.",
            photo: { src: "/photos/people.jpg", alt: "Two friends at a tea stall." },
          },
          { area: "money", sentence: "A true sentence about money." },
        ],
      }),
    );
    expect(html).toContain('src="/photos/people.jpg"');
    expect(html).toContain('alt="Two friends at a tea stall."');
    expect(html).not.toContain("scene--people");
    expect(html).not.toContain(SCENE_DESCRIPTION.people);
    expect(html).toContain("scene--money");
  });

  it("an area given a photograph entry with no path still falls back to its drawing", () => {
    const html = renderToStaticMarkup(
      createElement(AreaCardGrid, {
        cards: [{ area: "body", sentence: "A true sentence.", photo: { alt: "Nothing uploaded." } }],
      }),
    );
    expect(html).toContain("scene--body");
    expect(html).toContain(SCENE_DESCRIPTION.body);
  });

  it("a hero keeps its scrim over a photograph, so the words over it stay readable", () => {
    const html = renderToStaticMarkup(
      createElement(
        Plate,
        { variant: "hero", image: { src: "/photos/room.jpg", alt: "A bright kitchen in the morning." } },
        createElement("h1", null, "Nothing needs you today."),
      ),
    );
    expect(html).toContain("plate__scrim");
    expect(html.indexOf("plate__scrim")).toBeLessThan(html.indexOf("plate__content"));
  });

  it("without one, the plate draws the scene it was given", () => {
    const html = renderToStaticMarkup(
      createElement(Plate, { scene: "papers", image: { alt: SCENE_DESCRIPTION.papers } }),
    );
    expect(html).toContain("scene--papers");
    expect(html).not.toContain("<img");
  });
});
