// The layer boundaries as code. docs/ARCHITECTURE.md §2 promises that "a
// dependency test in CI enforces the direction"; this is that test, and it
// runs in the same `npm test` the build job already runs.
//
// It reads the import graph and nothing else, and that is the whole of its
// reach. It catches a module that crosses a boundary by importing across
// it — which is how every crossing would plausibly be written. It does not
// catch disk opened for us by a dependency that takes a path, and it does
// not recognise a second copy of the entry format written under a different
// set of names. AGENTS.md draws the same line in the same words; if this
// file changes, that paragraph changes with it.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..");

/**
 * Shipped source, one directory per layer. `tests/` is deliberately absent:
 * test scaffolding builds and removes throwaway lives, so it opens files
 * directly and always will.
 */
const LAYERS = ["app", "components", "lib", "mcp", "scripts"] as const;
type Layer = (typeof LAYERS)[number];

/**
 * Which layers a layer may import from. The shape is the architecture:
 * `lib` is the core and sees nothing above it, everything else reaches a
 * life only by going through `lib`, and only the website's own layers know
 * the design system exists.
 */
const MAY_IMPORT: Record<Layer, readonly Layer[]> = {
  lib: ["lib"],
  mcp: ["mcp", "lib"],
  app: ["app", "components", "lib"],
  components: ["components", "lib"],
  scripts: ["scripts", "lib"],
};

/**
 * Modules that open a file, or that read the format a life is stored in.
 *
 * `gray-matter` is here for the second reason as well as the first
 * (`matter.read()` takes a path): front matter is the shape of an entry on
 * disk, and a second module parsing it is a second definition of the
 * format, wherever that module lives.
 */
const DISK_MODULES = new Set([
  "fs",
  "node:fs",
  "fs/promises",
  "node:fs/promises",
  "node:sqlite",
  "better-sqlite3",
  "graceful-fs",
  "fs-extra",
  "gray-matter",
]);

/** Declared in `lib/entry/schema.ts`, imported everywhere else. */
const SCHEMA_MODULE = "lib/entry/schema.ts";
const VOCABULARY = ["AREAS", "KINDS", "AREA_FOR_KIND", "entrySchema"] as const;

function repoRelative(absolute: string): string {
  return path.relative(REPO_ROOT, absolute).split(path.sep).join("/");
}

function listSourceFiles(layer: Layer): string[] {
  const root = path.join(REPO_ROOT, layer);
  if (!fs.existsSync(root)) return [];
  const found: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, dirent.name);
      if (dirent.isDirectory()) stack.push(full);
      else if (/\.tsx?$/.test(dirent.name)) found.push(repoRelative(full));
    }
  }
  return found.sort();
}

/**
 * Removes comments while leaving string and template literals intact, so a
 * boundary written *about* in a comment is never mistaken for one crossed
 * in code. A regex over raw source would report the prose at the top of
 * this file.
 */
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === "//") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (two === "/*") {
      i += 2;
      while (i < source.length && source.slice(i, i + 2) !== "*/") i += 1;
      i += 2;
      continue;
    }
    const char = source[i] as string;
    if (char === '"' || char === "'" || char === "`") {
      out += char;
      i += 1;
      while (i < source.length) {
        const inner = source[i] as string;
        out += inner;
        i += 1;
        if (inner === "\\") {
          out += source[i] ?? "";
          i += 1;
          continue;
        }
        if (inner === char) break;
      }
      continue;
    }
    out += char;
    i += 1;
  }
  return out;
}

function readSource(repoRelFile: string): string {
  return stripComments(fs.readFileSync(path.join(REPO_ROOT, repoRelFile), "utf8"));
}

const SPECIFIER_PATTERNS = [
  /\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']/g,
  /\brequire\s*\(\s*["']([^"']+)["']/g,
];

function importSpecifiers(repoRelFile: string): string[] {
  const source = readSource(repoRelFile);
  const specifiers = new Set<string>();
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      specifiers.add(match[1] as string);
    }
  }
  return [...specifiers];
}

/**
 * The repository path a specifier points at, or `null` for a package. Both
 * spellings resolve: a relative path, and the `@/` alias `tsconfig.json`
 * maps to the repository root.
 */
function resolveWithinRepo(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return specifier.slice(2);
  if (!specifier.startsWith(".")) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
}

function layerOf(repoRelPath: string): string {
  return repoRelPath.split("/")[0] as string;
}

/** `better-sqlite3/lib/database` is the same dependency as `better-sqlite3`. */
function packageRoot(specifier: string): string {
  if (specifier.startsWith("node:")) return specifier;
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) return parts.slice(0, 2).join("/");
  return parts[0] as string;
}

function declares(source: string, name: string): boolean {
  return new RegExp(`\\b(?:const|let|var|function|class|type|interface|enum)\\s+${name}\\b`).test(
    source,
  );
}

const FILES: Record<Layer, string[]> = {
  app: listSourceFiles("app"),
  components: listSourceFiles("components"),
  lib: listSourceFiles("lib"),
  mcp: listSourceFiles("mcp"),
  scripts: listSourceFiles("scripts"),
};

describe("the layers import in one direction only", () => {
  it("finds source in every layer, so an empty walk cannot pass as a clean one", () => {
    for (const layer of LAYERS) {
      expect({ layer, hasSource: FILES[layer].length > 0 }).toEqual({ layer, hasSource: true });
    }
  });

  it("lib/ imports nothing from app/, components/, mcp/ or scripts/", () => {
    // Stated on its own because it is the rule the architecture names: the
    // moment lib/ imports upwards it stops being a core whose guarantees
    // every other path inherits.
    const upward: string[] = [];
    for (const file of FILES.lib) {
      for (const specifier of importSpecifiers(file)) {
        const target = resolveWithinRepo(file, specifier);
        if (target === null || layerOf(target) === "lib") continue;
        upward.push(`${file} imports "${specifier}"`);
      }
    }
    expect(upward).toEqual([]);
  });

  it("no module imports a layer it is not allowed to see", () => {
    const crossings: string[] = [];
    for (const layer of LAYERS) {
      for (const file of FILES[layer]) {
        for (const specifier of importSpecifiers(file)) {
          const target = resolveWithinRepo(file, specifier);
          if (target === null) continue;
          const targetLayer = layerOf(target);
          if (MAY_IMPORT[layer].includes(targetLayer as Layer)) continue;
          crossings.push(`${file} imports "${specifier}" (${targetLayer})`);
        }
      }
    }
    expect(crossings).toEqual([]);
  });
});

describe("only lib/ opens a file", () => {
  it("no module outside lib/ imports a filesystem, database or front-matter module", () => {
    const offenders: string[] = [];
    for (const layer of LAYERS) {
      if (layer === "lib") continue;
      for (const file of FILES[layer]) {
        for (const specifier of importSpecifiers(file)) {
          if (DISK_MODULES.has(packageRoot(specifier))) {
            offenders.push(`${file} imports "${specifier}"`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("lib/ does open files, so the rule above is a boundary and not an absence", () => {
    const opened = FILES.lib.flatMap(importSpecifiers).map(packageRoot);
    expect(opened.some((specifier) => DISK_MODULES.has(specifier))).toBe(true);
  });
});

describe("the entry format is defined once", () => {
  it("lib/entry/schema.ts declares the whole entry vocabulary", () => {
    const source = readSource(SCHEMA_MODULE);
    for (const name of VOCABULARY) {
      expect({ name, declared: declares(source, name) }).toEqual({ name, declared: true });
    }
  });

  it("no other module declares its own copy of it", () => {
    const duplicates: string[] = [];
    for (const layer of LAYERS) {
      for (const file of FILES[layer]) {
        if (file === SCHEMA_MODULE) continue;
        const source = readSource(file);
        for (const name of VOCABULARY) {
          if (declares(source, name)) duplicates.push(`${file} declares ${name}`);
        }
      }
    }
    expect(duplicates).toEqual([]);
  });
});

describe("the agent-facing surface has no way to delete", () => {
  // The exact tool list is asserted over the wire in mcp-server.test.ts.
  // This reads the source instead, so a tool that removes is caught before
  // it is ever registered — and, with the filesystem rule above, mcp/ has
  // no removal API of its own to reach for in the first place.
  const toolFiles = FILES.mcp.filter((file) => file.startsWith("mcp/tools/"));
  const NAMED_FOR_REMOVAL = /delete|destroy|purge|erase|unlink|remove/i;

  it("finds the tool modules", () => {
    expect(toolFiles.length).toBeGreaterThan(0);
  });

  it("no tool is named for removal", () => {
    const named: string[] = [];
    for (const file of toolFiles) {
      for (const match of readSource(file).matchAll(/\bname\s*=\s*["']([^"']+)["']/g)) {
        const toolName = match[1] as string;
        if (NAMED_FOR_REMOVAL.test(toolName)) named.push(`${file}: ${toolName}`);
      }
    }
    expect(named).toEqual([]);
  });
});
