// The guilt constraints as code, not documentation (docs/ROADMAP.md step 4,
// "Done: … the component library contains no badge, ring or content-state
// red"). Nothing here is a review rule someone has to remember — a design
// system with no red badge component cannot grow one by accident
// (docs/STRUCTURE.md).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..");
const COMPONENTS_ROOT = path.join(REPO_ROOT, "components");

function listAllFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const results: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    // biome-ignore lint: stack is non-empty, checked by the while condition
    const dir = stack.pop()!;
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        stack.push(full);
      } else if (dirent.isFile()) {
        results.push(full);
      }
    }
  }
  return results;
}

// Names a forbidden primitive would plausibly be given, whatever a future
// contributor calls their variable or component.
const FORBIDDEN_NAME_PATTERNS: RegExp[] = [
  /badge/i,
  /streak/i,
  /progress-?ring/i,
  /\bscore\b/i,
  /\brank(ing)?\b/i,
];

describe("the design system cannot grow the guilt mechanics the spec forbids", () => {
  const files = listAllFiles(COMPONENTS_ROOT);
  const sourceFiles = files.filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  const cssFiles = files.filter((f) => f.endsWith(".css"));

  it("components/ exists and holds the design system's primitives", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("no component is named after a forbidden primitive", () => {
    for (const file of files) {
      const base = path.basename(file);
      for (const pattern of FORBIDDEN_NAME_PATTERNS) {
        expect(base).not.toMatch(pattern);
      }
    }
  });

  it("no component source defines a badge, streak, ring, score or ranking", () => {
    for (const file of sourceFiles) {
      const text = fs.readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_NAME_PATTERNS) {
        expect(text).not.toMatch(pattern);
      }
    }
  });

  it("no numeric count of open/waiting items is rendered anywhere in a component", () => {
    // "3 things could use you" is fine coming out of the MCP tool
    // (mcp/tools/whats-open.ts) — an agent reading it is not the guilt
    // mechanic the spec forbids. It must never appear on a page a person
    // looks at (docs/SPEC.md §13, "no counts or badges").
    for (const file of sourceFiles) {
      const text = fs.readFileSync(file, "utf8");
      expect(text).not.toMatch(/\bthings? (could use|need|waiting for) you\b/i);
      expect(text).not.toMatch(/\$\{items\.length\}/);
    }
  });

  it("tokens.css declares no error/danger/alert colour token", () => {
    const tokens = fs.readFileSync(
      path.join(COMPONENTS_ROOT, "primitives", "tokens.css"),
      "utf8",
    );
    expect(tokens).not.toMatch(/--color-(error|danger|alert|red)\b/);
  });

  it("no colour declared anywhere in components/ reads as an alert red", () => {
    // A saturated alert red has a red channel far above both green and
    // blue. The product's warm accents (terracotta, dusty rose) are warm but
    // muted — their green and blue channels stay much closer to red than
    // an alert red's do — so this check does not just forbid the word
    // "red", it forbids the hue.
    for (const file of cssFiles) {
      const text = fs.readFileSync(file, "utf8");
      const hexColors = text.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
      for (const hex of hexColors) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const isAlertRed = r > 190 && g < 90 && b < 90;
        expect({ hex, isAlertRed }).toEqual({ hex, isAlertRed: false });
      }
    }
  });
});
