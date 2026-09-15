import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { AreaCard } from "../components/areas/area-card";
import { Plate } from "../components/primitives/plate";
import { QuietState } from "../components/quiet/quiet-state";
import { OpenToday } from "../components/today/open-today";
import { getActiveTheme, listAvailableThemes, loadTheme } from "../lib/theme/load";
import { resolveAreaPhoto, serializeThemeCss } from "../lib/theme/resolve";
import { validateThemeManifest } from "../lib/theme/schema";
import type { ThemeManifest } from "../lib/theme/types";
import { cleanupDir, makeTempDir } from "./helpers";

const cleanupDirs: string[] = [];

afterEach(() => {
  delete process.env.WEALLHATELIFE_THEME;
  delete process.env.OHMYLIFE_THEME;
  while (cleanupDirs.length > 0) {
    cleanupDir(cleanupDirs.pop() as string);
  }
});

/**
 * Extracts the structural DOM skeleton from rendered HTML.
 * Strips out style content, text, and specific attribute values, preserving
 * the exact hierarchy of tags, class names, roles, and structural layout.
 */
function extractLayoutStructure(html: string): string {
  return html
    // Remove style tag contents (which contain theme-specific CSS variables)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "<style></style>")
    // Normalize text content between tags while preserving whitespace structure
    .replace(/>[^<]+</g, "><")
    // Normalize image src and alt so only the presence of the tag and its classes are compared
    .replace(/<img\b([^>]*?)>/g, (_, attrs: string) => {
      const classMatch = attrs.match(/class="([^"]*)"/);
      return classMatch ? `<img class="${classMatch[1]}" />` : "<img />";
    })
    .trim();
}

/**
 * Asserts layout stability between two themes.
 * Compares the structural DOM hierarchy of rendered components.
 * If a theme introduces layout or spacing tokens, this function detects it and throws.
 */
function assertNoLayoutShift(
  renderThemeA: () => string,
  themeA: ThemeManifest,
  renderThemeB: () => string,
  themeB: ThemeManifest,
): void {
  // 1. Structural DOM comparison
  const structureA = extractLayoutStructure(renderThemeA());
  const structureB = extractLayoutStructure(renderThemeB());
  if (structureA !== structureB) {
    throw new Error(
      `Layout shift detected between themes "${themeA.name}" and "${themeB.name}". Structural DOM trees differ.`,
    );
  }

  // 2. Token integrity: verify neither theme declares layout or spacing overrides
  const checkForbiddenTokens = (theme: ThemeManifest) => {
    const forbidden = ["space", "spacing", "margin", "padding", "gap", "layout", "width", "height"];
    for (const mode of ["light", "dark"] as const) {
      const palette = theme.colors[mode];
      if (!palette) continue;
      for (const key of Object.keys(palette)) {
        const lower = key.toLowerCase();
        for (const token of forbidden) {
          if (lower === token || lower.startsWith(`${token}-`) || lower.startsWith(`--${token}`)) {
            throw new Error(
              `Layout shift: Theme "${theme.name}" defines spacing/layout token "${key}". Spacing stays the product's.`,
            );
          }
        }
      }
    }
  };

  checkForbiddenTokens(themeA);
  checkForbiddenTokens(themeB);
}

describe("Done-when: switching theme changes every image and colour and moves no layout", () => {
  it("switching theme changes every colour token and typography stack", () => {
    const lamplight = loadTheme("lamplight");
    const solarium = loadTheme("solarium");

    expect(lamplight.id).toBe("lamplight");
    expect(solarium.id).toBe("solarium");

    // Colors differ across themes
    expect(lamplight.colors.light?.bg).not.toEqual(solarium.colors.light?.bg);
    expect(lamplight.colors.light?.surface).not.toEqual(solarium.colors.light?.surface);
    expect(lamplight.colors.light?.ink).not.toEqual(solarium.colors.light?.ink);
    expect(lamplight.colors.light?.forest).not.toEqual(solarium.colors.light?.forest);
    expect(lamplight.colors.light?.terracotta).not.toEqual(solarium.colors.light?.terracotta);
    expect(lamplight.colors.light?.sage).not.toEqual(solarium.colors.light?.sage);

    expect(lamplight.colors.dark?.bg).not.toEqual(solarium.colors.dark?.bg);
    expect(lamplight.colors.dark?.surface).not.toEqual(solarium.colors.dark?.surface);
    expect(lamplight.colors.dark?.ink).not.toEqual(solarium.colors.dark?.ink);

    // Typography stacks differ
    expect(lamplight.typography.sans).not.toEqual(solarium.typography.sans);
    expect(lamplight.typography.serif).not.toEqual(solarium.typography.serif);

    // CSS serializations differ
    const cssLamplight = serializeThemeCss(lamplight);
    const cssSolarium = serializeThemeCss(solarium);
    expect(cssLamplight).not.toEqual(cssSolarium);
    expect(cssLamplight).toContain(lamplight.colors.light?.bg);
    expect(cssSolarium).toContain(solarium.colors.light?.bg);
  });

  it("switching theme moves no layout across rendered surfaces", () => {
    const lamplight = loadTheme("lamplight");
    const solarium = loadTheme("solarium");

    const renderLamplightArea = () =>
      renderToStaticMarkup(
        createElement(AreaCard, {
          area: "memories",
          sentence: "The last one you kept: Summer afternoon.",
          photo: resolveAreaPhoto(lamplight, "memories"),
        }),
      );

    const renderSolariumArea = () =>
      renderToStaticMarkup(
        createElement(AreaCard, {
          area: "memories",
          sentence: "The last one you kept: Summer afternoon.",
          photo: resolveAreaPhoto(solarium, "memories"),
        }),
      );

    // Verifies structural DOM equality and absence of spacing token interference
    expect(() => {
      assertNoLayoutShift(renderLamplightArea, lamplight, renderSolariumArea, solarium);
    }).not.toThrow();

    const structureLamplight = extractLayoutStructure(renderLamplightArea());
    const structureSolarium = extractLayoutStructure(renderSolariumArea());
    expect(structureLamplight).toEqual(structureSolarium);
  });

  it("switching theme moves no layout on QuietState and OpenToday hero surfaces", () => {
    const lamplight = loadTheme("lamplight");
    const solarium = loadTheme("solarium");

    // QuietState comparison
    const renderLamplightQuiet = () =>
      renderToStaticMarkup(createElement(QuietState, { photo: resolveAreaPhoto(lamplight, "memories") }));
    const renderSolariumQuiet = () =>
      renderToStaticMarkup(createElement(QuietState, { photo: resolveAreaPhoto(solarium, "memories") }));

    expect(() => {
      assertNoLayoutShift(renderLamplightQuiet, lamplight, renderSolariumQuiet, solarium);
    }).not.toThrow();

    const quietStructureA = extractLayoutStructure(renderLamplightQuiet());
    const quietStructureB = extractLayoutStructure(renderSolariumQuiet());
    expect(quietStructureA).toEqual(quietStructureB);

    // OpenToday comparison
    const sampleItems = [
      {
        id: "body-dentist",
        area: "body",
        kind: "task",
        title: "Dentist checkup",
        due_field: "due",
        due_value: "2026-10-01",
        status: "upcoming" as const,
      },
    ];

    const renderLamplightOpen = () =>
      renderToStaticMarkup(createElement(OpenToday, { items: sampleItems, photo: resolveAreaPhoto(lamplight, "body") }));
    const renderSolariumOpen = () =>
      renderToStaticMarkup(createElement(OpenToday, { items: sampleItems, photo: resolveAreaPhoto(solarium, "body") }));

    expect(() => {
      assertNoLayoutShift(renderLamplightOpen, lamplight, renderSolariumOpen, solarium);
    }).not.toThrow();

    const openStructureA = extractLayoutStructure(renderLamplightOpen());
    const openStructureB = extractLayoutStructure(renderSolariumOpen());
    expect(openStructureA).toEqual(openStructureB);
  });

  it("detects deliberate layout shift: structural DOM change makes the check fail", () => {
    const lamplight = loadTheme("lamplight");
    const solarium = loadTheme("solarium");

    const renderNormal = () =>
      '<section class="today"><div class="plate plate--hero"><div class="content">Content</div></div></section>';
    const renderShifted = () =>
      '<section class="today shifted"><div class="plate plate--hero"><div class="extra-column">Shift</div></div></section>';

    expect(() => {
      assertNoLayoutShift(renderNormal, lamplight, renderShifted, solarium);
    }).toThrow(/Layout shift detected/i);
  });

  it("detects deliberate layout shift: changing a spacing token in a theme makes the check fail", () => {
    const lamplight = loadTheme("lamplight");

    // Create a rogue theme that attempts to tamper with spacing/layout
    const rogueTheme: ThemeManifest = {
      ...lamplight,
      name: "Rogue Spacing Theme",
      colors: {
        ...lamplight.colors,
        light: {
          ...lamplight.colors.light,
          bg: "#ffffff",
          surface: "#ffffff",
          surfaceStrong: "#ffffff",
          border: "#ffffff",
          ink: "#000000",
          inkMuted: "#333333",
          forest: "#111111",
          forestStrong: "#000000",
          forestInk: "#ffffff",
          forestInkMuted: "#cccccc",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
          // Deliberate spacing token injection:
          "--spacing-card": "48px",
        },
      },
    };

    // The validator rejects it
    expect(() => validateThemeManifest(rogueTheme)).toThrow(/spacing/i);

    // And the layout shift detector rejects it
    const renderFn = () => "<div></div>";
    expect(() => {
      assertNoLayoutShift(renderFn, lamplight, renderFn, rogueTheme);
    }).toThrow(/Layout shift.*spacing/i);
  });
});

describe("Done-when: a theme missing an image degrades gracefully instead of rendering a broken slot", () => {
  it("area slot without an image degrades gracefully to the drawn scene with descriptive alt", () => {
    const themeWithoutImages: ThemeManifest = {
      name: "Minimalist Theme",
      id: "minimalist",
      mode: "both",
      typography: { sans: "sans-serif" },
      colors: {
        light: {
          bg: "#ffffff",
          surface: "#f0f0f0",
          surfaceStrong: "#e0e0e0",
          border: "#cccccc",
          ink: "#111111",
          inkMuted: "#555555",
          forest: "#222222",
          forestStrong: "#111111",
          forestInk: "#ffffff",
          forestInkMuted: "#aaaaaa",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
        },
        dark: {
          bg: "#111111",
          surface: "#222222",
          surfaceStrong: "#333333",
          border: "#444444",
          ink: "#eeeeee",
          inkMuted: "#aaaaaa",
          forest: "#111111",
          forestStrong: "#000000",
          forestInk: "#ffffff",
          forestInkMuted: "#888888",
          terracotta: "#777777",
          sage: "#777777",
          dustyRose: "#777777",
          plum: "#777777",
          plumInk: "#ffffff",
          accentText: "#777777",
          accentUi: "#777777",
          scriptText: "#777777",
        },
      },
      images: {
        areas: {}, // No area images defined
      },
    };

    const resolved = resolveAreaPhoto(themeWithoutImages, "memories");
    expect(resolved).toBeUndefined();

    // Render AreaCard with this resolved photo
    const html = renderToStaticMarkup(
      createElement(AreaCard, {
        area: "memories",
        sentence: "The last one you kept: A sunny memory.",
        photo: resolved,
      }),
    );

    // Degradation proof: contains SVG scene and screen reader description, no broken img
    expect(html).toContain('class="scene scene--memories');
    expect(html).toContain("A drawn scene of an open photo album");
    expect(html).not.toContain("<img");
  });

  it("non-existent image file in theme manifest degrades gracefully to drawn scene", () => {
    const themeWithGhostImage: ThemeManifest = {
      name: "Ghost Image Theme",
      id: "ghost",
      mode: "light-only",
      typography: { sans: "sans-serif" },
      colors: {
        light: {
          bg: "#ffffff",
          surface: "#f0f0f0",
          surfaceStrong: "#e0e0e0",
          border: "#cccccc",
          ink: "#111111",
          inkMuted: "#555555",
          forest: "#222222",
          forestStrong: "#111111",
          forestInk: "#ffffff",
          forestInkMuted: "#aaaaaa",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
        },
      },
      images: {
        areas: {
          money: {
            src: "non_existent_file_path_12345.jpg",
            alt: "A non-existent photo",
            license: "Public Domain",
          },
        },
      },
    };

    const resolved = resolveAreaPhoto(themeWithGhostImage, "money");
    expect(resolved).toBeUndefined();

    const html = renderToStaticMarkup(
      createElement(Plate, {
        image: { alt: "Fallback alt" },
        scene: "money",
        variant: "print",
      }),
    );
    expect(html).toContain('class="scene scene--money');
    expect(html).not.toContain("<img");
  });
});

describe("Done-when: validation rejects a theme with an image that has no licence line", () => {
  it("rejects manifest when an area image has no licence line", () => {
    const invalidTheme = {
      name: "Unlicensed Theme",
      id: "unlicensed",
      mode: "light-only",
      typography: { sans: "sans-serif" },
      colors: {
        light: {
          bg: "#ffffff",
          surface: "#f0f0f0",
          surfaceStrong: "#e0e0e0",
          border: "#cccccc",
          ink: "#111111",
          inkMuted: "#555555",
          forest: "#222222",
          forestStrong: "#111111",
          forestInk: "#ffffff",
          forestInkMuted: "#aaaaaa",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
        },
      },
      images: {
        areas: {
          memories: {
            src: "images/areas/memories.jpg",
            alt: "A memory photo without licence",
            // missing licence!
          },
        },
      },
    };

    expect(() => validateThemeManifest(invalidTheme)).toThrow(/Licence line is required/i);
  });

  it("rejects manifest when an area image has an empty licence string", () => {
    const invalidTheme = {
      name: "Empty License Theme",
      id: "empty-license",
      mode: "light-only",
      typography: { sans: "sans-serif" },
      colors: {
        light: {
          bg: "#ffffff",
          surface: "#f0f0f0",
          surfaceStrong: "#e0e0e0",
          border: "#cccccc",
          ink: "#111111",
          inkMuted: "#555555",
          forest: "#222222",
          forestStrong: "#111111",
          forestInk: "#ffffff",
          forestInkMuted: "#aaaaaa",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
        },
      },
      images: {
        hero: [
          {
            src: "images/hero/room.jpg",
            alt: "A hero photo with whitespace license",
            license: "   ",
          },
        ],
      },
    };

    expect(() => validateThemeManifest(invalidTheme)).toThrow(/Licence line is required/i);
  });
});

describe("Done-when: validation rejects a theme that silently ships only light and has not declared that it commits to one mode", () => {
  it("rejects manifest that supplies only light without declaring mode commitment", () => {
    const silentLightOnly = {
      name: "Silent Light Theme",
      id: "silent-light",
      // mode is omitted or "both", but dark is absent!
      typography: { sans: "sans-serif" },
      colors: {
        light: {
          bg: "#ffffff",
          surface: "#f0f0f0",
          surfaceStrong: "#e0e0e0",
          border: "#cccccc",
          ink: "#111111",
          inkMuted: "#555555",
          forest: "#222222",
          forestStrong: "#111111",
          forestInk: "#ffffff",
          forestInkMuted: "#aaaaaa",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
        },
      },
    };

    expect(() => validateThemeManifest(silentLightOnly)).toThrow(
      /Theme silently ships only light mode without declaring commitment to a single mode \('light-only'\)/i,
    );
  });

  it("accepts manifest that explicitly declares mode commitment: light-only", () => {
    const declaredLightOnly = {
      name: "Explicit Light Theme",
      id: "explicit-light",
      mode: "light-only" as const,
      typography: { sans: "sans-serif" },
      colors: {
        light: {
          bg: "#ffffff",
          surface: "#f0f0f0",
          surfaceStrong: "#e0e0e0",
          border: "#cccccc",
          ink: "#111111",
          inkMuted: "#555555",
          forest: "#222222",
          forestStrong: "#111111",
          forestInk: "#ffffff",
          forestInkMuted: "#aaaaaa",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
        },
      },
    };

    const validated = validateThemeManifest(declaredLightOnly);
    expect(validated.mode).toBe("light-only");
    expect(validated.colors.light).toBeDefined();
    expect(validated.colors.dark).toBeUndefined();
  });

  it("accepts manifest that declares both light and dark palettes", () => {
    const bothModes = {
      name: "Dual Mode Theme",
      id: "dual-mode",
      mode: "both" as const,
      typography: { sans: "sans-serif" },
      colors: {
        light: {
          bg: "#ffffff",
          surface: "#f0f0f0",
          surfaceStrong: "#e0e0e0",
          border: "#cccccc",
          ink: "#111111",
          inkMuted: "#555555",
          forest: "#222222",
          forestStrong: "#111111",
          forestInk: "#ffffff",
          forestInkMuted: "#aaaaaa",
          terracotta: "#888888",
          sage: "#888888",
          dustyRose: "#888888",
          plum: "#888888",
          plumInk: "#ffffff",
          accentText: "#888888",
          accentUi: "#888888",
          scriptText: "#888888",
        },
        dark: {
          bg: "#111111",
          surface: "#222222",
          surfaceStrong: "#333333",
          border: "#444444",
          ink: "#eeeeee",
          inkMuted: "#aaaaaa",
          forest: "#111111",
          forestStrong: "#000000",
          forestInk: "#ffffff",
          forestInkMuted: "#888888",
          terracotta: "#777777",
          sage: "#777777",
          dustyRose: "#777777",
          plum: "#777777",
          plumInk: "#ffffff",
          accentText: "#777777",
          accentUi: "#777777",
          scriptText: "#777777",
        },
      },
    };

    const validated = validateThemeManifest(bothModes);
    expect(validated.colors.light).toBeDefined();
    expect(validated.colors.dark).toBeDefined();
  });
});

describe("Done-when: a user can point a slot at their own photograph without editing code", () => {
  it("resolves user photo file placed in user's life directory without editing code", () => {
    const tempLife = makeTempDir("user-photos");
    cleanupDirs.push(tempLife);

    // Create user photo in life folder: photos/areas/people.jpg
    const photosDir = path.join(tempLife, "photos", "areas");
    fs.mkdirSync(photosDir, { recursive: true });
    const userPhotoFile = path.join(photosDir, "people.jpg");
    fs.writeFileSync(userPhotoFile, "fake-jpeg-binary-content");

    const theme = loadTheme("lamplight");
    const resolved = resolveAreaPhoto(theme, "people", tempLife);

    expect(resolved).toBeDefined();
    expect(resolved?.src).toBe(userPhotoFile);
    expect(resolved?.alt).toContain("Personal photograph for people");

    // Rendering AreaCard with this resolved user photo renders <img>
    const html = renderToStaticMarkup(
      createElement(AreaCard, {
        area: "people",
        sentence: "Two friends caught up recently.",
        photo: resolved,
      }),
    );
    expect(html).toContain(`<img class="plate__image" src="${userPhotoFile}"`);
  });

  it("resolves user photo specified via user's life theme.json without editing code", () => {
    const tempLife = makeTempDir("user-config");
    cleanupDirs.push(tempLife);

    // Create user configuration: <lifeRoot>/theme.json
    const userConfig = {
      images: {
        areas: {
          money: {
            src: "/custom/path/to/my-bank-savings-jar.jpg",
            alt: "My ceramic savings jar on the windowsill",
            license: "My own photo",
          },
        },
      },
    };
    fs.writeFileSync(path.join(tempLife, "theme.json"), JSON.stringify(userConfig));

    const theme = loadTheme("lamplight");
    const resolved = resolveAreaPhoto(theme, "money", tempLife);

    expect(resolved).toBeDefined();
    expect(resolved?.src).toBe("/custom/path/to/my-bank-savings-jar.jpg");
    expect(resolved?.alt).toBe("My ceramic savings jar on the windowsill");
    expect(resolved?.license).toBe("My own photo");

    const html = renderToStaticMarkup(
      createElement(AreaCard, {
        area: "money",
        sentence: "Savings are on track.",
        photo: resolved,
      }),
    );
    expect(html).toContain(
      '<img class="plate__image" src="/custom/path/to/my-bank-savings-jar.jpg" alt="My ceramic savings jar on the windowsill"',
    );
  });
});

describe("Shipped themes and theme switching", () => {
  it("ships at least two themes: lamplight and solarium", () => {
    const available = listAvailableThemes();
    expect(available).toContain("lamplight");
    expect(available).toContain("solarium");
    expect(available.length).toBeGreaterThanOrEqual(2);
  });

  it("both shipped themes pass schema validation and provide complete manifests", () => {
    for (const id of ["lamplight", "solarium"]) {
      const theme = loadTheme(id);
      expect(theme.name).toBeDefined();
      expect(theme.id).toBe(id);
      expect(theme.colors.light).toBeDefined();
      expect(theme.colors.dark).toBeDefined();
      expect(theme.typography.sans).toBeDefined();

      // Every image declared in both shipped themes must carry a license line
      if (theme.images?.hero) {
        for (const hero of theme.images.hero) {
          expect(hero.license.trim().length).toBeGreaterThan(0);
        }
      }
      if (theme.images?.areas) {
        for (const [, slot] of Object.entries(theme.images.areas)) {
          expect(slot.license.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("a theme id is a directory name, not a path: traversal is rejected", () => {
    for (const hostile of [
      "../../../etc",
      "..",
      "/etc/passwd",
      "lamplight/../../secrets",
      "",
      "Lamplight",
    ]) {
      expect(() => loadTheme(hostile)).toThrow(/Invalid theme id/);
    }

    // The legitimate ids still load.
    expect(loadTheme("lamplight").id).toBe("lamplight");
    expect(loadTheme("solarium").id).toBe("solarium");
  });

  it("an unloadable active theme falls back to the default rather than throwing", () => {
    process.env.WEALLHATELIFE_THEME = "../../../etc";
    expect(getActiveTheme().id).toBe("lamplight");
  });

  it("theme switching touches no component: changing environment variable switches the active theme", () => {
    process.env.WEALLHATELIFE_THEME = "solarium";
    const active = getActiveTheme();
    expect(active.id).toBe("solarium");
    expect(active.name).toBe("Solarium");

    delete process.env.WEALLHATELIFE_THEME;
    const defaultTheme = getActiveTheme();
    expect(defaultTheme.id).toBe("lamplight");
  });
});
